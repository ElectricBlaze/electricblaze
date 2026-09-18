# Changelog

All notable changes to the `electricblaze` CLI. Versions are published to npm
from GitHub Actions with provenance; the GitHub release for a tag carries the
matching section of this file.

## 0.1.2 - 2026-09-18

### Added
- `--framework=data`, detected automatically for Astro, SvelteKit, Nuxt, Remix,
  React Router, Gatsby and Vite: writes only `lib/eb/demo/instagram.json` and
  `lib/eb/feed.d.ts` (under `src/` when the project has it) instead of a plain
  HTML kit those frameworks would not serve.
- Flag validation: an unknown flag, a flag that does not apply to the command,
  a flag without its value (`--dir`) or a bad `--limit` exits 2 with the list
  of accepted flags. A typo is no longer a silent no-op.
- `preview instagram-feed` is accepted as an alias of `preview instagram`.
- `CHANGELOG.md`, `SECURITY.md`; the publish workflow creates a GitHub release
  from the changelog section of the tag.

### Changed
- The skill, README, `doctor` and the block written into `AGENTS.md` and
  `CLAUDE.md` describe the two routes to real posts honestly: the
  ElectricBlaze widget embed works today, the JSON API for the generated
  component ships in 0.2. TikTok and YouTube are described as planned, not
  available.
- `doctor` finds whichever kit is installed (Next.js, data-only or plain HTML)
  even when it does not match the detected framework, and reports `kit` in
  `--json`.
- `doctor` says plainly that setting `ELECTRICBLAZE_API_KEY` before 0.2 makes
  the loader throw; the loader's header comment says the same.
- Line endings are ignored when deciding whether a file was edited, so a
  checkout with `autocrlf` no longer turns every file into "kept".
- The import path suggested after `add` uses the `@/*` alias from
  `tsconfig.json` or `jsconfig.json` when the project has one.
- Carousel badge says "items" instead of "photos" when the carousel contains a
  video.
- `bin` sets `process.exitCode` instead of calling `process.exit()`, so piped
  JSON is never cut off.
- `references/platforms.md` carries the check date and the documentation
  sources; the reel and carousel facts name the exact fields.
- The publish workflow no longer installs an unpinned `npm@latest`; it checks
  that the bundled npm supports trusted publishing instead.

## 0.1.1 - 2026-09-15

- Agent skill `electricblaze-feeds` (workflow, schema, platform facts) and the
  `skill` command that installs it into `.claude/skills/` and `.agents/skills/`.
- Claude Code plugin and marketplace manifests (`.claude-plugin/`).
- `registry.json`: the repository is a shadcn registry
  (`npx shadcn@latest add ElectricBlaze/electricblaze/instagram-feed`).

## 0.1.0 - 2026-09-15

- `add instagram-feed` for Next.js App Router and plain HTML, `preview`,
  `doctor`; all non-interactive with `--json` and exit codes 0/1/2.
- Feed schema v1 (`schema/feed.d.ts`) with a dependency-free validator.
- Synthetic Instagram demo feed with self-hosted media.

## 0.0.3 - 2026-09-15

- The CLI reads its version from `package.json`.

## 0.0.1 - 2026-09-15

- Name reserved on npm; CI and trusted publishing set up.
