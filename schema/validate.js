// Runtime check for the ElectricBlaze feed schema (schema/feed.d.ts).
// No dependencies. Returns an array of human-readable problems; empty means valid.

const POST_TYPES = new Set(["image", "video", "carousel", "text", "link"]);
const STATUSES = new Set(["published", "live", "upcoming"]);
const ORIGIN_KINDS = new Set(["profile", "hashtag", "playlist", "board", "channel"]);

const isStr = (v) => typeof v === "string" && v.length > 0;
const isUrl = (v) => isStr(v) && /^https?:\/\//.test(v);
const isIso = (v) => isStr(v) && !Number.isNaN(Date.parse(v));
const isPosNum = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

export function validateFeed(feed) {
  const errors = [];
  const err = (path, msg) => errors.push(`${path}: ${msg}`);

  if (!feed || typeof feed !== "object") return ["feed: not an object"];
  if (feed.schemaVersion !== 1) err("schemaVersion", "must be 1");
  if (!isStr(feed.source)) err("source", "required string");
  if (typeof feed.demo !== "boolean") err("demo", "required boolean");
  if (!isIso(feed.fetchedAt)) err("fetchedAt", "required ISO date");
  if (feed.nextCursor !== undefined && !isStr(feed.nextCursor)) err("nextCursor", "must be a string");

  const o = feed.origin;
  if (!o || typeof o !== "object") err("origin", "required object");
  else {
    if (!ORIGIN_KINDS.has(o.kind)) err("origin.kind", `one of ${[...ORIGIN_KINDS].join("|")}`);
    for (const k of ["id", "name", "displayName"]) if (!isStr(o[k])) err(`origin.${k}`, "required string");
    if (!isUrl(o.url)) err("origin.url", "required http(s) URL");
    if (o.avatarUrl !== undefined && !isUrl(o.avatarUrl)) err("origin.avatarUrl", "must be http(s) URL");
  }

  if (!Array.isArray(feed.posts)) err("posts", "required array");
  else feed.posts.forEach((p, i) => validatePost(p, `posts[${i}]`, feed.source, err));

  return errors;
}

function validatePost(p, at, feedSource, err) {
  if (!p || typeof p !== "object") return err(at, "not an object");
  if (!isStr(p.id)) err(`${at}.id`, "required string");
  if (!isStr(p.source)) err(`${at}.source`, "required string");
  else if (feedSource && p.source !== feedSource) err(`${at}.source`, `must match feed source "${feedSource}"`);
  if (!POST_TYPES.has(p.type)) err(`${at}.type`, `one of ${[...POST_TYPES].join("|")}`);
  if (!isStr(p.format)) err(`${at}.format`, "required string");
  if (!STATUSES.has(p.status)) err(`${at}.status`, `one of ${[...STATUSES].join("|")}`);
  if (!isUrl(p.url)) err(`${at}.url`, "required http(s) URL");
  if (typeof p.text !== "string") err(`${at}.text`, "required string (may be empty)");
  if (!isIso(p.publishedAt)) err(`${at}.publishedAt`, "required ISO date");

  if (!Array.isArray(p.media)) err(`${at}.media`, "required array");
  else p.media.forEach((m, j) => {
    const mt = `${at}.media[${j}]`;
    if (!m || typeof m !== "object") return err(mt, "not an object");
    if (!isUrl(m.url)) err(`${mt}.url`, "required http(s) URL");
    if (!isStr(m.mime) || !/^(image|video|audio)\//.test(m.mime)) err(`${mt}.mime`, "required media MIME type");
    for (const k of ["width", "height", "durationSec"]) if (m[k] !== undefined && !isPosNum(m[k])) err(`${mt}.${k}`, "must be a positive number");
  });

  const visual = p.type === "image" || p.type === "video" || p.type === "carousel";
  if (visual && !isUrl(p.thumbnailUrl)) err(`${at}.thumbnailUrl`, `required for type "${p.type}"`);
  if (p.type === "video") {
    const hasFile = Array.isArray(p.media) && p.media.some((m) => m && /^video\//.test(m.mime || ""));
    if (!hasFile && !isUrl(p.embedUrl)) err(`${at}`, "video needs a video/* media file or an embedUrl");
  }
  if (p.type === "link" && (!p.link || !isUrl(p.link.url))) err(`${at}.link.url`, `required for type "link"`);
  if (p.thumbnailUrl !== undefined && !isUrl(p.thumbnailUrl)) err(`${at}.thumbnailUrl`, "must be http(s) URL");
  if (p.embedUrl !== undefined && !isUrl(p.embedUrl)) err(`${at}.embedUrl`, "must be http(s) URL");
  if (p.aspectRatio !== undefined && !isPosNum(p.aspectRatio)) err(`${at}.aspectRatio`, "must be a positive number");
  if (p.durationSec !== undefined && !isPosNum(p.durationSec)) err(`${at}.durationSec`, "must be a positive number");
  if (p.stats !== undefined) {
    if (!p.stats || typeof p.stats !== "object") err(`${at}.stats`, "must be an object");
    else for (const k of Object.keys(p.stats)) {
      if (!["likes", "comments", "views", "shares"].includes(k)) err(`${at}.stats.${k}`, "unknown stat");
      else if (typeof p.stats[k] !== "number" || p.stats[k] < 0) err(`${at}.stats.${k}`, "must be a non-negative number");
    }
  }
}
