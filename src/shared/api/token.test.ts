import { beforeEach, describe, expect, it } from "vitest";
import {
  API_TOKEN_STORAGE_KEY,
  clearApiToken,
  getApiToken,
  setApiToken,
} from "./token";

describe("api token store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("has no token by default", () => {
    expect(getApiToken()).toBe("");
  });

  it("persists a token to localStorage and reads it back", () => {
    setApiToken("s3cret");
    expect(localStorage.getItem(API_TOKEN_STORAGE_KEY)).toBe("s3cret");
    expect(getApiToken()).toBe("s3cret");
  });

  it("trims surrounding whitespace", () => {
    setApiToken("  s3cret \n");
    expect(getApiToken()).toBe("s3cret");
  });

  it("clears the token", () => {
    setApiToken("s3cret");
    clearApiToken();
    expect(getApiToken()).toBe("");
    expect(localStorage.getItem(API_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("treats setting an empty token as clearing it", () => {
    setApiToken("s3cret");
    setApiToken("   ");
    expect(getApiToken()).toBe("");
  });
});
