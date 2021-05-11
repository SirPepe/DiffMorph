// This module's pickAlternative() picks a closest match for a given token from
// a list of other tokens based on positions and a few other factors.

import { Optimizable } from "./optimize";
import { findMaxValue, findMin } from "./util";

type Offset = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

function getOffset(
  item: Optimizable,
  referenceWidth: number,
  referenceHeight: number
): Offset {
  const { x: left, y: top, width, height } = item;
  const right = referenceWidth - left - width;
  const bottom = referenceHeight - top - height;
  const offset = { top, left, bottom, right };
  return offset;
}

type LinkedOptimizable = Optimizable & {
  prev?: Optimizable;
  next?: Optimizable;
};

function getNeighborHashes<T extends LinkedOptimizable>(
  item: T
): [string | undefined, string | undefined] {
  const left = item.prev && item.prev.y === item.y ? item.prev.hash : undefined;
  const right =
    item.next && item.next.y === item.y ? item.next.hash : undefined;
  return [left, right];
}

// This somewhat shoehorned-in function tries to find an alternative based on
// neighboring token's hashes (on the same line). It only really works for text
// tokens, but does not hurt when applied to other objects; it simply returns
// null when there's no neighbors.
function findAlternativeWithNeighbors<T extends LinkedOptimizable>(
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

export function pickAlternative<T extends Optimizable>(
  forItem: T,
  fromItems: T[] | Set<T>
): T | null {
  // Too easy
  if (Array.isArray(fromItems) && fromItems.length === 1) {
    return fromItems[0];
  }
  if (fromItems instanceof Set && fromItems.size === 1) {
    return Array.from(fromItems)[0];
  }
  // Setup and pre-calculate data for picking the best alternative. Compute all
  // offsets based on the largest possible parent box, otherwise right and
  // bottom offsets may not be comparable.
  const refWidth = findMaxValue(
    [forItem, ...fromItems],
    (item) => item.parent.width
  );
  const refHeight = findMaxValue(
    [forItem, ...fromItems],
    (item) => item.parent.height
  );
  const forItemOffset = getOffset(forItem, refWidth, refHeight);
  const sameLineCandidates = new Map<T, Offset>();
  const allCandidates = new Map<T, Offset>();
  for (const fromItem of fromItems) {
    const fromItemOffset = getOffset(fromItem, refWidth, refHeight);
    if (fromItemOffset.top === forItemOffset.top) {
      sameLineCandidates.set(fromItem, fromItemOffset);
    }
    allCandidates.set(fromItem, fromItemOffset);
  }
  // If there is exactly one alternative on the same line, just pick that
  if (sameLineCandidates.size === 1) {
    return Array.from(sameLineCandidates.keys())[0];
  }
  // Try to find an alternative with the same offset from right of the same line
  for (const [candidate, { right }] of sameLineCandidates) {
    if (forItemOffset.right === right) {
      return candidate;
    }
  }
  // Try to find something the the same offset from the bottom right somewhere.
  // This helps to keep commas, brackets and curly braces in line when something
  // gets inserted in the middle of a dictionary-like structure
  for (const [candidate, { bottom, right }] of allCandidates) {
    if (forItemOffset.right === right && forItemOffset.bottom === bottom) {
      return candidate;
    }
  }
  // Try to find an alternative that's the closest on the same line (if there is
  // anything left)
  if (sameLineCandidates.size > 0) {
    const [closest] = findMin(sameLineCandidates, ([, candidateOffset]) => {
      return Math.abs(candidateOffset.left - forItemOffset.left);
    });
    return closest;
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
      return match;
    }
  }
  // Last attempt: take whatever is closest (if there is anything left)
  if (allCandidates.size > 0) {
    return findMin(allCandidates, ([, candidateOffset]) => {
      const deltaX = Math.abs(candidateOffset.left - forItemOffset.left);
      const deltaY = Math.abs(candidateOffset.top - forItemOffset.top);
      return deltaX + deltaY;
    })[0];
  }
  return null;
}
