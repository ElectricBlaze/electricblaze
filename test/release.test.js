import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const notes = (version) => execFileSync(process.execPath, [join(root, ".github", "scripts", "release-notes.mjs"), version], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("CHANGELOG.md has a section for the version about to be published", () => {
  const out = notes(pkg.version);
  assert.ok(out.length > 100, "release notes look empty");
  assert.match(out, new RegExp(`npx electricblaze@${pkg.version.replace(/\./g, "\\.")}`));
  assert.doesNotMatch(out, /^## /m, "the section must not spill into the next version");
});

test("release notes fail loudly for a version the changelog does not know", () => {
  assert.throws(() => notes("99.0.0"), /no "## 99\.0\.0" section/);
});

test("nothing shipped to agents promises TikTok or YouTube as working today", () => {
  const files = [
    "README.md",
    "src/templates/agents.md",
    "skills/electricblaze-feeds/SKILL.md",
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    "package.json",
  ];
  for (const f of files) {
    const text = readFileSync(join(root, f), "utf8");
    if (/tiktok|youtube/i.test(text)) assert.match(text, /planned|not available|exits? 2/i, `${f} mentions TikTok or YouTube without saying they are planned`);
  }
  const platforms = readFileSync(join(root, "skills", "electricblaze-feeds", "references", "platforms.md"), "utf8");
  assert.match(platforms, /Checked \d{4}-\d{2}-\d{2}/, "platform facts need a check date");
});
