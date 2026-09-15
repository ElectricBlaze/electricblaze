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

test("--help --json is machine-readable and lists every command", () => {
  const out = JSON.parse(run("--help", "--json"));
  assert.equal(out.name, "electricblaze");
  assert.deepEqual(out.commands, ["add", "preview", "doctor", "skill", "login", "connect", "list"]);
  assert.ok(out.flags.includes("--json"));
});

test("no command prints usage, exits 2, and points to the site", () => {
  let code = 0, out = "";
  try { out = run(); } catch (e) { code = e.status; out = e.stdout; }
  assert.equal(code, 2);
  assert.match(out, /Usage: npx electricblaze/);
  assert.match(out, /electricblaze.com/);
});
