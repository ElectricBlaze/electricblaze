# electricblaze

Social feeds for sites that AI writes. Instagram, TikTok and YouTube data with
authorization, cache and repair of breaking APIs. The UI is yours, or your
agent's. The data layer is ours.

```
npx electricblaze add instagram-feed
```

That puts a working Instagram feed into the project in one command: a
component for Next.js App Router or a drop-in kit for plain HTML, with twelve
realistic demo posts so the page renders before anyone signs up for anything.
Connecting a real account is the next step, and the only one that needs a
human.

**Status: 0.1.** `add`, `preview`, `doctor` and `skill` work today, in demo
mode. `login`, `connect` and `list` need the ElectricBlaze API and ship in 0.2.

## Three ways in

| You use            | Run                                                             |
|--------------------|-----------------------------------------------------------------|
| Any terminal       | `npx electricblaze add instagram-feed`                          |
| shadcn CLI         | `npx shadcn@latest add ElectricBlaze/electricblaze/instagram-feed` |
| Claude Code, Codex | `npx electricblaze skill` (installs the agent skill into the project) |

Claude Code can also install the skill as a plugin:
`/plugin marketplace add ElectricBlaze/electricblaze`, then
`/plugin install electricblaze@electricblaze`.

## Commands

All commands are non-interactive, never prompt, and accept `--json`.
Exit codes: `0` done, `1` error, `2` needs something that is not there yet
(the output always says what to run next).

```
npx electricblaze add instagram-feed     # component + demo data into this project
npx electricblaze preview instagram      # the feed as JSON (demo until connected)
npx electricblaze doctor                 # check the setup, get the next command
npx electricblaze skill                  # agent skill into .claude/skills and .agents/skills
npx electricblaze login                  # 0.2: device flow, like gh / vercel
npx electricblaze connect instagram      # 0.2: prints a URL for the user, polls
```

Flags: `--json`, `--force` (replace files you edited), `--dir=<path>`,
`--framework=next|html`, `--agent=claude,codex`, `--limit=<n>`,
`--formats=reel,post`.

### What `add` writes

Next.js App Router (detected from `package.json` and `app/`):

```
components/eb/InstagramFeed.tsx          async Server Component, grid with badges
components/eb/InstagramFeed.module.css   restyle freely
lib/eb/instagram.ts                      getInstagramFeed(): demo now, API when a key is set
lib/eb/feed.d.ts                         the feed schema (types)
lib/eb/demo/instagram.json               12 sample posts
.env.example                             ELECTRICBLAZE_API_KEY=
```

Render it anywhere: `<InstagramFeed limit={8} formats={["reel"]} />`.

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

`add` never overwrites a file you changed; it reports it as kept and `--force`
replaces it. If the project has `AGENTS.md` or `CLAUDE.md`, `add` appends a
short block that tells coding agents how the feed works.

## The agent skill

`skills/electricblaze-feeds/` is an [Agent Skill](https://agentskills.io):
a `SKILL.md` with the workflow (add, wire in, restyle, filter, doctor, hand the
account connection to a human) and two references: the feed schema and the
current platform API facts (Basic Display is gone, professional accounts only,
60-day tokens, YouTube quotas and unflagged Shorts). It triggers on requests
like "add an Instagram feed to the footer" and stops the agent from writing a
fragile Graph API fetch by hand.

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

License: MIT
