#!/usr/bin/env node

// src/index.ts
import { readFileSync as readFileSync5 } from "fs";
import { resolve as resolve4 } from "path";
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
import { existsSync, readFileSync as readFileSync2, readdirSync as readdirSync2, statSync as statSync2 } from "fs";
import { extname as extname2, isAbsolute, join as join3, relative, resolve as resolve2, sep } from "path";
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
var VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}|\{(?!\{)\s*([a-zA-Z_][\w]*)\s*\}/g;
var DEFAULT_SKIP_DIRECTORIES = [
  "node_modules",
  ".git",
  "dist",
  ".next",
  "coverage",
  "out",
  "build",
  ".keykit",
  "vendor"
];
function scanSourceTree(root, options = {}) {
  return scanProject(root, options).keys;
}
function scanProject(root, options = {}) {
  const projectRoot2 = resolve2(root);
  const exclude = excludeRules(options.exclude);
  const found = /* @__PURE__ */ new Map();
  let fileCount = 0;
  for (const target of scanTargets(projectRoot2, options.include)) {
    for (const file of walk2(target, projectRoot2, exclude)) {
      fileCount += 1;
      collectKeys(file, found);
    }
  }
  return {
    fileCount,
    keys: Array.from(found.values()).sort(
      (left, right) => left.key.localeCompare(right.key)
    )
  };
}
function isScannablePath(root, file, options = {}) {
  const projectRoot2 = resolve2(root);
  const full = resolve2(projectRoot2, file);
  if (!SOURCE_EXTENSIONS2.has(extname2(full))) {
    return false;
  }
  const fromRoot = relative(projectRoot2, full);
  if (!fromRoot || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    return false;
  }
  if (shouldSkip(full, projectRoot2, excludeRules(options.exclude))) {
    return false;
  }
  if (!options.include?.length) {
    return true;
  }
  return options.include.some((entry) => {
    const target = relative(resolve2(projectRoot2, entry), full);
    return !target || !target.startsWith("..") && !isAbsolute(target);
  });
}
function collectKeys(file, found) {
  const content = readFileSync2(file, "utf8");
  for (const pattern of TRANSLATE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1].trim();
      const sourceText = match[2];
      if (!key || !sourceText.trim()) {
        continue;
      }
      if (!found.has(key)) {
        found.set(key, {
          key,
          sourceText,
          variables: variablesIn(sourceText),
          file,
          line: lineNumberAt(content, match.index)
        });
      }
    }
  }
}
function variablesIn(sourceText) {
  const names = [];
  const seen = /* @__PURE__ */ new Set();
  const pattern = new RegExp(VARIABLE_PATTERN.source, "g");
  let match;
  while ((match = pattern.exec(sourceText)) !== null) {
    const name = match[1] ?? match[2];
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);
    names.push(name);
  }
  return names;
}
function lineNumberAt(content, index) {
  let line = 1;
  const end = Math.min(index, content.length);
  for (let cursor = 0; cursor < end; cursor += 1) {
    if (content.charCodeAt(cursor) === 10) {
      line += 1;
    }
  }
  return line;
}
function scanTargets(root, include) {
  if (!include?.length) {
    return [root];
  }
  return include.map((entry) => {
    const full = resolve2(root, entry);
    const fromRoot = relative(root, full);
    if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
      throw new Error(`Scan path must stay inside the project: ${entry}`);
    }
    if (!existsSync(full)) {
      throw new Error(`Scan path does not exist: ${entry}`);
    }
    return full;
  });
}
function excludeRules(extra) {
  const names = new Set(DEFAULT_SKIP_DIRECTORIES);
  const prefixes = [];
  for (const entry of extra ?? []) {
    const normalized = entry.trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/\/+$/, "");
    if (!normalized || normalized === ".") {
      continue;
    }
    if (normalized.includes("/")) {
      prefixes.push(normalized);
    } else {
      names.add(normalized);
    }
  }
  return { names, prefixes };
}
function walk2(directory, root, exclude) {
  if (!statSync2(directory).isDirectory()) {
    return shouldSkip(directory, root, exclude) || !SOURCE_EXTENSIONS2.has(extname2(directory)) ? [] : [directory];
  }
  const files = [];
  for (const entry of readdirSync2(directory)) {
    const full = join3(directory, entry);
    if (shouldSkip(full, root, exclude)) {
      continue;
    }
    const stat = statSync2(full);
    if (stat.isDirectory()) {
      files.push(...walk2(full, root, exclude));
    } else if (SOURCE_EXTENSIONS2.has(extname2(entry))) {
      files.push(full);
    }
  }
  return files;
}
function shouldSkip(full, root, exclude) {
  const rel = relative(root, full).split(sep).join("/");
  if (!rel || rel === ".") {
    return false;
  }
  const segments = rel.split("/");
  if (segments.some((segment) => exclude.names.has(segment))) {
    return true;
  }
  return exclude.prefixes.some(
    (prefix) => rel === prefix || rel.startsWith(`${prefix}/`)
  );
}

// src/push-keys.ts
async function pushSourceKeys(options) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (options.environment && options.environment !== "production") {
    params.set("environment", options.environment);
  }
  const query = params.toString();
  const endpoint = `${baseUrl}/api/v1/projects/${encodeURIComponent(options.projectId)}/keys/sync${query ? `?${query}` : ""}`;
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const maxRetries = options.maxRetries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 300;
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          keys: options.keys,
          ...options.removed && options.removed.length > 0 ? { removed: options.removed } : {}
        })
      });
      if (response.ok) {
        return;
      }
      const message = `Keykit sync failed (${response.status}): ${await readError2(response)}`;
      if (response.status === 401 || response.status === 403 || response.status === 402 || response.status === 422) {
        throw new Error(message);
      }
      lastError = new Error(message);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (isTerminal(lastError) || attempt >= maxRetries) {
        break;
      }
    }
    await delay(retryDelayMs * 2 ** attempt);
  }
  throw lastError ?? new Error("Keykit sync failed.");
}
function isTerminal(error) {
  return /\(401\)|\(403\)|\(402\)|\(422\)/.test(error.message);
}
function delay(milliseconds) {
  return new Promise((resolve5) => setTimeout(resolve5, milliseconds));
}
async function readError2(response) {
  try {
    const body = await response.json();
    if (typeof body.error === "string") {
      return body.error;
    }
  } catch {
  }
  return response.statusText || "Unknown error";
}

// src/sync-control.ts
function createSyncSession(input = process.stdin, onChange) {
  let paused = false;
  let aborted = false;
  const waiters = [];
  const release = (decision) => {
    const pending = waiters.splice(0);
    for (const waiter of pending) {
      waiter(decision);
    }
  };
  const onData = (key) => {
    if (key === "" || key === "q" || key === "Q") {
      aborted = true;
      onChange?.("abort");
      release("abort");
      return;
    }
    if (key === "p" || key === "P" || key === " ") {
      paused = true;
      onChange?.("pause");
      return;
    }
    if (key === "c" || key === "C") {
      paused = false;
      onChange?.("resume");
      release("continue");
    }
  };
  const interactive = Boolean(input.isTTY && input.setRawMode);
  if (interactive) {
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");
    input.on("data", onData);
  }
  return {
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      release("continue");
    },
    abort() {
      aborted = true;
      release("abort");
    },
    isPaused() {
      return paused;
    },
    isAborted() {
      return aborted;
    },
    async waitIfPaused() {
      if (aborted) {
        return "abort";
      }
      if (!paused) {
        return "continue";
      }
      return new Promise((resolve5) => {
        waiters.push(resolve5);
      });
    },
    detach() {
      if (!interactive) {
        return;
      }
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    }
  };
}

// src/sync-batch.ts
import { relative as relative2, sep as sep2 } from "path";
var DEFAULT_CHUNK_SIZE = 25;
var MAX_CHUNK_SIZE = 100;
var DEFAULT_CHUNK_DELAY_MS = 200;
function chunkItems(items, size) {
  const chunkSize = normalizeChunkSize(size);
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}
function normalizeChunkSize(size) {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error("--chunk must be a positive integer.");
  }
  if (size > MAX_CHUNK_SIZE) {
    throw new Error(`--chunk may not exceed ${MAX_CHUNK_SIZE}.`);
  }
  return size;
}
function pendingKeys(keys, synced) {
  if (!synced) {
    return [...keys];
  }
  return keys.filter((item) => synced[item.key] !== item.sourceText);
}
function removedKeys(keys, synced) {
  if (!synced) {
    return [];
  }
  const present = new Set(keys.map((item) => item.key));
  return Object.keys(synced).filter((key) => !present.has(key)).sort();
}
function withoutKeys(synced, removed) {
  if (removed.length === 0) {
    return synced;
  }
  const next = { ...synced };
  for (const key of removed) {
    delete next[key];
  }
  return next;
}
function toIngestKey(item, root) {
  const file = relative2(root, item.file).split(sep2).join("/").slice(0, 500);
  return {
    key: item.key,
    sourceText: item.sourceText,
    type: "translation",
    usage: {
      file: file || item.file,
      line: item.line
    }
  };
}
async function runChunkedSync(options) {
  const chunks = chunkItems(options.keys, options.chunkSize);
  const synced = { ...options.synced ?? {} };
  const sleep = options.sleep ?? delay2;
  let sent = 0;
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (options.control) {
      const decision = await options.control.waitIfPaused();
      if (decision === "abort" || options.control.isAborted()) {
        return { sent, stopped: "aborted", synced };
      }
    }
    options.onProgress?.({
      sent,
      total: options.keys.length,
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      phase: "start",
      status: "syncing",
      preview: chunk.map((item) => item.key),
      synced
    });
    try {
      await options.push(chunk.map((item) => toIngestKey(item, options.root)));
    } catch (error) {
      return {
        sent,
        stopped: "error",
        error: error instanceof Error ? error : new Error(String(error)),
        synced
      };
    }
    for (const item of chunk) {
      synced[item.key] = item.sourceText;
    }
    sent += chunk.length;
    options.onProgress?.({
      sent,
      total: options.keys.length,
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      phase: "complete",
      status: index === chunks.length - 1 ? "done" : "syncing",
      preview: chunk.map((item) => item.key),
      synced
    });
    if (index < chunks.length - 1 && options.delayMs > 0) {
      await sleep(options.delayMs);
    }
  }
  return { sent, stopped: "done", synced };
}
function delay2(milliseconds) {
  return new Promise((resolve5) => setTimeout(resolve5, milliseconds));
}

// src/sync-state.ts
import { mkdirSync as mkdirSync2, readFileSync as readFileSync3, writeFileSync as writeFileSync3 } from "fs";
import { join as join4 } from "path";
var FILE_NAME = "sync-state.json";
function syncStatePath(directory) {
  return join4(directory, FILE_NAME);
}
function readSyncCheckpoint(directory, projectId) {
  const empty = { version: 1, projectId, synced: {} };
  try {
    const parsed = JSON.parse(readFileSync3(syncStatePath(directory), "utf8"));
    if (parsed?.version !== 1 || parsed.projectId !== projectId) {
      return empty;
    }
    if (!parsed.synced || typeof parsed.synced !== "object") {
      return empty;
    }
    return { version: 1, projectId, synced: parsed.synced };
  } catch {
    return empty;
  }
}
function writeSyncCheckpoint(directory, checkpoint) {
  mkdirSync2(directory, { recursive: true });
  writeFileSync3(
    syncStatePath(directory),
    `${JSON.stringify(checkpoint, null, 2)}
`,
    "utf8"
  );
}

// src/sync-ui.ts
var BAR_WIDTH = 24;
function formatSyncFrame(frame) {
  const ratio = frame.total === 0 ? 1 : Math.min(1, frame.sent / frame.total);
  const filled = Math.round(ratio * BAR_WIDTH);
  const bar = "#".repeat(filled) + "-".repeat(BAR_WIDTH - filled);
  const lines = [
    "Keykit sync",
    `Project  ${frame.projectId}`,
    `Scope    ${frame.scope}`,
    "",
    `${frame.total} keys \xB7 ${frame.chunkSize} per request \xB7 ${frame.chunkCount} ${frame.chunkCount === 1 ? "request" : "requests"}`,
    `[${bar}]  ${frame.sent}/${frame.total}  chunk ${Math.max(frame.chunkIndex, 1)}/${frame.chunkCount}  ${frame.status}`
  ];
  for (const key of frame.preview.slice(0, 5)) {
    lines.push(`  ${key}`);
  }
  if (frame.preview.length > 5) {
    lines.push(`  \u2026 ${frame.preview.length - 5} more in this chunk`);
  }
  if (frame.message) {
    lines.push("", frame.message);
  }
  lines.push("", "p pause \xB7 c continue \xB7 q quit and save");
  return lines.join("\n");
}
function createSyncDisplay(stream = process.stdout) {
  let previousLines = 0;
  let current = null;
  const interactive = Boolean(stream.isTTY);
  return {
    show(frame) {
      current = frame;
      const text = formatSyncFrame(frame);
      if (!interactive) {
        stream.write(
          `chunk ${frame.chunkIndex}/${frame.chunkCount}  ${frame.sent}/${frame.total}  ${frame.status}
`
        );
        return;
      }
      if (previousLines > 0) {
        stream.write(`\x1B[${previousLines}A\x1B[0J`);
      }
      stream.write(`${text}
`);
      previousLines = text.split("\n").length;
    },
    replaceStatus(status, message) {
      if (!current) {
        return;
      }
      this.show({ ...current, status, message });
    },
    finish(text) {
      if (interactive && previousLines > 0) {
        stream.write(`\x1B[${previousLines}A\x1B[0J`);
        previousLines = 0;
      }
      stream.write(`${text}
`);
    }
  };
}

// src/sync-command.ts
async function executeSync(options) {
  const scan = scanProject(options.root, options.scan);
  const scope = options.scan.include && options.scan.include.length > 0 ? options.scan.include.join(", ") : "entire project";
  const checkpoint = readSyncCheckpoint(options.directory, options.projectId);
  const queued = pendingKeys(scan.keys, checkpoint.synced);
  const removed = options.deprecateRemoved === false ? [] : keysMissingFromScan(scan, options.scan, checkpoint.synced);
  if (queued.length === 0 && removed.length === 0) {
    if (options.quietWhenUnchanged) {
      return;
    }
    console.log(
      scan.keys.length === 0 ? `No translation keys found in ${scope} (${scan.fileCount} files).` : `Scanned ${scan.keys.length} keys in ${scan.fileCount} files. Nothing new to sync.`
    );
    return;
  }
  if (queued.length === 0) {
    const deprecated = await reportRemovedKeys(options, removed);
    writeSyncCheckpoint(options.directory, {
      version: 1,
      projectId: options.projectId,
      synced: withoutKeys(checkpoint.synced, removed)
    });
    console.log(
      `Scanned ${scan.keys.length} keys in ${scan.fileCount} files. Nothing new to sync. ${deprecatedSummary(deprecated)}`
    );
    return;
  }
  const unchanged = scan.keys.length - queued.length;
  const interactive = queued.length > options.chunkSize && (options.interactive ?? Boolean(process.stdout.isTTY));
  const display = interactive ? createSyncDisplay() : null;
  const session = interactive ? createSyncSession(process.stdin, (event) => {
    if (event === "pause") {
      display?.replaceStatus("paused", "Paused. c continues, q saves and quits.");
    } else if (event === "resume") {
      display?.replaceStatus("syncing");
    }
  }) : null;
  const frame = () => ({
    projectId: options.projectId,
    scope,
    sent: 0,
    total: queued.length,
    chunkIndex: 0,
    chunkCount: Math.ceil(queued.length / options.chunkSize),
    chunkSize: options.chunkSize,
    status: "syncing",
    preview: []
  });
  if (!interactive) {
    const skipped = unchanged > 0 ? ` ${unchanged} unchanged.` : "";
    console.log(
      `Syncing ${queued.length} keys from ${scope} (${scan.fileCount} files) in batches of ${options.chunkSize}.${skipped}`
    );
  } else {
    display?.show({
      ...frame(),
      message: unchanged > 0 ? `${unchanged} unchanged keys skipped.` : void 0
    });
  }
  try {
    const result = await runChunkedSync({
      keys: queued,
      root: options.root,
      chunkSize: options.chunkSize,
      delayMs: options.delayMs,
      synced: checkpoint.synced,
      control: session ?? void 0,
      push: (batch) => pushSourceKeys({
        baseUrl: options.baseUrl,
        projectId: options.projectId,
        token: options.token,
        environment: options.environment,
        keys: batch,
        fetch: options.fetch
      }),
      onProgress: (progress) => {
        if (progress.phase === "complete") {
          writeSyncCheckpoint(options.directory, {
            version: 1,
            projectId: options.projectId,
            synced: progress.synced
          });
        }
        if (!display) {
          if (progress.phase === "complete") {
            console.log(
              `chunk ${progress.chunkIndex}/${progress.chunkCount}  ${progress.sent}/${progress.total}`
            );
          }
          return;
        }
        const status = session?.isPaused() ? "paused" : progress.status;
        display.show({
          ...frame(),
          sent: progress.sent,
          chunkIndex: progress.chunkIndex,
          status,
          preview: progress.preview
        });
      }
    });
    writeSyncCheckpoint(options.directory, {
      version: 1,
      projectId: options.projectId,
      synced: result.synced
    });
    if (result.stopped === "done" && removed.length > 0) {
      const deprecated = await reportRemovedKeys(options, removed);
      writeSyncCheckpoint(options.directory, {
        version: 1,
        projectId: options.projectId,
        synced: withoutKeys(result.synced, removed)
      });
      const summary2 = `Synced ${result.sent} keys. ${deprecatedSummary(deprecated)}`;
      if (display) {
        display.finish(summary2);
      } else {
        console.log(summary2);
      }
      return;
    }
    if (result.stopped === "error") {
      const message = result.error?.message ?? "Keykit sync failed.";
      const summary2 = `Synced ${result.sent} of ${queued.length} keys. ${message} Run keykit sync again to continue.`;
      if (display) {
        display.finish(summary2);
      }
      throw new Error(summary2);
    }
    if (result.stopped === "aborted") {
      const summary2 = `Saved progress at ${result.sent} of ${queued.length} keys. Run keykit sync again to continue.`;
      if (display) {
        display.finish(summary2);
      } else {
        console.log(summary2);
      }
      return;
    }
    const summary = `Synced ${result.sent} keys.`;
    if (display) {
      display.finish(summary);
    } else {
      console.log(summary);
    }
  } finally {
    session?.detach();
  }
}
function resolveScanOptions(config, include, exclude) {
  const scan = readScanConfig(config);
  return {
    include: include.length > 0 ? include : scan?.include,
    exclude: exclude.length > 0 ? exclude : scan?.exclude
  };
}
function readScanConfig(config) {
  if (!("scan" in config) || !config.scan || typeof config.scan !== "object") {
    return void 0;
  }
  return config.scan;
}
function keysMissingFromScan(scan, scanOptions, synced) {
  const include = scanOptions.include ?? [];
  const exclude = scanOptions.exclude ?? [];
  if (include.length > 0 || exclude.length > 0 || scan.fileCount === 0) {
    return [];
  }
  return removedKeys(scan.keys, synced);
}
async function reportRemovedKeys(options, removed) {
  const deprecated = [];
  for (let index = 0; index < removed.length; index += options.chunkSize) {
    const batch = removed.slice(index, index + options.chunkSize);
    await pushSourceKeys({
      baseUrl: options.baseUrl,
      projectId: options.projectId,
      token: options.token,
      environment: options.environment,
      keys: [],
      removed: batch,
      fetch: options.fetch
    });
    deprecated.push(...batch);
  }
  return deprecated;
}
function deprecatedSummary(keys) {
  const preview = keys.slice(0, 8).join(", ");
  const extra = keys.length > 8 ? `, and ${keys.length - 8} more` : "";
  return `Marked ${keys.length} removed ${keys.length === 1 ? "key" : "keys"} as deprecated: ${preview}${extra}.`;
}

// src/sync-watch.ts
import { watch as fsWatch } from "fs";
var DEFAULT_WATCH_DEBOUNCE_MS = 400;
function startSyncWatcher(options) {
  const debounceMs = options.debounceMs ?? DEFAULT_WATCH_DEBOUNCE_MS;
  const watch = options.watch ?? nodeFileWatcher;
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle));
  const onError = options.onError ?? ((error) => console.error(error.message));
  let timer = null;
  let running = null;
  let queued = false;
  let closed = false;
  const runPass = async () => {
    do {
      queued = false;
      try {
        await options.run();
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    } while (queued && !closed);
  };
  const trigger = () => {
    timer = null;
    if (closed) {
      return;
    }
    if (running) {
      queued = true;
      return;
    }
    running = runPass().finally(() => {
      running = null;
    });
  };
  const schedule = () => {
    if (timer !== null) {
      clearTimer(timer);
    }
    timer = setTimer(trigger, debounceMs);
  };
  const watcher = watch(options.root, (file) => {
    if (closed) {
      return;
    }
    if (file !== null && !isScannablePath(options.root, file, options.scan)) {
      return;
    }
    schedule();
  });
  return {
    async idle() {
      while (running) {
        await running;
      }
    },
    close() {
      closed = true;
      if (timer !== null) {
        clearTimer(timer);
        timer = null;
      }
      watcher.close();
    }
  };
}
var nodeFileWatcher = (root, onChange) => {
  const watcher = fsWatch(root, { recursive: true }, (_event, file) => {
    onChange(file ? file.toString() : null);
  });
  return { close: () => watcher.close() };
};

// src/load-env.ts
import { existsSync as existsSync2, readFileSync as readFileSync4 } from "fs";
import { dirname, join as join5, resolve as resolve3 } from "path";
var KEYKIT_DEFAULT_BASE_URL = "https://www.keykit.dev";
var CONFIG_NAMES = [
  "keykit.config.ts",
  "keykit.config.mts",
  "keykit.config.js",
  "keykit.config.mjs",
  "keykit.config.cjs",
  "keykit.config.json"
];
function loadProjectEnv(start = process.cwd()) {
  const dir = projectRoot(start);
  const values = {
    ...parseEnvFile(join5(dir, ".env")),
    ...parseEnvFile(join5(dir, ".env.local"))
  };
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === void 0) {
      process.env[key] = value;
    }
  }
}
function resolveBaseUrl(flag, fromEnv, fromConfig) {
  const value = [flag, fromEnv, fromConfig].find((entry) => entry?.trim());
  return value?.trim() || KEYKIT_DEFAULT_BASE_URL;
}
function parseEnvFile(file) {
  if (!existsSync2(file)) {
    return {};
  }
  const values = {};
  const text = readFileSync4(file, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const body = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed;
    const separator = body.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = body.slice(0, separator).trim();
    const value = unquote(body.slice(separator + 1).trim());
    if (key) {
      values[key] = value;
    }
  }
  return values;
}
function projectRoot(start) {
  let dir = resolve3(start);
  for (; ; ) {
    if (existsSync2(join5(dir, "package.json")) || existsSync2(join5(dir, ".env")) || existsSync2(join5(dir, ".env.local")) || CONFIG_NAMES.some((name) => existsSync2(join5(dir, name)))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return resolve3(start);
    }
    dir = parent;
  }
}
function unquote(value) {
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2 || value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    return value.slice(1, -1);
  }
  return value;
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
  loadProjectEnv(argValue(args, "--root") ?? process.cwd());
  if (command === "rewrite") {
    const file = argValue(args, "--file");
    const root = argValue(args, "--root") ?? process.cwd();
    if (!file) {
      throw new Error("Usage: keykit rewrite --file migration.json --root .");
    }
    const plan = JSON.parse(readFileSync5(resolve4(file), "utf8"));
    const changed = rewriteSourceTree(resolve4(root), plan);
    console.log(
      `Rewrote ${changed} file(s). Upload completion in the Keykit migrations UI.`
    );
    return;
  }
  if (command === "pull") {
    const setup = await resolveKeykitSetup();
    const outDir = argValue(args, "--out") ?? setup.directory;
    const catalog = await pullTranslationCatalog({
      baseUrl: resolveBaseUrl(
        argValue(args, "--base-url"),
        process.env.KEYKIT_BASE_URL,
        setup.config.baseUrl
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
  if (command === "scan" || command === "sync") {
    const requestedRoot = argValue(args, "--root");
    const setup = await resolveKeykitSetup(
      {},
      requestedRoot ? resolve4(requestedRoot) : process.cwd()
    );
    const root = resolve4(requestedRoot ?? setup.root);
    const scanOptions = resolveScanOptions(
      root === resolve4(setup.root) ? setup.config : {},
      argValues(args, "--include"),
      argValues(args, "--exclude")
    );
    if (command === "scan") {
      const keys = scanSourceTree(root, scanOptions);
      console.log(JSON.stringify(keys, null, 2));
      return;
    }
    const chunkSize = normalizeChunkSize(
      parsePositiveInteger(argValue(args, "--chunk"), DEFAULT_CHUNK_SIZE, "--chunk")
    );
    const delayMs = parseNonNegativeInteger(
      argValue(args, "--delay"),
      DEFAULT_CHUNK_DELAY_MS,
      "--delay"
    );
    const syncOptions = {
      root,
      directory: setup.directory,
      baseUrl: resolveBaseUrl(
        argValue(args, "--base-url"),
        process.env.KEYKIT_BASE_URL,
        setup.config.baseUrl
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
      environment: argValue(args, "--environment") ?? setup.config.environment ?? process.env.KEYKIT_ENVIRONMENT,
      scan: scanOptions,
      chunkSize,
      delayMs
    };
    if (args.includes("--watch")) {
      await watchAndSync(
        syncOptions,
        parseNonNegativeInteger(
          argValue(args, "--debounce"),
          DEFAULT_WATCH_DEBOUNCE_MS,
          "--debounce"
        )
      );
      return;
    }
    await executeSync(syncOptions);
    return;
  }
  if (command === "flatten-json") {
    const file = argValue(args, "--file");
    if (!file) {
      throw new Error("Usage: keykit flatten-json --file messages.json");
    }
    const parsed = JSON.parse(readFileSync5(resolve4(file), "utf8"));
    console.log(JSON.stringify(flatten(parsed), null, 2));
    return;
  }
  console.log(`Keykit CLI
  scan [--root .] [--include path] [--exclude path]
  sync [--root .] [--include path] [--exclude path] [--chunk 25] [--delay 200]
       [--watch] [--debounce 400]
  pull [--out .keykit] [--base-url URL] [--project-id ID] [--token KEY]
  rewrite --file migration.json --root .
  flatten-json --file messages.json

sync uploads t() and translate() calls while you are developing.
It sends them in chunks (25 keys per request by default) and waits
between requests. A scan of the whole project also marks keys that
disappeared from source as deprecated. --include and --exclude limit
the scan, so those runs do not deprecate keys outside that scope.
In a terminal, p pauses, c continues, and q saves progress so the next
sync continues. Page views do not upload keys.

sync --watch stays running next to your dev server. It syncs once,
then uploads new and changed keys after you save. It never marks keys
deprecated; run a plain sync for that.

scan and sync read scan.include and scan.exclude from keykit.config.ts.
Repeat --include or --exclude, or pass a comma-separated list.
Omit them to scan the whole project. node_modules, dist, .next, and
other build folders are always skipped.

Progress is stored in .keykit/sync-state.json. That file is local;
do not commit it.

pull writes .keykit/catalog.json plus one JSON file per locale for
@keykithq/sdk static delivery. It reads keykit.config.ts when present.
Flags override the environment, which overrides the config file.
The API is https://www.keykit.dev. Set KEYKIT_BASE_URL or --base-url
only to point at another host. KEYKIT_PROJECT_ID and KEYKIT_API_KEY
come from the environment, .env, .env.local, or keykit.config.

The backend never writes customer filesystems. Apply Keykit migrations
locally, then commit the result.`);
}
async function watchAndSync(options, debounceMs) {
  const watchOptions = {
    ...options,
    interactive: false,
    deprecateRemoved: false,
    quietWhenUnchanged: true
  };
  const run = () => executeSync(watchOptions);
  const report = (error) => console.error(`${error.message} Watching for the next change.`);
  try {
    await executeSync({ ...watchOptions, quietWhenUnchanged: false });
  } catch (error) {
    report(error instanceof Error ? error : new Error(String(error)));
  }
  const watcher = startSyncWatcher({
    root: options.root,
    scan: options.scan,
    run,
    debounceMs,
    onError: report
  });
  console.log(
    "Watching for t() and translate() changes. Ctrl+C stops. Run keykit sync to mark removed keys deprecated."
  );
  await new Promise((resolveStop) => {
    const stop = () => {
      watcher.close();
      void watcher.idle().then(resolveStop);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
}
function argValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : void 0;
}
function argValues(args, name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) {
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      continue;
    }
    for (const part of value.split(",")) {
      const trimmed = part.trim();
      if (trimmed) {
        values.push(trimmed);
      }
    }
  }
  return values;
}
function parsePositiveInteger(value, fallback, flag) {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}
function parseNonNegativeInteger(value, fallback, flag) {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }
  return parsed;
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