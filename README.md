# electricblaze

Social feeds for sites that AI writes. Instagram, TikTok and YouTube data with
authorization, cache and repair of breaking APIs. The UI is yours (or your
agent's); the data layer is ours.

**Status: 0.0.1 reserves the name. The CLI ships in 0.1.**

Planned surface, all commands non-interactive, all support `--json`:

```
npx electricblaze add instagram-feed   # component into your project, demo data, .env.example
npx electricblaze preview instagram    # feed JSON in stdout (demo if not connected)
npx electricblaze doctor               # keys, domain, quotas, token expiry
npx electricblaze login                # device flow
npx electricblaze connect instagram    # prints a URL, polls, exits 2 on timeout
```

Until then: https://electricblaze.com · Source: https://github.com/ElectricBlaze/electricblaze

License: MIT

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
images, carousels, feed videos and reels, with `demo: true`. It is what `add`
copies into a project and what `preview` prints until an account is
connected. Nothing in it points at a real Instagram account.

Demo media (photos and short videos) live in `demo/media/` and are served
through jsDelivr until the ElectricBlaze CDN exists. Sources and licenses are
in `demo/media/SOURCES.md`. The media folder is not part of the npm package.
