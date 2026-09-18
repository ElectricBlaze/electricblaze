import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const bin = join(fileURLToPath(new URL("..", import.meta.url)), "bin", "electricblaze.js");
const runJson = (args) => {
  try { return { code: 0, data: JSON.parse(execFileSync(process.execPath, [bin, ...args, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })) }; }
  catch (e) { return { code: e.status, data: JSON.parse(e.stdout || "{}") }; }
};
const tmp = () => mkdtempSync(join(tmpdir(), "eb-kit-"));

test("Astro gets the data-only kit under src/, and doctor recognises it", () => {
  const dir = tmp();
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "t", dependencies: { astro: "5.0.0" } }));
  const r = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.equal(r.code, 0);
  assert.equal(r.data.framework, "data");
  assert.deepEqual(r.data.files.map((f) => f.path), ["src/lib/eb/feed.d.ts", "src/lib/eb/demo/instagram.json"]);
  assert.ok(!existsSync(join(dir, "electricblaze")), "no HTML kit for a framework that would not serve it");
  assert.ok(r.data.notes.some((n) => /astro detected/.test(n)), r.data.notes.join("\n"));
  assert.ok(r.data.notes.some((n) => /src\/lib\/eb\/demo\/instagram\.json/.test(n)));
  assert.match(r.data.next, /widget/);

  const doc = runJson(["doctor", `--dir=${dir}`]);
  assert.equal(doc.code, 0);
  assert.equal(doc.data.framework, "data");
  assert.equal(doc.data.kit, "data");
  assert.equal(doc.data.checks.find((c) => c.name === "feed").status, "ok");

  // the HTML kit is still one flag away
  const html = runJson(["add", "instagram-feed", `--dir=${dir}`, "--framework=html"]);
  assert.equal(html.data.framework, "html");
  assert.ok(existsSync(join(dir, "electricblaze", "instagram-feed.js")));
  rmSync(dir, { recursive: true, force: true });
});

test("doctor finds the HTML kit in a Next.js project instead of reporting no feed", () => {
  const dir = tmp();
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { next: "15.0.0" } }));
  runJson(["add", "instagram-feed", `--dir=${dir}`, "--framework=html"]);
  const doc = runJson(["doctor", `--dir=${dir}`]);
  assert.equal(doc.code, 0);
  assert.equal(doc.data.framework, "next");
  assert.equal(doc.data.kit, "html");
  const comp = doc.data.checks.find((c) => c.name === "component");
  assert.equal(comp.status, "ok");
  assert.match(comp.detail, /plain HTML kit in a Next\.js project/);

  // an incomplete kit names the missing file and the exact command to repair it
  rmSync(join(dir, "electricblaze", "instagram-feed.css"));
  const broken = runJson(["doctor", `--dir=${dir}`]);
  assert.equal(broken.code, 1);
  const c = broken.data.checks.find((x) => x.name === "component");
  assert.equal(c.status, "fail");
  assert.match(c.detail, /instagram-feed\.css/);
  assert.match(c.next, /--framework=html --force/);
  rmSync(dir, { recursive: true, force: true });
});

test("CRLF line endings after a checkout are not treated as an edit", () => {
  const dir = tmp();
  runJson(["add", "instagram-feed", `--dir=${dir}`]);
  const css = join(dir, "electricblaze", "instagram-feed.css");
  writeFileSync(css, readFileSync(css, "utf8").replace(/\n/g, "\r\n"));
  const again = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.equal(again.data.files.find((f) => f.path === "electricblaze/instagram-feed.css").status, "unchanged");
  assert.match(readFileSync(css, "utf8"), /\r\n/, "the user's line endings are left alone");
  rmSync(dir, { recursive: true, force: true });
});

test("the import path uses the @/* alias from tsconfig when the project has one", () => {
  const dir = tmp();
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { next: "15.0.0" } }));
  writeFileSync(join(dir, "tsconfig.json"), '{\n  // comments are fine here\n  "compilerOptions": { "paths": { "@/*": ["./*"] } }\n}\n');
  const withAlias = runJson(["add", "instagram-feed", `--dir=${dir}`]);
  assert.ok(withAlias.data.notes.some((n) => n.includes('from "@/components/eb/InstagramFeed"')), withAlias.data.notes.join("\n"));

  const plain = tmp();
  mkdirSync(join(plain, "app"));
  writeFileSync(join(plain, "package.json"), JSON.stringify({ dependencies: { next: "15.0.0" } }));
  const noAlias = runJson(["add", "instagram-feed", `--dir=${plain}`]);
  assert.ok(noAlias.data.notes.some((n) => n.includes('from "../components/eb/InstagramFeed"') && /app\/page\.tsx/.test(n)), noAlias.data.notes.join("\n"));
  rmSync(dir, { recursive: true, force: true });
  rmSync(plain, { recursive: true, force: true });
});

test("doctor warns plainly when ELECTRICBLAZE_API_KEY is set before the API exists", () => {
  const dir = tmp();
  runJson(["add", "instagram-feed", `--dir=${dir}`]);
  writeFileSync(join(dir, ".env.local"), "ELECTRICBLAZE_API_KEY=eb_test\n");
  const doc = runJson(["doctor", `--dir=${dir}`]);
  const acc = doc.data.checks.find((c) => c.name === "account");
  assert.equal(acc.status, "warn");
  assert.match(acc.detail, /ships in 0\.2/);
  assert.match(acc.detail, /throws/);
  assert.match(acc.next, /Remove the key/);
  rmSync(dir, { recursive: true, force: true });
});
