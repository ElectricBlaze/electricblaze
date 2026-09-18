import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const bin = join(fileURLToPath(new URL("..", import.meta.url)), "bin", "electricblaze.js");
const runJson = (args) => {
  try { return { code: 0, data: JSON.parse(execFileSync(process.execPath, [bin, ...args, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })) }; }
  catch (e) { return { code: e.status, data: JSON.parse(e.stdout || "{}") }; }
};

test("a typo in a flag is exit 2 with the accepted flags, never a silent no-op", () => {
  const r = runJson(["preview", "--limt=1"]);
  assert.equal(r.code, 2);
  assert.match(r.data.error, /unknown flag "--limt"/);
  assert.ok(r.data.flags.includes("--limit=<n>"));
  assert.match(r.data.next, /preview --help/);
});

test("a flag that belongs to another command, a missing value and a bad --limit are exit 2", () => {
  const wrongCmd = runJson(["preview", "--force"]);
  assert.equal(wrongCmd.code, 2);
  assert.match(wrongCmd.data.error, /does not apply to preview/);

  const noValue = runJson(["doctor", "--dir"]);
  assert.equal(noValue.code, 2);
  assert.match(noValue.data.error, /--dir.*needs a value/);

  for (const bad of ["--limit=abc", "--limit=0", "--limit=-2", "--limit=1.5"]) {
    const r = runJson(["preview", bad]);
    assert.equal(r.code, 2, bad);
    assert.match(r.data.error, /positive integer/);
  }
});

test("global flags pass everywhere and preview accepts the component name as an alias", () => {
  const ok = runJson(["preview", "instagram-feed", "--yes", "--limit=2"]);
  assert.equal(ok.code, 0);
  assert.equal(ok.data.posts.length, 2);
  assert.equal(ok.data.source, "instagram");
});

test("large JSON survives a pipe: preview output is complete", () => {
  const out = execFileSync(process.execPath, [bin, "preview", "--json"], { encoding: "utf8" });
  const feed = JSON.parse(out);
  assert.equal(feed.posts.length, 12);
  assert.ok(out.endsWith("}\n"));
});
