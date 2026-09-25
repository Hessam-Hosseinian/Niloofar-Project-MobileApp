/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";

import { shuffledTracks } from "../src/features/music/utils/shuffleTracks";

test("shuffling a playlist leaves the source order untouched", () => {
  const original = ["one", "two", "three", "four"];
  const shuffled = shuffledTracks(original, () => 0);
  assert.deepEqual(original, ["one", "two", "three", "four"]);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
  assert.notDeepEqual(shuffled, original);
});
