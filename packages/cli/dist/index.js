#!/usr/bin/env node

// src/index.ts
import { readFileSync as readFileSync3 } from "fs";
import { resolve as resolve2 } from "path";
import { resolveKeykitSetup } from "@keykithq/sdk/project-config";

// src/pull.ts
import { mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
async function pullTranslationCatalog(options) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (options.environment && options.environment !== "production") {
    params.set("environment", options.environment);
  }
  if (options.version) {
    params.set("version", String(options.version));
  }
  const query = params.toString();
  const endpoint = `${baseUrl}/api/v1/projects/${encodeURIComponent(options.projectId)}/translations${query ? `?${query}` : ""}`;
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const response = await fetchImpl(endpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${options.token}` }
  });
  if (!response.ok) {
    throw new Error(
      `Keykit pull failed (${response.status}): ${await readError(response)}`
    );
  }
  const catalog = await response.json();
  if (!catalog?.locales || typeof catalog.locales !== "object") {
    throw new Error("Keykit pull returned an invalid catalog.");
  }
  const outDir = resolve(options.outDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "catalog.json"),
    `${JSON.stringify(catalog, null, 2)}
`,
    "utf8"
  );
  for (const [locale, translations] of Object.entries(catalog.locales)) {
    writeFileSync(
      join(outDir, `${locale}.json`),
      `${JSON.stringify(translations, null, 2)}
`,
      "utf8"
    );
  }
  return catalog;
}
async function readError(response) {
  try {
    const body = await response.json();
    if (typeof body.error === "string") {
      return body.error;
    }
  } catch {
  }
  return response.statusText || "Unknown error";
}

// src/rewrite.ts
import { readFileSync, readdirSync, statSync, writeFileSync as writeFileSync2 } from "fs";
import { extname, join as join2 } from "path";
var SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs"
]);
function rewriteSourceTree(root, plan) {
  const renames = plan.operations.filter(
    (operation) => (operation.type === "rename-key" || operation.type === "move-key") && operation.toKey
  );
  if (!renames.length) {
    return 0;
  }
  let filesChanged = 0;
  for (const file of walk(root)) {
    const original = readFileSync(file, "utf8");
    let next = original;
    for (const operation of renames) {
      next = next.split(`"${operation.fromKey}"`).join(`"${operation.toKey}"`);
      next = next.split(`'${operation.fromKey}'`).join(`'${operation.toKey}'`);
    }
    if (next !== original) {
      writeFileSync2(file, next);
      filesChanged += 1;
    }
  }
  return filesChanged;
}
function walk(directory) {
  const skip = /* @__PURE__ */ new Set(["node_modules", ".git", "dist", ".next"]);
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (skip.has(entry)) {
      continue;
    }
    const full = join2(directory, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

// src/scan.ts
import { readFileSync as readFileSync2, readdirSync as readdirSync2, statSync as statSync2 } from "fs";
import { extname as extname2, join as join3 } from "path";
var SOURCE_EXTENSIONS2 = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs"
]);
var TRANSLATE_PATTERNS = [
  /\btranslate\s*\(\s*[`'"]([^`'"]+)[`'"]\s*,\s*[`'"]([^`'"]*)[`'"]/g,
  /\bt\s*\(\s*[`'"]([^`'"]+)[`'"]\s*,\s*[`'"]([^`'"]*)[`'"]/g
];
function scanSourceTree(root) {
  const found = /* @__PURE__ */ new Map();
  for (const file of walk2(root)) {
    const content = readFileSync2(file, "utf8");
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of TRANSLATE_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const key = match[1].trim();
          const sourceText = match[2];
          if (!key || !sourceText.trim()) {
            continue;
          }
          const existing = found.get(key);
          const entry = {
            key,
            sourceText,
            file,
            line: index + 1
          };
          if (!existing) {
            found.set(key, entry);
          }
        }
      }
    }
  }
  return Array.from(found.values()).sort(
    (left, right) => left.key.localeCompare(right.key)
  );
}
function walk2(directory) {
  const skip = /* @__PURE__ */ new Set(["node_modules", ".git", "dist", ".next"]);
  const files = [];
  for (const entry of readdirSync2(directory)) {
    if (skip.has(entry)) {
      continue;
    }
    const full = join3(directory, entry);
    const stat = statSync2(full);
    if (stat.isDirectory()) {
      files.push(...walk2(full));
    } else if (SOURCE_EXTENSIONS2.has(extname2(entry))) {
      files.push(full);
    }
  }
  return files;
}

// src/index.ts
function flatten(value, prefix = "", out = []) {
  if (typeof value === "string") {
    if (prefix) {
      out.push({ key: prefix, sourceText: value });
    }
    return out;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return out;
  }
  for (const [name, nested] of Object.entries(value)) {
    flatten(nested, prefix ? `${prefix}.${name}` : name, out);
  }
  return out;
}
async function main() {
  const [, , command, ...args] = process.argv;
  if (command === "rewrite") {
    const file = argValue(args, "--file");
    const root = argValue(args, "--root") ?? process.cwd();
    if (!file) {
      throw new Error("Usage: keykit rewrite --file migration.json --root .");
    }
    const plan = JSON.parse(readFileSync3(resolve2(file), "utf8"));
    const changed = rewriteSourceTree(resolve2(root), plan);
    console.log(
      `Rewrote ${changed} file(s). Upload completion in the Keykit migrations UI.`
    );
    return;
  }
  if (command === "pull") {
    const setup = await resolveKeykitSetup();
    const outDir = argValue(args, "--out") ?? setup.directory;
    const catalog = await pullTranslationCatalog({
      baseUrl: requiredSetting(
        args,
        "--base-url",
        setup.config.baseUrl,
        "KEYKIT_BASE_URL"
      ),
      projectId: requiredSetting(
        args,
        "--project-id",
        setup.config.projectId,
        "KEYKIT_PROJECT_ID"
      ),
      token: requiredSetting(
        args,
        "--token",
        setup.config.apiKey ?? setup.config.ingestToken,
        "KEYKIT_API_KEY"
      ),
      outDir,
      environment: argValue(args, "--environment") ?? setup.config.environment ?? process.env.KEYKIT_ENVIRONMENT,
      version: parseOptionalVersion(
        argValue(args, "--version") ?? (setup.config.version !== void 0 ? String(setup.config.version) : void 0)
      )
    });
    const locales = Object.keys(catalog.locales);
    console.log(
      `Wrote ${locales.length} locale file(s) plus catalog.json to ${outDir} (${locales.join(", ") || "none"}).`
    );
    return;
  }
  if (command === "scan") {
    const root = argValue(args, "--root") ?? process.cwd();
    const keys = scanSourceTree(resolve2(root));
    console.log(JSON.stringify(keys, null, 2));
    return;
  }
  if (command === "flatten-json") {
    const file = argValue(args, "--file");
    if (!file) {
      throw new Error("Usage: keykit flatten-json --file messages.json");
    }
    const parsed = JSON.parse(readFileSync3(resolve2(file), "utf8"));
    console.log(JSON.stringify(flatten(parsed), null, 2));
    return;
  }
  console.log(`Keykit CLI
  scan --root .
  pull [--out .keykit] [--base-url URL] [--project-id ID] [--token KEY]
  rewrite --file migration.json --root .
  flatten-json --file messages.json

pull writes .keykit/catalog.json plus one JSON file per locale for
@keykithq/sdk static delivery. It reads keykit.config.ts when present.
Flags override the environment, which overrides the config file.
Credentials can also come from KEYKIT_BASE_URL, KEYKIT_PROJECT_ID, and
KEYKIT_API_KEY.

The backend never writes customer filesystems. Apply Keykit migrations
locally, then commit the result.`);
}
function argValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : void 0;
}
function requiredSetting(args, flag, fromConfig, envName) {
  const value = argValue(args, flag) ?? process.env[envName] ?? fromConfig;
  if (!value?.trim()) {
    throw new Error(
      `Missing ${flag} (or ${envName} in the environment or keykit.config).`
    );
  }
  return value.trim();
}
function parseOptionalVersion(value) {
  if (!value) {
    return void 0;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("--version must be a positive integer.");
  }
  return parsed;
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
//# sourceMappingURL=index.js.map