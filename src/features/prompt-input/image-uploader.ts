import { httpPost } from "@/shared/api/http";
import { describeUploadError } from "@/shared/api/endpoints/asset-upload";
import type { ImageAttachment } from "@/shared/model/project-types";

const IMAGE_SUFFIXES = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);

export function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const suffix = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return IMAGE_SUFFIXES.has(suffix);
}

/** pm_vision tokenises the prompt on whitespace, so a pasted
 *  "Screenshot 2026-08-31 at 10.00.00.png" would never match os.path.isfile.
 *  Spaces collapse to dashes; a timestamp keeps concurrent pastes of the same
 *  buffer name (image.png) from silently overwriting each other on disk. */
export function sanitizeUploadName(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem =
    (dot > 0 ? name.slice(0, dot) : name)
      .replace(/\s+/g, "-")
      .replace(/[^A-Za-z0-9._-]/g, "")
      .slice(0, 80) || "image";
  const suffix = dot > 0 ? name.slice(dot).toLowerCase() : ".png";
  return stem + suffix;
}

export function timestampedName(name: string, at: number): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const suffix = dot > 0 ? name.slice(dot) : "";
  return `${stem}-${at}${suffix}`;
}

export interface ImageUploadOptions {
  workspaceRoot: string;
  /** Attached names already claimed (dedupe against the current chip list). */
  takenNames?: Set<string>;
  targetSubdir?: string;
}

export interface ImageUploadOutcome {
  accepted: ImageAttachment[];
  failed: { name: string; reason: string }[];
  takenNames: Set<string>;
}

/** Upload image files to the workspace and return request-only attachments.
 *
 * The backend stores the bytes and echoes an absolute path; pm_vision later
 * re-reads that path from the prompt, so the name inside ImageAttachment is
 * display-only while `path` is the load-bearing value.
 */
export async function uploadImageFiles(
  files: File[],
  options: ImageUploadOptions,
  at: number = Date.now(),
): Promise<ImageUploadOutcome> {
  const accepted: ImageAttachment[] = [];
  const failed: ImageUploadOutcome["failed"] = [];
  const taken = new Set(options.takenNames ?? []);

  for (const file of files) {
    const base = sanitizeUploadName(file.name || "image.png");
    // Stamp the batch time so two pastes of the same buffer name ("image.png")
    // never overwrite each other on disk — even across separate prompts.
    const stamped = timestampedName(base, at);
    let name = stamped;
    let counter = 2;
    while (taken.has(name)) {
      const dot = stamped.lastIndexOf(".");
      name = `${stamped.slice(0, dot)}-${counter}${stamped.slice(dot)}`;
      counter += 1;
    }

    const form = new FormData();
    form.append("workspace_root", options.workspaceRoot);
    form.append("target_subdir", options.targetSubdir || "assets");
    form.append("rename_to", name);
    form.append("upload", file, name);
    try {
      const data = await httpPost<{ absolute_path?: string; relative_path?: string }>(
        "/v1/assets/upload",
        form,
      );
      const absolutePath = String(data.absolute_path ?? "").trim();
      if (!absolutePath) {
        failed.push({ name: file.name, reason: "no-path" });
        continue;
      }
      taken.add(name);
      accepted.push({ name, path: absolutePath });
    } catch (err) {
      failed.push({ name: file.name, reason: describeUploadError(err) });
    }
  }
  return { accepted, failed, takenNames: taken };
}
