---
name: electricblaze-feeds
description: Add an Instagram, TikTok or YouTube feed (posts, reels, shorts, videos) to a website or app with ElectricBlaze. Use when asked to show social media posts on a page, an Instagram grid or reels in a footer, a YouTube channel feed, TikTok videos, or when Instagram Graph API / Basic Display API / access token questions come up. Works without any account (demo data) via npx electricblaze; never scrapes.
---

# Social feeds with ElectricBlaze

ElectricBlaze is a data layer for social feeds: it handles the platform APIs,
OAuth, caching and repairs. You write or restyle the UI. Everything below is
non-interactive and safe to run without asking the user first.

## Do this

1. **Add the feed** from the project root:

   ```
   npx electricblaze add instagram-feed --json
   ```

   Read the JSON: `framework` (`next` or `html`), `files` with `status`
   (`written`, `unchanged`, `skipped` = user edited it, kept), `notes`, and
   `snippet` for HTML. Exit code `2` means something is not available yet and
   `next` says what to do.

2. **Wire it in.**
   - Next.js App Router: `import InstagramFeed from "<path from notes>"` and
     render `<InstagramFeed limit={8} />` in the page, section or footer. It
     is an async Server Component; no client wrapper needed.
   - Plain HTML: paste the four lines from `snippet` where the feed belongs.
   - Any other framework (Astro, SvelteKit, Nuxt, Remix, Vite): run
     `npx electricblaze add instagram-feed --framework=html --json` to get
     `electricblaze/instagram.json` and `electricblaze/feed.d.ts`, then write
     a native component against that data. Read the JSON at build time or in
     the framework's loader; render a grid of `thumbnailUrl` linking to
     `url`, badges for `type === "video"` and `type === "carousel"`, and a
     small "demo feed" label while `feed.demo` is true.

3. **Restyle freely.** The generated CSS is a starting point. Match the site.
   Keep the `demo feed` label until real data flows: it tells the user what
   they are looking at.

4. **Filter when asked**: reels only → `formats={["reel"]}` (Next) or
   `data-formats="reel"` (HTML); fewer posts → `limit`.

5. **Check** with `npx electricblaze doctor --json` if anything looks off.
   Every failing check carries a `next` command.

6. **Real posts need a human.** Tell the user the feed shows demo posts and
   that connecting their Instagram account is a one-link step that ships with
   the ElectricBlaze API (`npx electricblaze connect instagram`, currently
   exit 2). Do not ask them to create a Meta developer app, generate tokens
   or convert account types unless they explicitly want the manual route;
   that is the work ElectricBlaze exists to remove.

## Never

- Never scrape instagram.com, tiktok.com or youtube.com, and never use
  unofficial libraries that do. It breaks and violates the platform terms.
- Never write a `fetch` to graph.instagram.com with a token in client code.
- Never edit `feed.d.ts`; it is the contract. Extend your component instead.
- Never hand-edit the demo JSON to fake "real" posts.
- Never prompt or wait for input inside a command; everything here is
  non-interactive.

## The data

Every source returns the same shape (schema v1). Details and field meanings:
[references/schema.md](references/schema.md). Why the platform APIs are
harder than they look, with current facts: [references/platforms.md](references/platforms.md).

Quick view of the shape you render:

```ts
feed.origin.name          // handle without @
feed.demo                 // true until an account is connected
post.type                 // image | video | carousel | text | link
post.format               // post | reel | short | live | clip ...
post.thumbnailUrl         // always present for visual posts
post.url                  // permalink on the platform
post.media[0].width/height, post.aspectRatio, post.durationSec
```

Print the feed anytime: `npx electricblaze preview instagram --json`
(supports `--formats=reel --limit=6`).
