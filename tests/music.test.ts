/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";

import { formatPlaybackTime } from "../src/features/music/utils/duration";

test("playback time formats track durations", () => {
  assert.equal(formatPlaybackTime(0), "0:00");
  assert.equal(formatPlaybackTime(9.9), "0:09");
  assert.equal(formatPlaybackTime(61), "1:01");
  assert.equal(formatPlaybackTime(3661), "1:01:01");
});

test("playback time safely handles invalid values", () => {
  assert.equal(formatPlaybackTime(Number.NaN), "0:00");
  assert.equal(formatPlaybackTime(Number.POSITIVE_INFINITY), "0:00");
  assert.equal(formatPlaybackTime(-12), "0:00");
});
