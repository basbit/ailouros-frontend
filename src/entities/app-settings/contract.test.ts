import { describe, expect, it } from "vitest";

/**
 * FSD dependency direction: `entities` sits below `app`, so nothing under
 * `src/entities` may name the app layer — including in a type position.
 * The settings contract used to be defined as the return type of an
 * app-layer composable via a type-only dynamic import, which kept the runtime
 * dependency checker green while inverting the layers and handing every
 * consumer the provider's whole return type.
 */
const entitySources = import.meta.glob("../**/*.{ts,vue}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Block comments may legitimately *describe* the old app-layer import. */
function withoutBlockComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("entities layer dependency direction", () => {
  it("sees the whole entities tree", () => {
    expect(Object.keys(entitySources).length).toBeGreaterThan(20);
  });

  it("no file under src/entities imports from the app layer", () => {
    const offenders = Object.entries(entitySources)
      .filter(([, source]) => /["'`]@\/app\//.test(withoutBlockComments(source)))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
