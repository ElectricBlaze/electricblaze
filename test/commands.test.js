import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateFeed } from "../schema/validate.js";

const bin = join(fileURLToPath(new URL("..", import.meta.url)), "bin", "electricblaze.js");

/** Run the CLI; returns { code, stdout } and never throws on non-zero exit. */
function run(args, opts = {}) {
  try {
    return { code: 0, stdout: execFileSync(process.execPath, [bin, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }) };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? "" };
  }
}
const runJson = (args, opts) => { const r = run([...args, "--json"], opts); return { code: r.code, data: JSON.parse(r.stdout) }; };
const tmp = () => mkdtempSync(join(tmpdir(), "eb-"));

test("preview prints a valid demo feed and honors --formats and --limit", () => {
  const all = runJson(["preview", "instagram"]);
  assert.equal(all.code, 0);
  assert.deepEqual(validateFeed(all.data), []);
  assert.equal(all.data.demo, true);

  const reels = runJson(["preview", "instagram", "--formats=reel", "--limit=1"]);
  assert.equal(reels.data.posts.length, 1);
  assert.equal(reels.data.posts[0].format, "reel");

  const nope = runJson(["preview", "tiktok"]);
  assert.equal(nope.code, 2);
  assert.match(nope.data.next, /preview instagram/);
});

test("add into a plain folder writes the HTML kit and is idempotent", () => {
  const dir = tmp();
  const first = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.equal(first.code, 0);
  assert.equal(first.data.framework, "html");
  for (const f of ["electricblaze/instagram-feed.js", "electricblaze/instagram-feed.css", "electricblaze/instagram.json", "electricblaze/instagram.demo.js", "electricblaze/feed.d.ts"]) {
    assert.ok(existsSync(join(dir, f)), `${f} missing`);
    assert.ok(first.data.files.some((x) => x.path === f && x.status === "written"), `${f} not reported as written`);
  }
  assert.ok(first.data.snippet.some((l) => l.includes('data-eb-feed="instagram"')));
  assert.deepEqual(validateFeed(JSON.parse(readFileSync(join(dir, "electricblaze/instagram.json"), "utf8"))), []);

  const again = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.ok(again.data.files.every((x) => x.status === "unchanged"), JSON.stringify(again.data.files));

  // an edited file is kept unless --force
  writeFileSync(join(dir, "electricblaze/instagram-feed.css"), "/* mine */\n");
  const kept = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.equal(kept.data.files.find((x) => x.path === "electricblaze/instagram-feed.css").status, "skipped");
  assert.equal(readFileSync(join(dir, "electricblaze/instagram-feed.css"), "utf8"), "/* mine */\n");
  const forced = runJson(["add", "instagram-feed", `--dir=${dir}`, "--force"]);
  assert.equal(forced.data.files.find((x) => x.path === "electricblaze/instagram-feed.css").status, "written");
  rmSync(dir, { recursive: true, force: true });
});

test("add into a Next.js App Router project writes component, loader, env and agent notes", () => {
  const dir = tmp();
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "t", dependencies: { next: "15.0.0", react: "19.0.0" } }));
  writeFileSync(join(dir, "AGENTS.md"), "# Notes\n");
  writeFileSync(join(dir, ".gitignore"), "node_modules\n");

  const r = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.equal(r.code, 0);
  assert.equal(r.data.framework, "next");
  for (const f of ["components/eb/InstagramFeed.tsx", "components/eb/InstagramFeed.module.css", "lib/eb/instagram.ts", "lib/eb/feed.d.ts", "lib/eb/demo/instagram.json"]) {
    assert.ok(existsSync(join(dir, f)), `${f} missing`);
  }
  assert.match(readFileSync(join(dir, ".env.example"), "utf8"), /^ELECTRICBLAZE_API_KEY=$/m);
  assert.match(readFileSync(join(dir, ".gitignore"), "utf8"), /^\.env\.local$/m);
  const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /<!-- electricblaze:start -->/);
  assert.match(agents, /npx electricblaze preview instagram --json/);
  // second run does not duplicate the block
  runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8").split("electricblaze:start").length, 2);

  const doc = runJson(["doctor", `--dir=${dir}`]);
  assert.equal(doc.code, 0);
  assert.equal(doc.data.checks.find((c) => c.name === "component").status, "ok");
  assert.equal(doc.data.checks.find((c) => c.name === "feed").status, "ok");
  rmSync(dir, { recursive: true, force: true });
});

test("add respects src/ layout and warns about the Pages Router", () => {
  const dir = tmp();
  mkdirSync(join(dir, "src", "pages"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { next: "14.0.0" } }));
  const r = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.ok(existsSync(join(dir, "src/components/eb/InstagramFeed.tsx")));
  assert.ok(r.data.notes.some((n) => /Pages Router/.test(n)), r.data.notes.join("\n"));
  rmSync(dir, { recursive: true, force: true });
});

test("doctor explains an empty project and fails on a broken feed file", () => {
  const dir = tmp();
  const empty = runJson(["doctor", `--dir=${dir}`]);
  assert.equal(empty.code, 0);
  const comp = empty.data.checks.find((c) => c.name === "component");
  assert.equal(comp.status, "warn");
  assert.match(comp.next, /add instagram-feed/);

  runJson(["add", "instagram-feed", `--dir=${dir}`]);
  writeFileSync(join(dir, "electricblaze/instagram.json"), "{ not json");
  const broken = runJson(["doctor", `--dir=${dir}`]);
  assert.equal(broken.code, 1);
  assert.equal(broken.data.checks.find((c) => c.name === "feed").status, "fail");
  rmSync(dir, { recursive: true, force: true });
});

test("API-backed commands exit 2 with a next step instead of prompting", () => {
  for (const cmd of ["login", "connect", "list"]) {
    const r = runJson([cmd, "instagram"]);
    assert.equal(r.code, 2, cmd);
    assert.equal(r.data.status, "not_available_yet");
    assert.ok(r.data.next);
  }
  const unknown = runJson(["frobnicate"]);
  assert.equal(unknown.code, 2);
  assert.match(unknown.data.next, /--help/);
});
