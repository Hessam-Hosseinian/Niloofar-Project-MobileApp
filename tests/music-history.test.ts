/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceListeningProgress,
  newListeningProgress,
} from "../src/features/music/utils/playHistory";

test("a play is recorded once after half a short track is actually heard", () => {
  let progress = newListeningProgress(4);
  for (let second = 0; second <= 6; second++) {
    const result = advanceListeningProgress(progress, {
      playing: true, currentTime: second, duration: 10, didJustFinish: false,
    });
    progress = result.progress;
    assert.equal(result.shouldRecord, second === 5);
  }
});

test("seeking forward and time spent paused do not count as listening", () => {
  let progress = newListeningProgress(5);
  progress = advanceListeningProgress(progress, {
    playing: true, currentTime: 0, duration: 100, didJustFinish: false,
  }).progress;
  progress = advanceListeningProgress(progress, {
    playing: true, currentTime: 50, duration: 100, didJustFinish: false,
  }).progress;
  progress = advanceListeningProgress(progress, {
    playing: false, currentTime: 50, duration: 100, didJustFinish: false,
  }).progress;
  const resumed = advanceListeningProgress(progress, {
    playing: true, currentTime: 51, duration: 100, didJustFinish: false,
  });
  assert.equal(resumed.progress.heardSeconds, 0);
  assert.equal(resumed.shouldRecord, false);
});
