import { ref, watch } from "vue";
import type { Ref } from "vue";
import { ApiError, httpGet } from "@/shared/api/http";
import { defaultPromptPathForRole } from "@/shared/lib/use-swarm-defaults";
import { useI18n } from "@/shared/lib/i18n";

export function useRolePromptPreview(previewRoleId: Ref<string>) {
  const { t } = useI18n();
  const promptBody = ref<string>("");
  const promptLoading = ref(false);
  const promptError = ref<string>("");
  const promptCache = new Map<string, string>();

  async function loadPromptFor(roleId: string): Promise<void> {
    promptError.value = "";
    promptBody.value = "";
    if (!roleId) return;
    const promptPath = defaultPromptPathForRole(roleId);
    if (!promptPath) {
      promptError.value = t("rolePicker.previewMissing");
      return;
    }
    const cached = promptCache.get(promptPath);
    if (cached !== undefined) {
      promptBody.value = cached;
      return;
    }
    promptLoading.value = true;
    try {
      const data = await httpGet<{ body?: string }>(
        `/v1/prompts/get?path=${encodeURIComponent(promptPath)}`,
      );
      const body = (data?.body ?? "").trim();
      promptCache.set(promptPath, body);
      if (roleId === previewRoleId.value) {
        promptBody.value = body;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        promptError.value = t("rolePicker.previewMissing");
        return;
      }
      promptError.value = err instanceof Error ? err.message : String(err);
    } finally {
      promptLoading.value = false;
    }
  }

  watch(previewRoleId, (next) => {
    void loadPromptFor(next);
  });

  return { promptBody, promptLoading, promptError, loadPromptFor };
}
