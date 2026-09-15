import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Detect the project's framework. Returns
 *   { framework: "next" | "html", router?: "app" | "pages", srcDir: boolean, typescript: boolean, packageName?: string, hint?: string }
 * "html" is the fallback for anything add does not have a template for.
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
  const srcDir = existsSync(join(dir, "src", "app")) || existsSync(join(dir, "src", "pages"));
  const typescript = existsSync(join(dir, "tsconfig.json"));

  if (deps.next) {
    const app = existsSync(join(dir, "app")) || existsSync(join(dir, "src", "app"));
    const pages = existsSync(join(dir, "pages")) || existsSync(join(dir, "src", "pages"));
    return {
      framework: "next", router: app ? "app" : pages ? "pages" : "app", srcDir, typescript, packageName,
      hint: !app && pages ? "Pages Router detected: the generated component is an async Server Component and needs the App Router." : undefined,
    };
  }
  const known = ["astro", "@sveltejs/kit", "nuxt", "@remix-run/react", "gatsby", "vite"].find((k) => deps[k]);
  return {
    framework: "html", srcDir: false, typescript, packageName,
    hint: known ? `${known} detected: no template for it yet, writing the plain HTML version; adapt it to your framework using lib types in electricblaze/feed.d.ts.` : undefined,
  };
}
