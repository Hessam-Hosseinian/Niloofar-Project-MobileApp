/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";

import type { MusicTrack } from "../src/features/music/types";
import {
  appendToQueue,
  clearUpcoming,
  currentQueueEntry,
  insertNext,
  moveUpcoming,
  queueWithSelection,
  removeQueueEntry,
  removeTrackFromQueue,
  selectQueueEntry,
  stepQueue,
  type QueueEntry,
} from "../src/features/music/utils/playbackQueue";

function entry(id: number, title = String(id)): QueueEntry {
  return {
    id,
    track: { id: title, title, artist: "Artist", source: `file://${title}.mp3`, sourceType: "imported" } satisfies MusicTrack,
  };
}

test("queue keeps selection and advances only within its bounds", () => {
  const queue = queueWithSelection([entry(1), entry(2), entry(3)], 2);
  assert.equal(currentQueueEntry(queue)?.id, 2);
  assert.equal(currentQueueEntry(stepQueue(queue, 1))?.id, 3);
  assert.equal(stepQueue(stepQueue(queue, 1), 1).currentIndex, 2);
  assert.equal(currentQueueEntry(stepQueue(queue, -1))?.id, 1);
});

test("play next inserts ahead of later songs; add to queue appends", () => {
  const queue = queueWithSelection([entry(1), entry(2)], 1);
  const next = appendToQueue(insertNext(queue, entry(3)), entry(4));
  assert.deepEqual(next.entries.map((item) => item.id), [1, 3, 2, 4]);
  assert.equal(next.currentIndex, 0);
});

test("removing and moving upcoming songs preserves the active song", () => {
  const queue = queueWithSelection([entry(1), entry(2), entry(3), entry(4)], 2);
  const moved = moveUpcoming(queue, 4, -1);
  assert.deepEqual(moved.entries.map((item) => item.id), [1, 2, 4, 3]);
  assert.equal(currentQueueEntry(moved)?.id, 2);
  assert.equal(moveUpcoming(moved, 4, -1), moved);
  assert.equal(currentQueueEntry(removeQueueEntry(moved, 1))?.id, 2);
  assert.deepEqual(clearUpcoming(moved).entries.map((item) => item.id), [1, 2]);
});

test("removing current or all copies selects the next available entry", () => {
  const queue = queueWithSelection([entry(1, "a"), entry(2, "b"), entry(3, "a")], 1);
  assert.equal(currentQueueEntry(removeQueueEntry(queue, 1))?.id, 2);
  assert.deepEqual(removeTrackFromQueue(queue, "a").entries.map((item) => item.id), [2]);
  assert.equal(currentQueueEntry(removeTrackFromQueue(queue, "a"))?.id, 2);
  assert.equal(currentQueueEntry(selectQueueEntry(queue, 3))?.id, 3);
});
