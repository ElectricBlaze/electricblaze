import { readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { detectFramework } from "../detect.js";
import { emit, writeSafe, ensureLine, ensureBlock, readTemplate, loadDemo, PKG_ROOT, HOME } from "../io.js";

const posix = (p) => p.split(sep).join("/");

const COMPONENTS = { "instagram-feed": "instagram" };
const FRAMEWORKS = ["next", "html", "data"];
const SNIPPET = [
  '<link rel="stylesheet" href="electricblaze/instagram-feed.css">',
  '<div data-eb-feed="instagram" data-limit="8"></div>',
  '<script src="electricblaze/instagram.demo.js"></script>',
  '<script src="electricblaze/instagram-feed.js" defer></script>',
];
const NEXT_STEP = `To show real posts today, connect the account in the ElectricBlaze widget and paste its embed snippet (${HOME}). The JSON API for this component (npx electricblaze connect instagram) ships in 0.2. Until then this is a demo feed.`;

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
  if (!FRAMEWORKS.includes(framework)) {
    emit(flags,
      { ok: false, error: `unsupported --framework "${framework}"`, supported: FRAMEWORKS, next: "Run: npx electricblaze add instagram-feed --framework=html" },
      `✗ Unsupported --framework "${framework}". Supported: ${FRAMEWORKS.join(", ")}\n→ Run: npx electricblaze add instagram-feed --framework=html`);
    return 2;
  }

  const force = Boolean(flags.force);
  const files = [];
  const put = (rel, content) => files.push({ path: posix(rel), status: writeSafe(join(dir, rel), content, { force }) });
  const schema = readFileSync(join(PKG_ROOT, "schema", "feed.d.ts"), "utf8");
  const demoFeed = loadDemo(source);
  const demo = JSON.stringify(demoFeed, null, 2) + "\n";
  const notes = [];
  if (detected.hint && framework === detected.framework) notes.push(detected.hint);
  const base = detected.srcDir ? "src" : ".";

  if (framework === "next") {
    put(join(base, "components", "eb", "InstagramFeed.tsx"), readTemplate("next", "InstagramFeed.tsx"));
    put(join(base, "components", "eb", "InstagramFeed.module.css"), readTemplate("next", "InstagramFeed.module.css"));
    put(join(base, "lib", "eb", "instagram.ts"), readTemplate("next", "instagram.ts"));
    put(join(base, "lib", "eb", "feed.d.ts"), schema);
    put(join(base, "lib", "eb", "demo", "instagram.json"), demo);
    files.push({ path: ".env.example", status: ensureLine(join(dir, ".env.example"), "ELECTRICBLAZE_API_KEY=") });
    files.push({ path: ".gitignore", status: ensureGitignore(join(dir, ".gitignore")) });
    // "@/components/..." when tsconfig maps "@/*" (create-next-app default); otherwise a path relative to app/page.tsx.
    const importPath = detected.alias ? `${detected.alias}/components/eb/InstagramFeed` : "../components/eb/InstagramFeed";
    const where = detected.alias ? "any App Router page" : "app/page.tsx (adjust the relative path for nested pages)";
    notes.push(`Render it in ${where}: import InstagramFeed from "${importPath}"; then <InstagramFeed limit={8} />`);
  } else if (framework === "data") {
    put(join(base, "lib", "eb", "feed.d.ts"), schema);
    put(join(base, "lib", "eb", "demo", "instagram.json"), demo);
    const feedPath = posix(join(base, "lib", "eb", "demo", "instagram.json"));
    notes.push(`Read ${feedPath} in the framework's loader (Astro frontmatter, SvelteKit load, Nuxt useAsyncData) and render a grid: thumbnailUrl linking to url, a badge for type "video" and "carousel", a small "demo feed" label while feed.demo is true. Types: ${posix(join(base, "lib", "eb", "feed.d.ts"))}.`);
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
  const label = { next: "Next.js App Router", html: "plain HTML", data: "feed data and types only" }[framework];
  const data = { ok: true, component: name, source, framework, dir, files, demo: true, snippet: framework === "html" ? SNIPPET : undefined, notes, next: NEXT_STEP };
  const glyph = { written: "✓", unchanged: "=", skipped: "·" };
  const lines = files.map((f) => `${glyph[f.status]} ${f.path}${f.status === "skipped" ? "   (exists and differs: kept; --force replaces it)" : ""}`);
  emit(flags, data, [
    lines.join("\n"),
    `i ${label}: ${written} written, ${files.length - written - skipped} unchanged, ${skipped} kept`,
    ...notes.map((n) => `i ${n}`),
    `i demo feed with ${demoFeed.posts.length} sample posts. ${NEXT_STEP}`,
  ].join("\n"));
  return 0;
}

function ensureGitignore(path) {
  try {
    const text = readFileSync(path, "utf8");
    if (/^\s*(\.env(\*|\.local|\.\*)?|\*\.local)\s*$/m.test(text)) return "unchanged";
  } catch {
    // no .gitignore yet: ensureLine creates it
  }
  return ensureLine(path, ".env.local");
}
