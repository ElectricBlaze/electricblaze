import { parseArgs } from "./args.js";
import { pkg, emit, HOME } from "./io.js";
import { add } from "./commands/add.js";
import { preview } from "./commands/preview.js";
import { doctor } from "./commands/doctor.js";
import { stub } from "./commands/stub.js";

const COMMANDS = {
  add: { run: add, help: "add <component>      copy a feed component into this project (demo data; never overwrites edits)" },
  preview: { run: preview, help: "preview [source]     print the feed as JSON (demo until an account is connected)" },
  doctor: { run: doctor, help: "doctor               check the setup; every problem comes with the next command to run" },
  login: { run: (ctx) => stub("login", ctx), help: "login                (0.2) device-flow sign in" },
  connect: { run: (ctx) => stub("connect", ctx), help: "connect <source>     (0.2) print a URL for the user to connect an account" },
  list: { run: (ctx) => stub("list", ctx), help: "list                 (0.2) connected accounts" },
};

const FLAGS = ["--json", "--yes", "--force", "--dir=<path>", "--framework=next|html", "--limit=<n>", "--formats=reel,post"];

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
  try {
    return await command.run(parsed);
  } catch (e) {
    emit(flags, { ok: false, error: e.message, next: "Run: npx electricblaze doctor --json" }, `✗ ${e.message}\n→ Run: npx electricblaze doctor --json`);
    return 1;
  }
}
