// Print the CHANGELOG.md section for a version. Used by publish.yml for the GitHub release
// and fails when the section is missing, so a release without notes cannot happen.
import { readFileSync } from "node:fs";

const version = process.argv[2];
if (!version) {
  console.error("usage: node release-notes.mjs <version>");
  process.exit(2);
}
const md = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
const section = md.split(/^## /m).slice(1).find((s) => /^\S+/.exec(s)?.[0] === version);
if (!section) {
  console.error(`CHANGELOG.md has no "## ${version}" section`);
  process.exit(1);
}
const body = section.split("\n").slice(1).join("\n").trim();
process.stdout.write(`${body}\n\nInstall: \`npx electricblaze@${version}\`. Published from GitHub Actions with npm provenance.\n`);
