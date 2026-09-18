import { parseArgs } from "./args.js";
import { pkg, emit, HOME } from "./io.js";
import { add } from "./commands/add.js";
import { preview } from "./commands/preview.js";
import { doctor } from "./commands/doctor.js";
import { skill } from "./commands/skill.js";
import { stub } from "./commands/stub.js";

// Every flag the CLI accepts. `value` = the flag needs `=value`; `int` = a positive integer.
const FLAG_SPEC = {
  json: { global: true, help: "--json" },
  yes: { global: true, help: "--yes" },
  help: { global: true, help: "--help" },
  version: { global: true, help: "--version" },
  force: { help: "--force" },
  dir: { value: true, help: "--dir=<path>" },
  framework: { value: true, help: "--framework=next|html|data" },
  agent: { value: true, help: "--agent=claude,codex" },
  limit: { value: true, int: true, help: "--limit=<n>" },
  formats: { value: true, help: "--formats=reel,post" },
};

const COMMANDS = {
  add: { run: add, flags: ["force", "dir", "framework"], help: "add <component>      copy a feed component into this project (demo data; never overwrites edits)" },
  preview: { run: preview, flags: ["limit", "formats"], help: "preview [source]     print the feed as JSON (demo until an account is connected)" },
  doctor: { run: doctor, flags: ["dir"], help: "doctor               check the setup; every problem comes with the next command to run" },
  skill: { run: skill, flags: ["force", "dir", "agent"], help: "skill                install the agent skill into .claude/skills and .agents/skills" },
  login: { run: (ctx) => stub("login", ctx), flags: [], help: "login                (0.2) device-flow sign in" },
  connect: { run: (ctx) => stub("connect", ctx), flags: [], help: "connect <source>     (0.2) print a URL for the user to connect an account" },
  list: { run: (ctx) => stub("list", ctx), flags: [], help: "list                 (0.2) connected accounts" },
};

const FLAGS = Object.values(FLAG_SPEC).map((f) => f.help);

export async function main(argv) {
  const parsed = parseArgs(argv);
  const { cmd, flags } = parsed;

  if (flags.version) {
    process.stdout.write((flags.json ? JSON.stringify({ version: pkg.version }) : pkg.version) + "\n");
    return 0;
  }
  if (!cmd || flags.help || cmd === "help") {
    const lines = Object.values(COMMANDS).map((c) => "  " + c.help);
    emit(flags,
      { name: pkg.name, version: pkg.version, commands: Object.keys(COMMANDS), flags: FLAGS, home: HOME },
      `electricblaze ${pkg.version}: social feeds for AI-built sites\n\nUsage: npx electricblaze <command> [options]\n\n${lines.join("\n")}\n\nFlags: ${FLAGS.join("  ")}\nAll commands are non-interactive. ${HOME}`);
    return cmd || flags.help ? 0 : 2;
  }
  const command = COMMANDS[cmd];
  if (!command) {
    emit(flags,
      { ok: false, error: `unknown command "${cmd}"`, commands: Object.keys(COMMANDS), next: "Run: npx electricblaze --help" },
      `✗ Unknown command "${cmd}". Commands: ${Object.keys(COMMANDS).join(", ")}\n→ Run: npx electricblaze --help`);
    return 2;
  }
  const problem = checkFlags(cmd, command, flags);
  if (problem) {
    const accepted = [...command.flags, ...Object.keys(FLAG_SPEC).filter((k) => FLAG_SPEC[k].global)].map((k) => FLAG_SPEC[k].help);
    emit(flags,
      { ok: false, error: problem, flags: accepted, next: `Run: npx electricblaze ${cmd} --help` },
      `✗ ${problem}\n  Flags for ${cmd}: ${accepted.join("  ")}\n→ Run: npx electricblaze ${cmd} --help`);
    return 2;
  }
  try {
    return await command.run(parsed);
  } catch (e) {
    emit(flags, { ok: false, error: e.message, next: "Run: npx electricblaze doctor --json" }, `✗ ${e.message}\n→ Run: npx electricblaze doctor --json`);
    return 1;
  }
}

/** A typo in a flag must not become a silent no-op. Returns a problem string or null. */
function checkFlags(cmd, command, flags) {
  for (const [name, value] of Object.entries(flags)) {
    const spec = FLAG_SPEC[name];
    if (!spec) return `unknown flag "--${name}"`;
    if (!spec.global && !command.flags.includes(name)) return `"--${name}" does not apply to ${cmd}`;
    if (spec.value && value === true) return `"--${name}" needs a value: ${spec.help}`;
    if (spec.int && !/^[1-9]\d*$/.test(String(value))) return `"--${name}" must be a positive integer: ${spec.help}`;
  }
  return null;
}
