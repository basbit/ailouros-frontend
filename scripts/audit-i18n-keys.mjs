#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const I18N_DIR = join(ROOT, "src/shared/lib/i18n");
const SRC_DIR = join(ROOT, "src");
const KEY_LITERAL_PATTERN = /"([a-zA-Z][\w.-]*)"\s*:/g;
const KEY_REFERENCE_PATTERN = /\bt\(\s*["'`]([\w.-]+)["'`]/g;
const TRANSLATE_REFERENCE_PATTERN = /\btranslate\(\s*["'`]([\w.-]+)["'`]/g;
const KEY_TEMPLATE_PATTERN = /`([\w.-]+\$\{[^}]+\}[\w.-]*(?:\$\{[^}]+\}[\w.-]*)*)`/g;
const KEY_RETURN_TEMPLATE_PATTERN = /return\s*`([\w.-]+\$\{[^}]+\}[\w.-]*)`/g;

function walkTsFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === "src-tauri") continue;
      found.push(...walkTsFiles(fullPath));
      continue;
    }
    if (/\.(ts|vue)$/.test(entry) && !/\.test\.ts$/.test(entry)) {
      found.push(fullPath);
    }
  }
  return found;
}

function collectDefinedKeys() {
  const defined = new Set();
  for (const file of walkTsFiles(I18N_DIR)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(KEY_LITERAL_PATTERN)) {
      defined.add(match[1]);
    }
  }
  return defined;
}

function templateToRegExp(template) {
  const escapedSegments = template
    .split(/\$\{[^}]+\}/g)
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const body = escapedSegments.join("[^.`]+");
  return new RegExp("^" + body + "$");
}

function collectReferencedKeys(definedKeys) {
  const referenced = new Map();
  const templateExpressions = [];
  const literalKeyPattern = /["'`]([a-z][\w-]*(?:\.[a-z][\w-]*)+)["'`]/gi;
  for (const file of walkTsFiles(SRC_DIR)) {
    if (file.startsWith(I18N_DIR)) continue;
    const text = readFileSync(file, "utf8");
    const patterns = [KEY_REFERENCE_PATTERN, TRANSLATE_REFERENCE_PATTERN];
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const key = match[1];
        if (!referenced.has(key)) referenced.set(key, new Set());
        referenced.get(key).add(relative(ROOT, file));
      }
    }
    for (const match of text.matchAll(KEY_TEMPLATE_PATTERN)) {
      const template = match[1];
      if (!template.includes(".")) continue;
      if (!/^[a-z]/i.test(template)) continue;
      templateExpressions.push(templateToRegExp(template));
    }
    for (const match of text.matchAll(KEY_RETURN_TEMPLATE_PATTERN)) {
      const template = match[1];
      if (!template.includes(".")) continue;
      templateExpressions.push(templateToRegExp(template));
    }
    for (const match of text.matchAll(literalKeyPattern)) {
      const candidate = match[1];
      if (!definedKeys.has(candidate)) continue;
      if (!referenced.has(candidate)) referenced.set(candidate, new Set());
      referenced.get(candidate).add(relative(ROOT, file));
    }
  }
  return { referenced, templateExpressions };
}

function isKeyMatchedByTemplate(key, templateExpressions) {
  for (const expr of templateExpressions) {
    if (expr.test(key)) return true;
  }
  return false;
}

function main() {
  const defined = collectDefinedKeys();
  const { referenced, templateExpressions } = collectReferencedKeys(defined);
  const missing = [];
  for (const [key, files] of referenced) {
    if (!defined.has(key)) missing.push({ key, files: [...files] });
  }
  const unused = [];
  for (const key of defined) {
    if (referenced.has(key)) continue;
    if (isKeyMatchedByTemplate(key, templateExpressions)) continue;
    unused.push(key);
  }
  let exitCode = 0;
  if (missing.length) {
    console.error(`i18n: ${missing.length} keys referenced but not defined:`);
    for (const { key, files } of missing) {
      console.error(`  ${key}  (in ${files.slice(0, 3).join(", ")}${files.length > 3 ? ", ..." : ""})`);
    }
    exitCode = 1;
  }
  if (unused.length) {
    console.warn(`i18n: ${unused.length} keys defined but never referenced:`);
    for (const key of unused.slice(0, 50)) console.warn(`  ${key}`);
    if (unused.length > 50) console.warn(`  ... ${unused.length - 50} more`);
  }
  if (!missing.length && !unused.length) {
    console.log("i18n: all keys referenced and defined symmetrically.");
  }
  process.exit(exitCode);
}

main();
