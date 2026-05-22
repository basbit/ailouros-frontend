#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCHEMA_PATH = join(ROOT, "../var/artifacts/openapi.json");
const TYPES_PATH = join(ROOT, "src/shared/api/openapi-types.ts");
const DUMP_SCRIPT = join(ROOT, "../scripts/dump_openapi.py");
const PYTHON_BIN = join(ROOT, "../.venv/bin/python");

function ensureSchema() {
  if (!existsSync(PYTHON_BIN)) {
    console.error(
      `openapi drift: python venv missing at ${PYTHON_BIN}. Run "make venv install" first.`,
    );
    process.exit(2);
  }
  mkdirSync(dirname(SCHEMA_PATH), { recursive: true });
  const backendRoot = join(ROOT, "..");
  execFileSync(PYTHON_BIN, [DUMP_SCRIPT, SCHEMA_PATH], {
    stdio: "inherit",
    cwd: backendRoot,
    env: { ...process.env, PYTHONPATH: backendRoot },
  });
}

function regenerateTypes() {
  execFileSync(
    "npx",
    ["openapi-typescript", SCHEMA_PATH, "--output", `${TYPES_PATH}.regenerated`],
    { encoding: "utf8" },
  );
  execFileSync(
    "npx",
    [
      "prettier",
      "--write",
      "--parser",
      "typescript",
      "--log-level",
      "silent",
      `${TYPES_PATH}.regenerated`,
    ],
    { encoding: "utf8", cwd: ROOT, stdio: "inherit" },
  );
}

function compareWithCommitted() {
  const regenerated = readFileSync(`${TYPES_PATH}.regenerated`, "utf8");
  if (!existsSync(TYPES_PATH)) {
    writeFileSync(TYPES_PATH, regenerated);
    console.log(`openapi drift: created ${TYPES_PATH} on first run.`);
    return 0;
  }
  const committed = readFileSync(TYPES_PATH, "utf8");
  if (committed === regenerated) {
    console.log("openapi drift: committed types match live FastAPI schema.");
    return 0;
  }
  console.error(
    `openapi drift: ${TYPES_PATH} is out of sync with backend OpenAPI schema. ` +
      "Run `npm run audit:openapi -- --write` to refresh, then commit.",
  );
  return 1;
}

function maybeWrite() {
  const regenerated = readFileSync(`${TYPES_PATH}.regenerated`, "utf8");
  writeFileSync(TYPES_PATH, regenerated);
  console.log(`openapi drift: wrote refreshed types to ${TYPES_PATH}.`);
}

function main() {
  const write = process.argv.includes("--write");
  ensureSchema();
  regenerateTypes();
  if (write) {
    maybeWrite();
    process.exit(0);
  }
  process.exit(compareWithCommitted());
}

main();
