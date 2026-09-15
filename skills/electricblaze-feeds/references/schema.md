# Feed schema v1

One shape for every source. Types live in `feed.d.ts` (copied into the
project by `npx electricblaze add`). A runtime validator is exported as
`import { validateFeed } from "electricblaze/schema"`.

## Feed

| Field           | Type                          | Notes                                                   |
|-----------------|-------------------------------|---------------------------------------------------------|
| `schemaVersion` | `1`                           | Bump = breaking change; components check it             |
| `source`        | `"instagram" \| "tiktok" \| "youtube" \| ...` | Open string; new networks never break consumers |
| `origin`        | `Origin`                      | What the feed is built from                             |
| `posts`         | `Post[]`                      | Newest first                                            |
| `fetchedAt`     | ISO 8601                      | When ElectricBlaze fetched it from the platform         |
| `demo`          | `boolean`                     | `true` until an account is connected; show a label      |
| `nextCursor`    | `string?`                     | Present when more posts can be requested                |

`Origin`: `kind` (`profile`, `hashtag`, `playlist`, `board`, `channel`),
`id`, `name` (handle without `@`, playlist id, board slug), `displayName`,
`url`, `avatarUrl?`.

## Post

| Field          | Type                                        | Notes                                                        |
|----------------|---------------------------------------------|--------------------------------------------------------------|
| `id`           | string                                      | Stable per platform                                          |
| `source`       | same as feed                                |                                                              |
| `type`         | `image` `video` `carousel` `text` `link`    | **What to render.** Layout decisions come from this          |
| `format`       | string                                      | **What the platform calls it.** Filters and badges only      |
| `status`       | `published` `live` `upcoming`               | Streams and premieres                                        |
| `url`          | https URL                                   | Permalink                                                    |
| `text`         | string, may be empty                        | Caption, description or title                                |
| `media`        | `Media[]`                                   | Direct files when the platform exposes them; can be empty    |
| `thumbnailUrl` | https URL?                                  | Always present for `image`, `video`, `carousel`              |
| `embedUrl`     | https URL?                                  | Player URL when there is no file (YouTube, TikTok, Vimeo)    |
| `aspectRatio`  | number?                                     | width / height of the primary media: 1, 0.8, 0.5625, 1.7778  |
| `durationSec`  | number?                                     | Videos                                                       |
| `link`         | `{ url, title?, description?, imageUrl?, domain? }?` | Shared links (Facebook, X)                          |
| `stats`        | `{ likes?, comments?, views?, shares? }?`   | Optional; never depend on them                               |
| `raw`          | unknown?                                    | Untouched platform payload                                   |

`Media`: `url`, `mime` (`image/jpeg`, `video/mp4`), `width?`, `height?`,
`alt?`, `durationSec?`.

## Formats per source

| Source    | type                          | format                              |
|-----------|-------------------------------|-------------------------------------|
| instagram | image, video, carousel        | post, reel                          |
| youtube   | video                         | video, short, live, upcoming        |
| tiktok    | video, carousel               | video, photo                        |
| twitch    | video                         | stream, vod, clip                   |
| vimeo     | video                         | video, live                         |
| pinterest | image, video                  | pin, idea                           |
| facebook  | text, link, image, video      | post, reel                          |

## Rendering rules that hold across sources

- A grid cell is a square with `object-fit: cover` on `thumbnailUrl`. Use
  `aspectRatio` only when you deliberately build a masonry or a reel strip.
- `type === "video"`: if `media` has a `video/*` file you can play it inline;
  otherwise use `embedUrl` in an iframe, or just link to `url`.
- `type === "text"` and `type === "link"` (Facebook, X) have no thumbnail:
  render a text card, and for links show `link.title` and `link.imageUrl`.
- `feed.demo === true`: show a small "demo feed" label. Remove it only when
  real data arrives.
