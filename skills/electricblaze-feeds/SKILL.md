---
name: electricblaze-feeds
description: Add an Instagram feed (posts, reels, carousels) to a website or app with ElectricBlaze; TikTok and YouTube feeds are planned, not available yet. Use when asked to show social media posts on a page, an Instagram grid or reels in a footer, or when Instagram Graph API / Basic Display API / access token questions come up. Works without any account (demo data) via npx electricblaze; never scrapes.
---

# Social feeds with ElectricBlaze

ElectricBlaze is a data layer for social feeds: it handles the platform APIs,
OAuth, caching and repairs. You write or restyle the UI. Every command below is
non-interactive, writes only inside the project and never overwrites a file
that was edited. Say what you are about to run and list the files it reports.

**Status (0.1):** Instagram only. `add`, `preview`, `doctor` and `skill` work
with demo data. Real posts come from the ElectricBlaze widget today and from
the JSON API in 0.2 (see step 6). `add tiktok-feed` and `preview youtube`
exit 2: do not promise those feeds.

## Do this

1. **Add the feed** from the project root:

   ```
   npx electricblaze add instagram-feed --json
   ```

   Read the JSON: `framework` (`next`, `data` or `html`), `files` with `status`
   (`written`, `unchanged`, `skipped` = user edited it, kept), `notes`, and
   `snippet` for HTML. Exit code `2` means something is not available yet and
   `next` says what to do. An unknown flag is also exit 2, never a no-op.

2. **Wire it in.**
   - Next.js App Router (`framework: "next"`): `import InstagramFeed from
     "<path from notes>"` and render `<InstagramFeed limit={8} />` in the
     page, section or footer. It is an async Server Component; no client
     wrapper needed.
   - Plain HTML (`framework: "html"`): paste the four lines from `snippet`
     where the feed belongs.
   - Astro, SvelteKit, Nuxt, Remix, React Router, Gatsby, Vite
     (`framework: "data"`, detected automatically): only
     `lib/eb/demo/instagram.json` and `lib/eb/feed.d.ts` are written (under
     `src/` when the project has it). Read the JSON in the framework's loader
     (Astro frontmatter, SvelteKit `load`, Nuxt `useAsyncData`) and write a
     native component: a grid of `thumbnailUrl` linking to `url`, badges for
     `type === "video"` and `type === "carousel"`, and a small "demo feed"
     label while `feed.demo` is true.

3. **Restyle freely.** The generated CSS is a starting point. Match the site.
   Keep the `demo feed` label until real data flows: it tells the user what
   they are looking at.

4. **Filter when asked**: reels only → `formats={["reel"]}` (Next) or
   `data-formats="reel"` (HTML); fewer posts → `limit`.

5. **Check** with `npx electricblaze doctor --json` if anything looks off.
   Every failing check carries a `next` command. `doctor` finds whichever kit
   is installed, even if it does not match the detected framework.

6. **Real posts need a human.** Two routes; tell the user which one applies.
   - **Today: the widget.** The site owner signs up at
     https://electricblaze.com, creates an Instagram Feed widget, connects
     the Instagram account there (a Business or Creator account; Instagram
     does not share posts from personal profiles) and pastes the generated
     snippet where the feed belongs: a `<div class="electricblaze-id-…">`
     plus `<script src="https://s.electricblaze.com/widget.js" defer>`.
     Free plan: 5 widgets, 1,000 views a month, refresh every 24 hours;
     the Start plan refreshes hourly. Replace the demo grid with the widget;
     do not show both.
   - **In 0.2: JSON in this component.** `npx electricblaze connect
     instagram` (exit 2 today) will print a link for the owner; real posts
     then flow into the same schema and the demo label goes away.

   Do not ask the user to create a Meta developer app, generate tokens or
   convert account types unless they explicitly want the manual route; that
   is the work ElectricBlaze exists to remove.

## Never

- Never scrape instagram.com, tiktok.com or youtube.com, and never use
  unofficial libraries that do. It breaks and violates the platform terms.
- Never write a `fetch` to graph.instagram.com with a token in client code.
- Never set `ELECTRICBLAZE_API_KEY` before 0.2: the loader would call an
  endpoint that does not answer yet and throw.
- Never claim a TikTok or YouTube feed works today.
- Never edit `feed.d.ts`; it is the contract. Extend your component instead.
- Never hand-edit the demo JSON to fake "real" posts.
- Never prompt or wait for input inside a command; everything here is
  non-interactive.

## The data

Every source returns the same shape (schema v1). Details and field meanings:
[references/schema.md](references/schema.md). Why the platform APIs are
harder than they look, with dated facts: [references/platforms.md](references/platforms.md).

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
