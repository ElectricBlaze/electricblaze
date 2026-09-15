// Tiny argv parser: `cmd positional... --flag --key=value`. No prompts, no deps.
export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split(/=(.*)/s);
      flags[k] = v === undefined ? true : v;
    } else if (a === "-v") flags.version = true;
    else if (a === "-h") flags.help = true;
    else positional.push(a);
  }
  const [cmd, ...rest] = positional;
  return { cmd: cmd ?? null, positional: rest, flags };
}

export function list(v) {
  return typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}
