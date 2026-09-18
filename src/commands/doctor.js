import { existsSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { detectFramework } from "../detect.js";
import { emit, HOME } from "../io.js";
import { validateFeed } from "../../schema/validate.js";

const posix = (p) => p.split(sep).join("/");

/** Every kit `add` can write, with the files that make it complete. `base` is "src" or ".". */
const KITS = {
  next: (base) => ({
    files: [join(base, "components", "eb", "InstagramFeed.tsx"), join(base, "lib", "eb", "instagram.ts"), join(base, "lib", "eb", "feed.d.ts"), join(base, "lib", "eb", "demo", "instagram.json")],
    feed: join(base, "lib", "eb", "demo", "instagram.json"),
  }),
  data: (base) => ({
    files: [join(base, "lib", "eb", "feed.d.ts"), join(base, "lib", "eb", "demo", "instagram.json")],
    feed: join(base, "lib", "eb", "demo", "instagram.json"),
  }),
  html: () => ({
    files: [join("electricblaze", "instagram-feed.js"), join("electricblaze", "instagram-feed.css"), join("electricblaze", "instagram.json")],
    feed: join("electricblaze", "instagram.json"),
  }),
};

/** Find whichever kit is in the project, whatever framework was detected. */
function findKit(dir) {
  const candidates = [];
  for (const base of ["src", "."]) {
    candidates.push({ kit: "next", ...KITS.next(base) });
    candidates.push({ kit: "data", ...KITS.data(base) });
  }
  candidates.push({ kit: "html", ...KITS.html() });
  for (const c of candidates) {
    const present = c.files.filter((p) => existsSync(join(dir, p)));
    if (present.length === c.files.length) return { ...c, missing: [] };
  }
  // no complete kit: report the first partial one, most specific first
  for (const c of candidates) {
    const present = c.files.filter((p) => existsSync(join(dir, p)));
    if (present.length) return { ...c, missing: c.files.filter((p) => !present.includes(p)) };
  }
  return null;
}

export function doctor({ flags }) {
  const dir = flags.dir ? String(flags.dir) : process.cwd();
  const checks = [];
  const check = (name, status, detail, next) => checks.push({ name, status, detail, ...(next ? { next } : {}) });

  const major = Number(process.versions.node.split(".")[0]);
  check("node", major >= 18 ? "ok" : "fail", `Node ${process.versions.node}`, major >= 18 ? undefined : "Install Node 18 or newer.");

  const d = detectFramework(dir);
  const label = { next: `Next.js (${d.router} router${d.srcDir ? ", src/" : ""})`, data: `${d.known} (no component template: data-only kit)`, html: "plain HTML" }[d.framework];
  check("framework", "ok", label, d.hint);

  const kit = findKit(dir);
  if (!kit) check("component", "warn", "no ElectricBlaze feed in this project", "Run: npx electricblaze add instagram-feed");
  else if (kit.missing.length) check("component", "fail", `${kit.kit} kit is incomplete: missing ${kit.missing.map(posix).join(", ")}`, `Run: npx electricblaze add instagram-feed --framework=${kit.kit} --force`);
  else {
    const kitFramework = kit.kit === "html" && d.framework === "next" ? ` (plain HTML kit in a Next.js project: served only if electricblaze/ is under public/)` : "";
    check("component", "ok", `instagram-feed (${kit.kit})${kitFramework}`);
  }

  if (kit && !kit.missing.includes(kit.feed)) {
    const feedFile = join(dir, kit.feed);
    try {
      const feed = JSON.parse(readFileSync(feedFile, "utf8"));
      const errors = validateFeed(feed);
      if (errors.length) check("feed", "fail", `${errors.length} schema problem(s): ${errors.slice(0, 3).join("; ")}`, `Fix ${posix(kit.feed)} or re-run: npx electricblaze add instagram-feed --framework=${kit.kit} --force`);
      else check("feed", "ok", `${feed.posts.length} posts, schema v${feed.schemaVersion}${feed.demo ? ", demo data" : ""}`);
    } catch (e) {
      check("feed", "fail", `cannot parse ${posix(kit.feed)}: ${e.message}`, `Re-run: npx electricblaze add instagram-feed --framework=${kit.kit} --force`);
    }
  }

  const key = process.env.ELECTRICBLAZE_API_KEY || readEnvKey(join(dir, ".env.local")) || readEnvKey(join(dir, ".env"));
  if (key) check("account", "warn", "ELECTRICBLAZE_API_KEY is set, but the JSON API ships in 0.2: with a key, getInstagramFeed() calls an endpoint that does not exist yet and throws", "Remove the key to render the demo feed; real posts today come from the widget embed: " + HOME);
  else check("account", "warn", "not connected: demo feed", `Real posts today: connect the account in the ElectricBlaze widget and paste its snippet (${HOME}). JSON by API key: npx electricblaze connect instagram, ships in 0.2.`);

  const failed = checks.filter((c) => c.status === "fail");
  const data = { ok: failed.length === 0, dir, framework: d.framework, kit: kit?.kit ?? null, checks };
  const glyph = { ok: "✓", warn: "!", fail: "✗" };
  emit(flags, data, checks.map((c) => `${glyph[c.status]} ${c.name.padEnd(10)} ${c.detail}${c.next ? `\n  → ${c.next}` : ""}`).join("\n"));
  return failed.length ? 1 : 0;
}

function readEnvKey(path) {
  if (!existsSync(path)) return "";
  const m = readFileSync(path, "utf8").match(/^\s*ELECTRICBLAZE_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
  return m ? m[1].trim() : "";
}
