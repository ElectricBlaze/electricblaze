import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8"));
export const HOME = "https://electricblaze.com";

/** Print a result either as JSON or as human text. */
export function emit(flags, data, text) {
  process.stdout.write(flags.json ? JSON.stringify(data, null, 2) + "\n" : text.replace(/\n?$/, "\n"));
}

const lf = (s) => s.replace(/\r\n/g, "\n");

/**
 * Write a file unless it already exists with different content.
 * Returns "written" | "unchanged" | "skipped". Never prompts.
 * Line endings are ignored in the comparison: a checkout with autocrlf is not an edit.
 */
export function writeSafe(path, content, { force = false } = {}) {
  if (existsSync(path)) {
    const current = readFileSync(path, "utf8");
    if (lf(current) === lf(content)) return "unchanged";
    if (!force) return "skipped";
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return "written";
}

/** Append a line to a file if it is not already there. Creates the file when `create` is true. */
export function ensureLine(path, line, { create = true } = {}) {
  if (!existsSync(path)) {
    if (!create) return "absent";
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, line + "\n");
    return "written";
  }
  const text = readFileSync(path, "utf8");
  if (text.split(/\r?\n/).some((l) => l.trim() === line.trim())) return "unchanged";
  writeFileSync(path, text.replace(/\n?$/, "\n") + line + "\n");
  return "written";
}

/** Insert or refresh a marked block in a markdown file that already exists. */
export function ensureBlock(path, marker, block) {
  if (!existsSync(path)) return "absent";
  const start = `<!-- ${marker}:start -->`, end = `<!-- ${marker}:end -->`;
  const wrapped = `${start}\n${block.trim()}\n${end}`;
  const text = readFileSync(path, "utf8");
  const re = new RegExp(`${start}.*?${end}`, "s");
  if (re.test(text)) {
    if (lf(text.match(re)[0]) === wrapped) return "unchanged";
    writeFileSync(path, text.replace(re, wrapped));
    return "written";
  }
  writeFileSync(path, text.replace(/\n?$/, "\n") + "\n" + wrapped + "\n");
  return "written";
}

export function readTemplate(...parts) {
  return readFileSync(join(PKG_ROOT, "src", "templates", ...parts), "utf8");
}

export function loadDemo(source) {
  return JSON.parse(readFileSync(join(PKG_ROOT, "demo", `${source}.json`), "utf8"));
}
