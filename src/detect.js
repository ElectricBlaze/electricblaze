import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Frameworks `add` knows but has no component template for: they get the data-only kit. */
const DATA_ONLY = ["astro", "@sveltejs/kit", "nuxt", "@remix-run/react", "react-router", "gatsby", "vite"];

/**
 * Detect the project's framework. Returns
 *   {
 *     framework: "next" | "data" | "html",
 *     router?: "app" | "pages",      // next only
 *     srcDir: boolean,               // files go under src/
 *     typescript: boolean,
 *     alias?: string,                // "@" when tsconfig/jsconfig maps "@/*"
 *     packageName?: string,
 *     known?: string,                // the dependency that triggered "data"
 *     hint?: string,
 *   }
 * "data" is for frameworks with a build step but no template (Astro, SvelteKit, Nuxt, ...):
 * they get the feed JSON and types only. "html" is the fallback for everything else.
 */
export function detectFramework(dir) {
  const pkgPath = join(dir, "package.json");
  let deps = {}, packageName;
  if (existsSync(pkgPath)) {
    try {
      const p = JSON.parse(readFileSync(pkgPath, "utf8"));
      deps = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
      packageName = p.name;
    } catch { /* unreadable package.json: treat as plain html */ }
  }
  const typescript = existsSync(join(dir, "tsconfig.json"));
  const alias = readAlias(dir);

  if (deps.next) {
    const app = existsSync(join(dir, "app")) || existsSync(join(dir, "src", "app"));
    const pages = existsSync(join(dir, "pages")) || existsSync(join(dir, "src", "pages"));
    const srcDir = existsSync(join(dir, "src", "app")) || existsSync(join(dir, "src", "pages"));
    return {
      framework: "next", router: app ? "app" : pages ? "pages" : "app", srcDir, typescript, alias, packageName,
      hint: !app && pages ? "Pages Router detected: the generated component is an async Server Component and needs the App Router." : undefined,
    };
  }
  const known = DATA_ONLY.find((k) => deps[k]);
  if (known) {
    return {
      framework: "data", srcDir: existsSync(join(dir, "src")), typescript, alias, packageName, known,
      hint: `${known} detected: no component template for it yet, so only the feed JSON and types are written. Build the component against them (see the skill), or pass --framework=html for the plain HTML kit.`,
    };
  }
  return { framework: "html", srcDir: false, typescript, alias, packageName };
}

/** "@" when tsconfig.json or jsconfig.json maps "@/*" (create-next-app, Vite templates); otherwise undefined. */
function readAlias(dir) {
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    const p = join(dir, name);
    if (!existsSync(p)) continue;
    try {
      const text = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      const paths = JSON.parse(text)?.compilerOptions?.paths ?? {};
      const key = Object.keys(paths).find((k) => k.endsWith("/*"));
      if (key) return key.slice(0, -2);
    } catch { /* comments or trailing commas we could not strip: no alias */ }
  }
  return undefined;
}
