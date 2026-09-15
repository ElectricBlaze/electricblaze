import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { list } from "../args.js";
import { emit, writeSafe, PKG_ROOT, HOME } from "../io.js";

const SKILL = "electricblaze-feeds";
const TARGETS = {
  claude: join(".claude", "skills", SKILL),
  codex: join(".agents", "skills", SKILL),
};

const posix = (p) => p.split(sep).join("/");

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, base));
    else out.push(relative(base, full));
  }
  return out;
}

/** Install the ElectricBlaze skill into the project for Claude Code and/or Codex. */
export function skill({ flags }) {
  const dir = flags.dir ? String(flags.dir) : process.cwd();
  const wanted = flags.agent ? list(flags.agent) : ["claude", "codex"];
  const unknown = wanted.filter((a) => !TARGETS[a]);
  if (unknown.length) {
    emit(flags,
      { ok: false, error: `unknown --agent "${unknown.join(",")}"`, supported: Object.keys(TARGETS), next: "Run: npx electricblaze skill --agent=claude,codex" },
      `✗ Unknown --agent "${unknown.join(",")}". Supported: ${Object.keys(TARGETS).join(", ")}\n→ Run: npx electricblaze skill --agent=claude,codex`);
    return 2;
  }
  const src = join(PKG_ROOT, "skills", SKILL);
  const force = Boolean(flags.force);
  const files = [];
  for (const agent of wanted) {
    for (const rel of walk(src)) {
      const target = join(TARGETS[agent], rel);
      files.push({ agent, path: posix(target), status: writeSafe(join(dir, target), readFileSync(join(src, rel), "utf8"), { force }) });
    }
  }
  const written = files.filter((f) => f.status === "written").length;
  const skipped = files.filter((f) => f.status === "skipped").length;
  const glyph = { written: "✓", unchanged: "=", skipped: "·" };
  const next = "Start a new agent session in this project; the skill triggers on requests like \"add an Instagram feed to the footer\".";
  emit(flags,
    { ok: true, skill: SKILL, agents: wanted, dir, files, next },
    [
      files.map((f) => `${glyph[f.status]} ${f.path}${f.status === "skipped" ? "   (exists and differs: kept; --force replaces it)" : ""}`).join("\n"),
      `i ${written} written, ${files.length - written - skipped} unchanged, ${skipped} kept`,
      `i ${next}`,
      `  Claude Code also installs it as a plugin: /plugin marketplace add ElectricBlaze/electricblaze`,
      `  ${HOME}`,
    ].join("\n"));
  return 0;
}
