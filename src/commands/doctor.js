import { existsSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { detectFramework } from "../detect.js";
import { emit, HOME } from "../io.js";
import { validateFeed } from "../../schema/validate.js";

const posix = (p) => p.split(sep).join("/");

export function doctor({ flags }) {
  const dir = flags.dir ? String(flags.dir) : process.cwd();
  const checks = [];
  const check = (name, status, detail, next) => checks.push({ name, status, detail, ...(next ? { next } : {}) });

  const major = Number(process.versions.node.split(".")[0]);
  check("node", major >= 18 ? "ok" : "fail", `Node ${process.versions.node}`, major >= 18 ? undefined : "Install Node 18 or newer.");

  const d = detectFramework(dir);
  check("framework", "ok", d.framework === "next" ? `Next.js (${d.router} router${d.srcDir ? ", src/" : ""})` : "plain HTML", d.hint);

  const base = d.srcDir ? "src" : ".";
  const expected = d.framework === "next"
    ? [join(base, "components", "eb", "InstagramFeed.tsx"), join(base, "lib", "eb", "instagram.ts"), join(base, "lib", "eb", "demo", "instagram.json")]
    : [join("electricblaze", "instagram-feed.js"), join("electricblaze", "instagram.json")];
  const missing = expected.filter((p) => !existsSync(join(dir, p)));
  if (missing.length === expected.length) check("component", "warn", "no ElectricBlaze feed in this project", "Run: npx electricblaze add instagram-feed");
  else if (missing.length) check("component", "fail", `missing ${missing.map(posix).join(", ")}`, "Run: npx electricblaze add instagram-feed --force");
  else check("component", "ok", `instagram-feed (${d.framework})`);

  const feedFile = d.framework === "next"
    ? join(dir, base, "lib", "eb", "demo", "instagram.json")
    : join(dir, "electricblaze", "instagram.json");
  if (existsSync(feedFile)) {
    try {
      const feed = JSON.parse(readFileSync(feedFile, "utf8"));
      const errors = validateFeed(feed);
      if (errors.length) check("feed", "fail", `${errors.length} schema problem(s): ${errors.slice(0, 3).join("; ")}`, "Fix the feed file or re-run: npx electricblaze add instagram-feed --force");
      else check("feed", "ok", `${feed.posts.length} posts, schema v${feed.schemaVersion}${feed.demo ? ", demo data" : ""}`);
    } catch (e) {
      check("feed", "fail", `cannot parse ${feedFile}: ${e.message}`, "Re-run: npx electricblaze add instagram-feed --force");
    }
  }

  const key = process.env.ELECTRICBLAZE_API_KEY || readEnvKey(join(dir, ".env.local")) || readEnvKey(join(dir, ".env"));
  if (key) check("account", "warn", "ELECTRICBLAZE_API_KEY is set, but the API ships in 0.2; the site still renders demo data", `Keep the key; watch ${HOME} for the API release.`);
  else check("account", "warn", "not connected: demo feed", "Connect an account when the API ships: npx electricblaze connect instagram");

  const failed = checks.filter((c) => c.status === "fail");
  const data = { ok: failed.length === 0, dir, framework: d.framework, checks };
  const glyph = { ok: "✓", warn: "!", fail: "✗" };
  emit(flags, data, checks.map((c) => `${glyph[c.status]} ${c.name.padEnd(10)} ${c.detail}${c.next ? `\n  → ${c.next}` : ""}`).join("\n"));
  return failed.length ? 1 : 0;
}

function readEnvKey(path) {
  if (!existsSync(path)) return "";
  const m = readFileSync(path, "utf8").match(/^\s*ELECTRICBLAZE_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
  return m ? m[1].trim() : "";
}
