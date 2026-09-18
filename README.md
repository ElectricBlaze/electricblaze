# electricblaze

Social feeds for sites that AI writes. One schema for every source, a
component with demo data in one command, and the account connection handled
for you. The UI is yours, or your agent's. The data layer is ours.

```
npx electricblaze add instagram-feed
```

That puts a working Instagram feed into the project: a component for Next.js
App Router, the feed JSON and types for Astro, SvelteKit, Nuxt and friends, or
a drop-in kit for plain HTML, with twelve realistic demo posts so the page
renders before anyone signs up for anything.

**Status: 0.1.2, Instagram only.** `add`, `preview`, `doctor` and `skill` work
today, in demo mode. Real posts today come from the [ElectricBlaze
widget](https://electricblaze.com): the site owner connects the Instagram
account there and pastes the embed snippet. The JSON API that feeds the
generated component, with `login`, `connect` and `list`, ships in 0.2. TikTok
and YouTube are planned; `add tiktok-feed` exits 2 rather than pretending.

## Three ways in

| You use            | Run                                                             |
|--------------------|-----------------------------------------------------------------|
| Any terminal       | `npx electricblaze add instagram-feed`                          |
| shadcn CLI         | `npx shadcn@latest add ElectricBlaze/electricblaze/instagram-feed` |
| Claude Code, Codex | `npx electricblaze skill` (installs the agent skill into the project) |

Claude Code can also install the skill as a plugin:
`/plugin marketplace add ElectricBlaze/electricblaze`, then
`/plugin install electricblaze@electricblaze`.

Pin the version when a script or an agent runs it: `npx electricblaze@0.1.2`.
Every version is published from GitHub Actions with npm provenance
(`npm audit signatures`), and [SECURITY.md](SECURITY.md) says what the CLI
touches.

## Commands

All commands are non-interactive, never prompt, and accept `--json`.
Exit codes: `0` done, `1` error, `2` needs something that is not there yet
(the output always says what to run next). An unknown flag, a flag that does
not apply to the command or a flag without its value is exit `2` too, never a
silent no-op.

```
npx electricblaze add instagram-feed     # component + demo data into this project
npx electricblaze preview instagram      # the feed as JSON (demo until connected)
npx electricblaze doctor                 # check the setup, get the next command
npx electricblaze skill                  # agent skill into .claude/skills and .agents/skills
npx electricblaze login                  # 0.2: device flow, like gh / vercel
npx electricblaze connect instagram      # 0.2: prints a URL for the user, polls
```

Flags: `--json`, `--force` (replace files you edited), `--dir=<path>`,
`--framework=next|html|data`, `--agent=claude,codex`, `--limit=<n>`,
`--formats=reel,post`.

### What `add` writes

Next.js App Router (detected from `package.json` and `app/`):

```
components/eb/InstagramFeed.tsx          async Server Component, grid with badges
components/eb/InstagramFeed.module.css   restyle freely
lib/eb/instagram.ts                      getInstagramFeed(): demo now, API when a key is set (0.2)
lib/eb/feed.d.ts                         the feed schema (types)
lib/eb/demo/instagram.json               12 sample posts
.env.example                             ELECTRICBLAZE_API_KEY=
```

Render it anywhere: `<InstagramFeed limit={8} formats={["reel"]} />`. The
output names the import path, using the `@/*` alias when `tsconfig.json`
has one.

Astro, SvelteKit, Nuxt, Remix, React Router, Gatsby, Vite (`data`, detected
from `package.json`): only the data, because those frameworks would not serve
a kit dropped into the project root.

```
lib/eb/feed.d.ts                         the feed schema (types)
lib/eb/demo/instagram.json               12 sample posts
```

Both land under `src/` when the project has it. Read the JSON in the
framework's loader and render it; the skill below tells an agent exactly how.

Plain HTML (the fallback for everything else):

```
electricblaze/instagram-feed.js          renders [data-eb-feed="instagram"] elements
electricblaze/instagram-feed.css
electricblaze/instagram.json             the feed
electricblaze/instagram.demo.js          the same feed, loadable from file://
electricblaze/feed.d.ts
```

```html
<link rel="stylesheet" href="electricblaze/instagram-feed.css">
<div data-eb-feed="instagram" data-limit="8"></div>
<script src="electricblaze/instagram.demo.js"></script>
<script src="electricblaze/instagram-feed.js" defer></script>
```

`add` never overwrites a file you changed (line endings do not count as a
change); it reports the file as kept and `--force` replaces it. If the project
has `AGENTS.md` or `CLAUDE.md`, `add` appends a short marked block that tells
coding agents how the feed works and where real posts come from.

`doctor` finds whichever kit is installed, even one that does not match the
detected framework, validates the feed file against the schema and warns if
`ELECTRICBLAZE_API_KEY` is set before the API exists.

## Real posts

Two routes, both honest about today:

- **The widget, today.** Sign up at https://electricblaze.com, create an
  Instagram Feed widget, connect the Instagram account (Business or Creator;
  Instagram does not share posts from personal profiles) and paste the
  generated snippet where the feed belongs. Free plan: 5 widgets, 1,000 views
  a month, refresh every 24 hours; the Start plan removes the view limit and
  refreshes hourly.
- **JSON in the generated component, 0.2.** `npx electricblaze connect
  instagram` prints a link for the account owner; real posts then flow into
  the same schema and the demo label goes away. Until then leave
  `ELECTRICBLAZE_API_KEY` unset: the loader would call an endpoint that does
  not answer yet.

## The agent skill

`skills/electricblaze-feeds/` is an [Agent Skill](https://agentskills.io):
a `SKILL.md` with the workflow (add, wire in, restyle, filter, doctor, hand the
account connection to a human) and two references: the feed schema and the
current platform API facts with their check date (Basic Display is gone,
professional accounts only, 60-day tokens, `media_product_type` for reels,
YouTube quotas and unflagged Shorts). It triggers on requests like "add an
Instagram feed to the footer" and stops the agent from writing a fragile Graph
API fetch by hand.

- Claude Code: `.claude/skills/electricblaze-feeds/` (project) or the plugin above.
- Codex: `.agents/skills/electricblaze-feeds/` (project) or `~/.agents/skills/`.

`npx electricblaze skill` writes both; `--agent=claude` or `--agent=codex`
picks one. It never overwrites a skill you edited.

## The shadcn registry

`registry.json` at the repository root makes this repo a shadcn registry with
no build step or hosting. `npx shadcn@latest add ElectricBlaze/electricblaze/instagram-feed`
installs the same Next.js files as `add`, into your configured `components/`
and `lib/` aliases, and adds `ELECTRICBLAZE_API_KEY=` to `.env.local`.

## Feed schema

Every source is returned in one shape: `schema/feed.d.ts` (TypeScript types)
and `schema/validate.js` (dependency-free runtime check). A `Feed` wraps an
`origin` (profile, hashtag, playlist, board or channel) and a list of `Post`s.
A post has a `type` that tells a renderer what to draw (`image`, `video`,
`carousel`, `text`, `link`) and a `format` that tells what the platform calls
it (`post`, `reel`, `short`, `live`, `clip`, ...). Platform-specific data stays
in `raw`.

```ts
import type { Feed, Post } from "electricblaze";
import { validateFeed } from "electricblaze/schema";
```

## Demo feeds

`demo/instagram.json` is a synthetic feed in schema v1: 12 posts covering
images, carousels, feed videos and reels, with `demo: true`. Nothing in it
points at a real Instagram account. Demo media (photos and short videos) live
in `demo/media/` and are served through jsDelivr until the ElectricBlaze CDN
exists; sources and licenses are in `demo/media/SOURCES.md`. The media folder
is not part of the npm package.

## Links

Site: https://electricblaze.com · Source: https://github.com/ElectricBlaze/electricblaze
· [Changelog](CHANGELOG.md) · [Security](SECURITY.md)

License: MIT
