import { describe, it, expect } from "vitest";

import { shouldRunSettingsHotReload } from "./use-settings-hot-reload";

const base = {
  booting: false,
  running: false,
  pendingSave: false,
  editingField: false,
  documentHidden: false,
};

describe("shouldRunSettingsHotReload", () => {
  it("runs when idle and nothing blocks it", () => {
    expect(shouldRunSettingsHotReload(base)).toBe(true);
  });

  it("does NOT run while there are unsaved edits (pending debounced save)", () => {
    // Root cause of the row-deletion bug: reloading the project file mid-edit
    // overwrites unsaved local state.
    expect(shouldRunSettingsHotReload({ ...base, pendingSave: true })).toBe(false);
  });

  it("does NOT run while the user is actively editing a form field", () => {
    expect(shouldRunSettingsHotReload({ ...base, editingField: true })).toBe(false);
  });

  it("does NOT run while booting / running / hidden", () => {
    expect(shouldRunSettingsHotReload({ ...base, booting: true })).toBe(false);
    expect(shouldRunSettingsHotReload({ ...base, running: true })).toBe(false);
    expect(shouldRunSettingsHotReload({ ...base, documentHidden: true })).toBe(false);
  });
});
