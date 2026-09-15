import { list } from "../args.js";
import { emit, loadDemo, HOME } from "../io.js";

export const SOURCES_0_1 = ["instagram"];

export function preview({ positional, flags }) {
  const source = positional[0] ?? "instagram";
  if (!SOURCES_0_1.includes(source)) {
    emit(flags, { ok: false, error: `source "${source}" is not available yet`, available: SOURCES_0_1, next: "Run: npx electricblaze preview instagram" },
      `✗ Source "${source}" is not available yet. Available: ${SOURCES_0_1.join(", ")}\n→ Run: npx electricblaze preview instagram`);
    return 2;
  }
  const formats = list(flags.formats);
  const limit = flags.limit ? Number(flags.limit) : 0;
  const feed = loadDemo(source);
  let posts = feed.posts;
  if (formats.length) posts = posts.filter((p) => formats.includes(p.format));
  if (limit > 0) posts = posts.slice(0, limit);
  // preview always prints JSON: it exists to be piped and read by agents.
  process.stdout.write(JSON.stringify({ ...feed, posts }, null, 2) + "\n");
  if (feed.demo && process.stderr.isTTY) process.stderr.write(`i demo feed (${posts.length} posts). Connect an account to see real posts: ${HOME}\n`);
  return 0;
}
