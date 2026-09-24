import assert from "node:assert/strict";
import { test } from "node:test";
import { redgifsMedia } from "./communityMedia";

test("RedGIFs links normalize to safe watch and embed URLs", () => {
  assert.deepEqual(redgifsMedia("https://redgifs.com/watch/SampleClip?ref=feed"), {
    watchUrl: "https://www.redgifs.com/watch/SampleClip",
    embedUrl: "https://www.redgifs.com/ifr/SampleClip",
  });
  assert.deepEqual(redgifsMedia("https://www.redgifs.com/ifr/SampleClip"), redgifsMedia("https://redgifs.com/watch/SampleClip"));
  for (const url of ["https://redgifs.com.evil.test/watch/SampleClip", "http://redgifs.com/watch/SampleClip", "javascript:alert(1)", "https://redgifs.com/profile/example"]) {
    assert.equal(redgifsMedia(url), null);
  }
});
