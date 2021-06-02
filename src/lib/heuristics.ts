// This module's pickAlternative() picks a closest match for a given token from
// a list of other tokens based on positions and a few other factors. Note that
// this module assumes that every input lives in the same box.

import { Optimizable } from "./optimize";
import { findMin } from "./util";

type HeuristicsTarget = Omit<Optimizable, "hash"> & { hash?: number };

type Offset = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

function getOffset(item: HeuristicsTarget): Offset {
  const { x: left, y: top, width, height } = item;
  const right = left - width;
  const bottom = top - height;
  return { top, left, bottom, right };
}

function getNeighborHashes<T extends HeuristicsTarget>(
  item: T
): [string | undefined, string | undefined] {
  const left = item.prev && item.prev.y === item.y ? item.prev.hash : undefined;
  const right =
    item.next && item.next.y === item.y ? item.next.hash : undefined;
  return [left, right];
}

// This function tries to find an alternative based on neighboring token's
// hashes (on the same line). It only really works for text tokens, but does not
// hurt when applied to other objects; it simply returns null when there's no
// neighbors.
function findAlternativeWithNeighbors<T extends HeuristicsTarget>(
  forItem: T,
  forItemOffset: Offset,
  fromItems: Map<T, Offset>
): T | null {
  const [left, right] = getNeighborHashes(forItem);
  if (!left && !right) {
    return null;
  }
  let delta = Infinity;
  let match = null;
  for (const [candidate, candidateOffset] of fromItems) {
    const [candidateLeft, candidateRight] = getNeighborHashes(candidate);
    if (candidateLeft === left && candidateRight === right) {
      const deltaX = Math.abs(candidateOffset.left - forItemOffset.left);
      const deltaY = Math.abs(candidateOffset.top - forItemOffset.top);
      const candidateDelta = deltaX + deltaY;
      if (candidateDelta < delta) {
        delta = candidateDelta;
        match = candidate;
      }
    }
  }
  return match;
}

export function pickAlternative<T extends HeuristicsTarget>(
  forItem: T,
  fromItems: T[]
): [Item: T, Index: number] | [Item: null, Index: -1] {
  if (fromItems.length === 0) {
    return [null, -1];
  }
  if (fromItems.length === 1) {
    return [fromItems[0], 0];
  }
  const sameLineCandidates = new Map<T, Offset>();
  const allCandidates = new Map<T, Offset>();
  const forItemOffset = getOffset(forItem);
  for (const fromItem of fromItems) {
    const fromItemOffset = getOffset(fromItem);
    if (fromItemOffset.top === forItemOffset.top) {
      sameLineCandidates.set(fromItem, fromItemOffset);
    }
    allCandidates.set(fromItem, fromItemOffset);
  }
  // If there is exactly one alternative on the same line, just pick that
  if (sameLineCandidates.size === 1) {
    const match = Array.from(sameLineCandidates.keys())[0];
    return [match, fromItems.indexOf(match)];
  }
  // Try to find an alternative with the same offset from right of the same line
  for (const [candidate, { right }] of sameLineCandidates) {
    if (forItemOffset.right === right) {
      return [candidate, fromItems.indexOf(candidate)];
    }
  }
  // Try to find something the the same offset from the bottom right somewhere.
  // This helps to keep commas, brackets and curly braces in line when something
  // gets inserted in the middle of a dictionary-like structure
  for (const [candidate, { bottom, right }] of allCandidates) {
    if (forItemOffset.right === right && forItemOffset.bottom === bottom) {
      return [candidate, fromItems.indexOf(candidate)];
    }
  }
  // Try to find an alternative that's the closest on the same line (if there is
  // anything left)
  if (sameLineCandidates.size > 0) {
    const [closest] = findMin(sameLineCandidates, ([, candidateOffset]) => {
      return Math.abs(candidateOffset.left - forItemOffset.left);
    });
    return [closest, fromItems.indexOf(closest)];
  }
  // Try to find something that's close and has equivalent right and left
  // neighbors
  if (allCandidates.size > 0) {
    const match = findAlternativeWithNeighbors(
      forItem,
      forItemOffset,
      allCandidates
    );
    if (match) {
      return [match, fromItems.indexOf(match)];
    }
  }
  // Last attempt: take whatever is closest (if there is anything left)
  if (allCandidates.size > 0) {
    const [match] = findMin(allCandidates, ([, candidateOffset]) => {
      const deltaX = Math.abs(candidateOffset.left - forItemOffset.left);
      const deltaY = Math.abs(candidateOffset.top - forItemOffset.top);
      return deltaX + deltaY;
    });
    return [match, fromItems.indexOf(match)];
  }
  return [null, -1];
}
