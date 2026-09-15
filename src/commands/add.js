import { readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { detectFramework } from "../detect.js";
import { emit, writeSafe, ensureLine, ensureBlock, readTemplate, loadDemo, PKG_ROOT, HOME } from "../io.js";

const posix = (p) => p.split(sep).join("/");

const COMPONENTS = { "instagram-feed": "instagram" };
const SNIPPET = [
  '<link rel="stylesheet" href="electricblaze/instagram-feed.css">',
  '<div data-eb-feed="instagram" data-limit="8"></div>',
  '<script src="electricblaze/instagram.demo.js"></script>',
  '<script src="electricblaze/instagram-feed.js" defer></script>',
];

export function add({ positional, flags }) {
  const name = positional[0];
  if (!name || !COMPONENTS[name]) {
    const available = Object.keys(COMPONENTS);
    emit(flags,
      { ok: false, error: `unknown component "${name ?? ""}"`, available, next: `Run: npx electricblaze add ${available[0]}` },
      `✗ Unknown component "${name ?? ""}". Available: ${available.join(", ")}\n→ Run: npx electricblaze add ${available[0]}`);
    return 2;
  }
  const source = COMPONENTS[name];
  const dir = flags.dir ? String(flags.dir) : process.cwd();
  const detected = detectFramework(dir);
  const framework = flags.framework ? String(flags.framework) : detected.framework;
  if (!["next", "html"].includes(framework)) {
    emit(flags,
      { ok: false, error: `unsupported --framework "${framework}"`, supported: ["next", "html"], next: "Run: npx electricblaze add instagram-feed --framework=html" },
      `✗ Unsupported --framework "${framework}". Supported: next, html\n→ Run: npx electricblaze add instagram-feed --framework=html`);
    return 2;
  }

  const force = Boolean(flags.force);
  const files = [];
  const put = (rel, content) => files.push({ path: posix(rel), status: writeSafe(join(dir, rel), content, { force }) });
  const schema = readFileSync(join(PKG_ROOT, "schema", "feed.d.ts"), "utf8");
  const demoFeed = loadDemo(source);
  const demo = JSON.stringify(demoFeed, null, 2) + "\n";
  const notes = [];
  if (detected.hint) notes.push(detected.hint);

  if (framework === "next") {
    const base = detected.srcDir ? "src" : ".";
    put(join(base, "components", "eb", "InstagramFeed.tsx"), readTemplate("next", "InstagramFeed.tsx"));
    put(join(base, "components", "eb", "InstagramFeed.module.css"), readTemplate("next", "InstagramFeed.module.css"));
    put(join(base, "lib", "eb", "instagram.ts"), readTemplate("next", "instagram.ts"));
    put(join(base, "lib", "eb", "feed.d.ts"), schema);
    put(join(base, "lib", "eb", "demo", "instagram.json"), demo);
    files.push({ path: ".env.example", status: ensureLine(join(dir, ".env.example"), "ELECTRICBLAZE_API_KEY=") });
    files.push({ path: ".gitignore", status: ensureGitignore(join(dir, ".gitignore")) });
    const importPath = detected.srcDir ? "@/components/eb/InstagramFeed" : "../components/eb/InstagramFeed";
    notes.push(`Render it in any App Router page: import InstagramFeed from "${importPath}"; then <InstagramFeed limit={8} />`);
  } else {
    put(join("electricblaze", "instagram-feed.js"), readTemplate("html", "instagram-feed.js"));
    put(join("electricblaze", "instagram-feed.css"), readTemplate("html", "instagram-feed.css"));
    put(join("electricblaze", "instagram.json"), demo);
    put(join("electricblaze", "instagram.demo.js"), `window.ElectricBlazeFeeds = window.ElectricBlazeFeeds || {};\nwindow.ElectricBlazeFeeds.instagram = ${demo.trim()};\n`);
    put(join("electricblaze", "feed.d.ts"), schema);
    notes.push("Paste into the page:\n  " + SNIPPET.join("\n  "));
  }

  const block = readTemplate("agents.md");
  for (const md of ["AGENTS.md", "CLAUDE.md"]) {
    const status = ensureBlock(join(dir, md), "electricblaze", block);
    if (status !== "absent") files.push({ path: md, status });
  }

  const written = files.filter((f) => f.status === "written").length;
  const skipped = files.filter((f) => f.status === "skipped").length;
  const next = "To show real posts, connect the account: npx electricblaze connect instagram (ships in 0.2). Until then this is a demo feed.";
  const data = { ok: true, component: name, source, framework, dir, files, demo: true, snippet: framework === "html" ? SNIPPET : undefined, notes, next };
  const glyph = { written: "✓", unchanged: "=", skipped: "·" };
  const lines = files.map((f) => `${glyph[f.status]} ${f.path}${f.status === "skipped" ? "   (exists and differs: kept; --force replaces it)" : ""}`);
  emit(flags, data, [
    lines.join("\n"),
    `i ${framework === "next" ? "Next.js App Router" : "plain HTML"}: ${written} written, ${files.length - written - skipped} unchanged, ${skipped} kept`,
    ...notes.map((n) => `i ${n}`),
    `i demo feed with ${demoFeed.posts.length} sample posts. ${next}`,
    `  ${HOME}`,
  ].join("\n"));
  return 0;
}

function ensureGitignore(path) {
  try {
    const text = readFileSync(path, "utf8");
    if (/^\s*\.env(\*|\.local|\.\*)?\s*$/m.test(text)) return "unchanged";
  } catch {
    // no .gitignore yet: ensureLine creates it
  }
  return ensureLine(path, ".env.local");
}
