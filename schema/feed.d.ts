/**
 * ElectricBlaze feed schema, version 1.
 *
 * One shape for every source. Fields a renderer needs are required;
 * anything platform-specific lives in `raw`. Dates are ISO 8601 strings.
 */

/** Known sources. The type is open so a new network never breaks consumers. */
export type Source =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "facebook"
  | "pinterest"
  | "vimeo"
  | "twitch"
  | "x"
  | (string & {});

/** What a feed is built from: an account, a hashtag, a playlist, a board, a channel. */
export type OriginKind = "profile" | "hashtag" | "playlist" | "board" | "channel";

export interface Origin {
  kind: OriginKind;
  id: string;
  /** Handle without "@", playlist id, board slug, hashtag without "#". */
  name: string;
  displayName: string;
  url: string;
  avatarUrl?: string;
}

/** What to render. */
export type PostType = "image" | "video" | "carousel" | "text" | "link";

/**
 * What the platform calls it. Used for filters and badges, never for layout.
 *   instagram: post | reel          youtube:  video | short | live | upcoming
 *   tiktok:    video | photo        twitch:   stream | vod | clip
 *   vimeo:     video | live         pinterest: pin | idea
 *   facebook:  post | reel          x:        post
 */
export type PostFormat = string;

export type PostStatus = "published" | "live" | "upcoming";

export interface Media {
  url: string;
  /** "image/jpeg", "video/mp4", ... */
  mime: string;
  width?: number;
  height?: number;
  alt?: string;
  durationSec?: number;
}

/** A shared external link (Facebook, X). */
export interface Link {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  domain?: string;
}

export interface Stats {
  likes?: number;
  comments?: number;
  views?: number;
  shares?: number;
}

export interface Post {
  id: string;
  source: Source;
  type: PostType;
  format: PostFormat;
  status: PostStatus;
  /** Permalink on the platform. */
  url: string;
  /** Caption, description or title. May be empty. */
  text: string;
  /** Direct files when the platform provides them. Empty for text posts and embed-only video. */
  media: Media[];
  /** Always present for image, video and carousel posts. */
  thumbnailUrl?: string;
  /** Player URL for platforms that do not expose files (YouTube, TikTok, Vimeo, Twitch). */
  embedUrl?: string;
  /** width / height of the primary media, e.g. 1 (square), 0.8 (4:5), 0.5625 (9:16), 1.7778 (16:9). */
  aspectRatio?: number;
  durationSec?: number;
  link?: Link;
  publishedAt: string;
  stats?: Stats;
  /** Original platform payload, untouched. */
  raw?: unknown;
}

export interface Feed {
  schemaVersion: 1;
  source: Source;
  origin: Origin;
  posts: Post[];
  /** When ElectricBlaze fetched this from the platform. */
  fetchedAt: string;
  /** True until an account is connected. Renderers show a small "demo feed" badge. */
  demo: boolean;
  /** Present when more posts can be requested. */
  nextCursor?: string;
}
