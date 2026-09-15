import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const bin = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "electricblaze.js");
const run = (...args) => execFileSync(process.execPath, [bin, ...args], { encoding: "utf8" });

test("--version prints the package version", () => {
  const { version } = JSON.parse(execFileSync(process.execPath, ["-p", "JSON.stringify(require('./package.json'))"], { encoding: "utf8", cwd: join(dirname(bin), "..") }));
  assert.equal(run("--version").trim(), version);
});

test("--json output is machine-readable and never interactive", () => {
  const out = JSON.parse(run("add", "instagram-feed", "--json"));
  assert.equal(out.name, "electricblaze");
  assert.equal(out.requested, "add");
  assert.ok(Array.isArray(out.planned) && out.planned.includes("add"));
});

test("plain output points to the next step", () => {
  assert.match(run("preview", "instagram"), /electricblaze\.com/);
});
