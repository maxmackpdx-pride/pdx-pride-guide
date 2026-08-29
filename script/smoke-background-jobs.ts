import assert from "node:assert/strict";
import { shouldMirrorPostersOnStart, shouldRunBackgroundJobs } from "../server/backgroundJobs";

assert.equal(shouldRunBackgroundJobs({ NODE_ENV: "development" }), false);
assert.equal(shouldRunBackgroundJobs({ NODE_ENV: "production", LOCAL_PREVIEW: "1" }), false);
assert.equal(
  shouldRunBackgroundJobs({ NODE_ENV: "production", RAILWAY_ENVIRONMENT_NAME: "staging" }),
  false,
);
assert.equal(
  shouldRunBackgroundJobs({ NODE_ENV: "production", RAILWAY_ENVIRONMENT_NAME: "production" }),
  true,
);
assert.equal(shouldRunBackgroundJobs({ NODE_ENV: "production" }), true);
assert.equal(
  shouldRunBackgroundJobs({
    NODE_ENV: "production",
    RAILWAY_ENVIRONMENT_NAME: "staging",
    BACKGROUND_JOBS: "1",
  }),
  true,
);
assert.equal(
  shouldRunBackgroundJobs({
    NODE_ENV: "production",
    RAILWAY_ENVIRONMENT_NAME: "production",
    BACKGROUND_JOBS: "0",
  }),
  false,
);
assert.equal(
  shouldMirrorPostersOnStart({
    NODE_ENV: "production",
    RAILWAY_ENVIRONMENT_NAME: "production",
  }),
  false,
);
assert.equal(
  shouldMirrorPostersOnStart({
    NODE_ENV: "production",
    RAILWAY_ENVIRONMENT_NAME: "production",
    POSTER_MIRROR_ON_START: "1",
  }),
  true,
);

console.log("background job ownership guards OK");

