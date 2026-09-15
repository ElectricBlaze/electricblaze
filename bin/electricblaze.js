#!/usr/bin/env node
// electricblaze 0.0.1 — name reservation release.
// Never interactive: prints, exits 0. Honors --json for agents.

const VERSION = "0.0.1";
const HOME = "https://electricblaze.com";

const args = process.argv.slice(2);
const json = args.includes("--json");
const cmd = args.find((a) => !a.startsWith("-")) ?? null;

const planned = ["add", "preview", "doctor", "login", "connect", "list"];

if (args.includes("--version") || args.includes("-v")) {
  process.stdout.write(json ? JSON.stringify({ version: VERSION }) + "\n" : VERSION + "\n");
  process.exit(0);
}

const payload = {
  name: "electricblaze",
  version: VERSION,
  status: "reserved",
  message: "The CLI is not released yet. Commands add / preview / doctor ship in 0.1.",
  requested: cmd,
  planned,
  next: `Read ${HOME} for the current way to add an Instagram, TikTok or YouTube feed to a site.`,
};

if (json) {
  process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  process.exit(0);
}

process.stdout.write(
  [
    `electricblaze ${VERSION} — name reserved, CLI not released yet.`,
    ``,
    cmd ? `You ran: electricblaze ${cmd}` : ``,
    `Planned commands: ${planned.join(", ")}`,
    `add / preview / doctor ship in 0.1.`,
    ``,
    `Next step: read ${HOME}`,
    `Agents: run with --json for machine-readable output.`,
    ``,
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
);
process.exit(0);
