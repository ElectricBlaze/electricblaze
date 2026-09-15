import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateFeed } from "../schema/validate.js";

const demo = JSON.parse(readFileSync(new URL("../demo/instagram.json", import.meta.url), "utf8"));

test("demo/instagram.json is a valid schema v1 feed", () => {
  assert.deepEqual(validateFeed(demo), []);
  assert.equal(demo.demo, true);
  assert.equal(demo.source, "instagram");
  assert.ok(demo.posts.length >= 8, "a demo grid needs at least 8 posts");
});

test("demo covers the Instagram shapes a renderer must handle", () => {
  const shapes = new Set(demo.posts.map((p) => `${p.type}/${p.format}`));
  for (const s of ["image/post", "carousel/post", "video/post", "video/reel"]) assert.ok(shapes.has(s), `missing ${s}`);
  for (const p of demo.posts) {
    assert.ok(p.thumbnailUrl, `${p.id} has no thumbnail`);
    assert.ok(p.media.length > 0, `${p.id} has no media`);
    assert.ok(p.aspectRatio > 0, `${p.id} has no aspect ratio`);
  }
});

test("demo never points at a real Instagram URL", () => {
  for (const p of demo.posts) assert.doesNotMatch(p.url, /instagram\.com/);
  assert.doesNotMatch(demo.origin.url, /instagram\.com/);
});

test("validator rejects the mistakes that break renderers", () => {
  const bad = structuredClone(demo);
  delete bad.posts[0].thumbnailUrl;              // image without thumbnail
  bad.posts[1].media = [];                       // video with neither file nor embed
  delete bad.posts[1].embedUrl;
  bad.posts[2].status = "draft";                 // unknown status
  bad.posts[3].publishedAt = "yesterday";        // not ISO
  bad.schemaVersion = 2;
  const errors = validateFeed(bad);
  assert.ok(errors.some((e) => e.startsWith("posts[0].thumbnailUrl")), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("posts[1]:") && /embedUrl/.test(e)), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("posts[2].status")), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("posts[3].publishedAt")), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("schemaVersion")), errors.join("\n"));
});
