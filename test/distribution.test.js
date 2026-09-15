import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const bin = join(root, "bin", "electricblaze.js");
const runJson = (args) => {
  try { return { code: 0, data: JSON.parse(execFileSync(process.execPath, [bin, ...args, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })) }; }
  catch (e) { return { code: e.status, data: JSON.parse(e.stdout || "{}") }; }
};

test("SKILL.md has the frontmatter both Claude Code and Codex require", () => {
  const md = readFileSync(join(root, "skills", "electricblaze-feeds", "SKILL.md"), "utf8");
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(fm, "frontmatter block missing");
  const name = fm[1].match(/^name:\s*(.+)$/m)?.[1];
  const description = fm[1].match(/^description:\s*(.+)$/m)?.[1];
  assert.equal(name, "electricblaze-feeds");
  assert.ok(description && description.length > 80 && description.length < 1024, `description length ${description?.length}`);
  assert.match(description, /Instagram/);
  assert.match(description, /Use when/);
  assert.ok(md.split("\n").length < 500, "SKILL.md must stay under 500 lines");
  for (const ref of md.matchAll(/\]\((references\/[^)]+)\)/g)) {
    assert.ok(existsSync(join(root, "skills", "electricblaze-feeds", ref[1])), `${ref[1]} referenced but missing`);
  }
});

test("Claude Code plugin manifests point at the skills directory and at each other", () => {
  const plugin = JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"));
  const market = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(plugin.name, "electricblaze");
  assert.equal(plugin.version, pkg.version, "plugin.json version must match package.json");
  assert.ok(existsSync(join(root, plugin.skills, "electricblaze-feeds", "SKILL.md")));
  assert.equal(market.plugins[0].name, plugin.name);
  assert.equal(market.plugins[0].source, "./");
  assert.doesNotMatch(JSON.stringify([plugin, market]), /mobirise/i);
});

test("registry.json is a valid shadcn registry whose files exist and land in components/ and lib/", () => {
  const reg = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  assert.equal(reg.$schema, "https://ui.shadcn.com/schema/registry.json");
  assert.equal(reg.name, "electricblaze");
  const item = reg.items.find((i) => i.name === "instagram-feed");
  assert.ok(item, "instagram-feed item missing");
  assert.ok(["registry:block", "registry:component"].includes(item.type));
  assert.ok(item.files.length >= 5);
  for (const f of item.files) {
    assert.ok(existsSync(join(root, f.path)), `${f.path} missing`);
    assert.ok(f.type.startsWith("registry:"), f.type);
    assert.match(f.target, /^@(components|lib)\/eb\//, `${f.target} must land under @components/eb or @lib/eb`);
    if (f.type === "registry:file") assert.ok(f.target, `${f.path} needs a target`);
  }
  // the component's relative import must still resolve after install
  const tsx = readFileSync(join(root, "src/templates/next/InstagramFeed.tsx"), "utf8");
  assert.match(tsx, /from "\.\.\/\.\.\/lib\/eb\/instagram"/);
  assert.ok(item.files.some((f) => f.target === "@lib/eb/instagram.ts"));
  assert.equal(item.envVars.ELECTRICBLAZE_API_KEY, "");
  assert.match(item.docs, /electricblaze doctor/);
});

test("skill command installs the skill for both agents and is idempotent", () => {
  const dir = mkdtempSync(join(tmpdir(), "eb-skill-"));
  const first = runJson(["skill", `--dir=${dir}`]);
  assert.equal(first.code, 0);
  assert.deepEqual(first.data.agents, ["claude", "codex"]);
  for (const p of [".claude/skills/electricblaze-feeds/SKILL.md", ".agents/skills/electricblaze-feeds/SKILL.md", ".agents/skills/electricblaze-feeds/references/schema.md"]) {
    assert.ok(existsSync(join(dir, p)), `${p} missing`);
  }
  const again = runJson(["skill", `--dir=${dir}`]);
  assert.ok(again.data.files.every((f) => f.status === "unchanged"));

  writeFileSync(join(dir, ".claude/skills/electricblaze-feeds/SKILL.md"), "---\nname: mine\n---\n");
  const kept = runJson(["skill", `--dir=${dir}`, "--agent=claude"]);
  assert.equal(kept.data.files.find((f) => f.path.endsWith("SKILL.md")).status, "skipped");
  assert.ok(kept.data.files.every((f) => f.agent === "claude"));

  const bad = runJson(["skill", `--dir=${dir}`, "--agent=cursor"]);
  assert.equal(bad.code, 2);
  rmSync(dir, { recursive: true, force: true });
});
