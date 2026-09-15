## Social feeds (ElectricBlaze)

Instagram, TikTok and YouTube feeds on this site come from ElectricBlaze. The
feed shape is schema v1 (see the copied `feed.d.ts`): a `Feed` with `origin`
and `posts`; each `Post` has `type` (image | video | carousel | text | link)
for rendering and `format` (post | reel | short | ...) for filtering.

- `npx electricblaze preview instagram --json` prints the current feed
  (demo data until an account is connected).
- `npx electricblaze doctor --json` checks the setup and explains what to do next.
- `npx electricblaze add <source>-feed --json` adds another feed; it never
  overwrites edited files (use `--force` to replace them).
- All commands are non-interactive and support `--json`. To show real posts a
  human must connect the account: `npx electricblaze connect instagram` prints
  a URL for them.
