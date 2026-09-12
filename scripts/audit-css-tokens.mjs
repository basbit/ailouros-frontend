#!/usr/bin/env node
/**
 * Fails when a `var(--token)` names a custom property that is defined nowhere.
 *
 * Such a token silently falls through to its hardcoded fallback. Several
 * features shipped that way and rendered in the Tailwind slate palette inside
 * this app's warm cream / vermillion theme — a failure mode that typecheck,
 * eslint and every component test are blind to, because the CSS is valid.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC_DIR = join(ROOT, "src");

/** `--foo: value` in a stylesheet, and `"--foo": value` in an inline binding. */
const DEFINITION_PATTERN = /(?:^|[\s{;"'])(--[a-z0-9-]+)\s*"?\s*:/gim;
const USAGE_PATTERN = /var\(\s*(--[a-z0-9-]+)/gi;

function walkStyleFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === "src-tauri") continue;
      walkStyleFiles(fullPath, found);
      continue;
    }
    if (/\.(vue|css|ts)$/.test(entry)) found.push(fullPath);
  }
  return found;
}

const defined = new Set();
const used = new Map();

for (const file of walkStyleFiles(SRC_DIR)) {
  const contents = readFileSync(file, "utf8");
  for (const match of contents.matchAll(DEFINITION_PATTERN)) defined.add(match[1]);
  for (const match of contents.matchAll(USAGE_PATTERN)) {
    const sites = used.get(match[1]) ?? new Set();
    sites.add(relative(ROOT, file));
    used.set(match[1], sites);
  }
}

if (defined.size < 20 || used.size < 20) {
  console.error(
    `audit-css-tokens: scan looks broken (${defined.size} definitions, ` +
      `${used.size} usages) — refusing to report success.`,
  );
  process.exit(2);
}

const undefinedTokens = [...used.keys()].filter((token) => !defined.has(token)).sort();

if (undefinedTokens.length > 0) {
  console.error("audit-css-tokens: these var(--token) names are defined nowhere,");
  console.error("so their hardcoded fallback is what actually renders:\n");
  for (const token of undefinedTokens) {
    console.error(`  ${token}`);
    for (const site of [...used.get(token)].sort()) console.error(`      ${site}`);
  }
  console.error(
    "\nMap each onto a canonical token from src/app/styles/tokens.css, or add" +
      "\nan alias in the compatibility block in src/app/styles/app.css.",
  );
  process.exit(1);
}

console.log(
  `audit-css-tokens: OK — ${used.size} distinct tokens used, all defined ` +
    `(${defined.size} definitions).`,
);
