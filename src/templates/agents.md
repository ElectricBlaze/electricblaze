## Social feeds (ElectricBlaze)

The Instagram feed on this site comes from ElectricBlaze (TikTok and YouTube
are planned, not available yet). The feed shape is schema v1 (see the copied
`feed.d.ts`): a `Feed` with `origin` and `posts`; each `Post` has `type`
(image | video | carousel | text | link) for rendering and `format`
(post | reel | ...) for filtering.

- `npx electricblaze preview instagram --json` prints the current feed
  (demo data until an account is connected).
- `npx electricblaze doctor --json` checks the setup and explains what to do next.
- `npx electricblaze add instagram-feed --json` re-adds the component; it never
  overwrites edited files (use `--force` to replace them).
- All commands are non-interactive and support `--json`. An unknown flag is an
  error (exit 2), not a silent no-op.
- Real posts need a human. Today the site owner connects the account in the
  ElectricBlaze widget at https://electricblaze.com and pastes its embed
  snippet where the feed belongs. The JSON API for this component
  (`npx electricblaze connect instagram`) ships in 0.2.
- `npx electricblaze skill` installs the full skill (workflow, schema, platform
  facts) into `.claude/skills/` and `.agents/skills/` for Claude Code and Codex.
