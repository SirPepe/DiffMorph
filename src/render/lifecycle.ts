// This module turns diff ops into lifecycle maps. These serve to connect diff
// ops across potentially many frames and also inserts pre-visibility and
// post-visibility ops (called "lifecycle extension"). The main render function
// can then trace every object through its entire lifecycle. This is by far the
// most convoluted module in the entire project, but provides a nice (nice from
// the outside) bridge between input and diffing on one hand and the rendering
// graph and actual rendering on the other hand.

import {
  DiffBox,
  DiffDecoration,
  DiffTokens,
  Token,
  NOP,
  DiffOp,
  ExtendedDiffOp,
  DiffRoot,
} from "../types";
import { minmax } from "../lib/util";

// A lifecycle root hosts other lifecycles. It represents a box's lifecycle
// (field "self") as well as it's content's lifecycles ("text", "decorations").
// Each lifecycle root is generated from an ADD operation on a box and continues
// until a DEL is encountered or until the last frame.
export type RootLifecycle = {
  base: DiffBox;
  self: BoxLifecycle;
  text: TokenLifecycle<DiffTokens>[];
  decorations: TokenLifecycle<DiffDecoration>[];
  roots: RootLifecycle[];
};

// frame index -> op for text tokens, boxes and decorations
export type TokenLifecycle<T> = Map<number, ExtendedDiffOp<T>>;
export type BoxLifecycle = Map<number, ExtendedDiffOp<DiffBox> | NOP<DiffBox>>;

// Serves as a basic hash function to make element's positions comparable
function toPosition({ x, y }: Token): string {
  return `${x}/${y}`;
}

// Lifecycles for text tokens and decorations
function toTokenLifecycles<T extends Token>(
  frames: DiffOp<T>[][],
  startIdx: number
): TokenLifecycle<T>[] {
  // Last token position -> lifecycle
  const lifecycles = new Map<string, TokenLifecycle<T>>();
  const finished: TokenLifecycle<T>[] = [];
  for (let i = 0; i < frames.length; i++) {
    const frameIdx = i + startIdx;
    // First pass: free positions
    const deferred: [string, TokenLifecycle<T>][] = [];
    for (const operation of frames[i]) {
      if (operation.kind === "DEL") {
        const oldPosition = toPosition(operation.item);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error(`DEL @ ${frameIdx}: no lifecycle at ${oldPosition}!`);
        }
        currentLifecycle.set(frameIdx, operation);
        finished.push(currentLifecycle);
        lifecycles.delete(oldPosition);
      } else if (operation.kind === "MOV") {
        const oldPosition = toPosition(operation.from);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error(`MOV @ ${frameIdx}: no lifecycle at ${oldPosition}!`);
        }
        currentLifecycle.set(frameIdx, operation);
        lifecycles.delete(oldPosition);
        const newPosition = toPosition(operation.item);
        if (lifecycles.has(newPosition)) {
          // position currently occupied, defer placing at the new position
          deferred.push([newPosition, currentLifecycle]);
        } else {
          lifecycles.set(newPosition, currentLifecycle);
        }
      }
    }
    // Second pass: place additions
    for (const operation of frames[i]) {
      if (operation.kind === "ADD") {
        const key = toPosition(operation.item);
        if (lifecycles.has(key)) {
          throw new Error(
            `ADD at ${frameIdx}: position ${key} already occupied`
          );
        }
        lifecycles.set(key, new Map([[i + startIdx, operation]]));
      }
    }
    // Third pass: place deferred items
    for (const [newPosition, lifecycle] of deferred) {
      if (lifecycles.has(newPosition)) {
        throw new Error(
          `Deferred at ${frameIdx}: position ${newPosition} already occupied`
        );
      } else {
        lifecycles.set(newPosition, lifecycle);
      }
    }
  }
  return [...finished, ...lifecycles.values()];
}

// Root lifecycles generated from diff roots. A worthwhile shortcut would be to
// skip the whole sorting and assignment process when every array in `frames`
// contains only one diff root (which should be the case for the VAST majority
// of cases), but that's not implemented right now.
function toRootLifecycles(
  frames: DiffRoot[][],
  startIdx: number
): RootLifecycle[] {
  // Organizes diff roots as follows: last position -> frame -> DiffRoot
  // From this, content, decoration and nested root lifecycles can be built.
  const lifecycles = new Map<string, Map<number, DiffRoot>>();
  const finished: Map<number, DiffRoot>[] = [];
  for (let i = 0; i < frames.length; i++) {
    const frameIdx = i + startIdx;
    // First pass: free positions
    const deferred: [string, Map<number, DiffRoot>][] = [];
    for (const diff of frames[i]) {
      if (diff.root.kind === "DEL") {
        const oldPosition = toPosition(diff.root.item);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error(`DEL @ ${frameIdx}: no lifecycle at ${oldPosition}!`);
        }
        currentLifecycle.set(frameIdx, diff);
        finished.push(currentLifecycle);
        lifecycles.delete(oldPosition);
      } else if (diff.root.kind === "MOV" || diff.root.kind === "NOP") {
        const oldItem =
          diff.root.kind === "MOV" ? diff.root.from : diff.root.item;
        const oldPosition = toPosition(oldItem);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error(`MOV @ ${frameIdx}: no lifecycle at ${oldPosition}!`);
        }
        currentLifecycle.set(frameIdx, diff);
        lifecycles.delete(oldPosition);
        const newPosition = toPosition(diff.root.item);
        if (lifecycles.has(newPosition)) {
          // position currently occupied, defer placing at the new position
          deferred.push([newPosition, currentLifecycle]);
        } else {
          lifecycles.set(newPosition, currentLifecycle);
        }
      }
    }
    // Second pass: place additions
    for (const diff of frames[i]) {
      if (diff.root.kind === "ADD") {
        const key = toPosition(diff.root.item);
        if (lifecycles.has(key)) {
          throw new Error(
            `ADD at ${frameIdx}: position ${key} already occupied`
          );
        }
        lifecycles.set(key, new Map([[i + startIdx, diff]]));
      }
    }
    // Third pass: place deferred items
    for (const [newPosition, lifecycle] of deferred) {
      if (lifecycles.has(newPosition)) {
        throw new Error(
          `Deferred at ${frameIdx}: position ${newPosition} already occupied`
        );
      } else {
        lifecycles.set(newPosition, lifecycle);
      }
    }
  }
  // Format the collected and organized DiffRoot objects into proper root
  // lifecycles
  const roots: RootLifecycle[] = [];
  const diffLifecycles = [...finished, ...lifecycles.values()];
  for (let i = 0; i < diffLifecycles.length; i++) {
    const self: BoxLifecycle = new Map();
    const textOps = [];
    const decoOps = [];
    const rootOps = [];
    for (const [frameIdx, diff] of diffLifecycles[i]) {
      self.set(frameIdx, diff.root);
      decoOps.push(diff.decorations);
      const texts = [];
      const roots = [];
      for (const item of diff.content) {
        if (item.kind === "ROOT") {
          roots.push(item);
        } else {
          texts.push(item);
        }
      }
      textOps.push(texts);
      rootOps.push(roots);
    }
    const startAt = Math.min(...self.keys());
    roots.push({
      self,
      base: diffLifecycles[i].values().next().value.root.item,
      text: toTokenLifecycles(textOps, startAt),
      decorations: toTokenLifecycles(decoOps, startAt),
      roots: toRootLifecycles(rootOps, startAt),
    });
  }
  return roots;
}

function isDel(op: ExtendedDiffOp<unknown> | NOP<unknown>): boolean {
  return op.kind === "DEL";
}

function getNextFrame<T>(
  source: Map<number, T>,
  from: number,
  parentMin: number,
  parentMax: number
): [number, T | undefined] {
  if (from + 1 > parentMax) {
    // wrap around
    return [parentMin, source.get(parentMin)];
  }
  return [from + 1, source.get(from + 1)];
}

function getPrevFrame<T>(
  source: Map<number, T>,
  from: number,
  parentMin: number,
  parentMax: number
): [number, T | undefined] {
  if (from - 1 < parentMin) {
    // wrap around
    return [parentMax, source.get(parentMax)];
  }
  return [from - 1, source.get(from - 1)];
}

// Rules for extending lifecycles are as follows:
// * do nothing for lifecycles with less than two frames
// * for each DEL
//   - if the frame after the DEL is free, shift DEL one frame forwards and
//     insert BDE in the previous position of DEL
//   - if the frame after the DEL is taken up by ADD, only replace the DEL with
//     BDE, where BDE's "item" position corresponds to ADD's item position.
// * for each ADD
//    - if the frame before the ADD is free and either
//      . the ADD is not in the first frame
//      . there is a DEL somewhere before or after the ADD in the lifecycle
//     insert a BAD in the previous frame. This step requires a DEL (or an
//     implicit DEL by having the token not be there in the first frame) to
//     ensure that we don't add a BAD (an invisible frame) for tokens that are
//     supposed to be visible for the parent's entire lifetime (eg. there's an
//     ADD in the first frame and then no other op)
//   - if the frame before the ADD is taken up by a BDE, update the BDE's "item"
//     position with the ADD's "item" position
//   - if the frame before the ADD is taken up by a DEL, replace the DEL with a
//     BDE with its "from" pointing to the DEL's "item" and it's "item" pointing
//     to the ADD's item. This essentially lets the BDE serve as both DEL and
//     BAD
function expandLifecycle(
  lifecycle: Map<number, ExtendedDiffOp<unknown> | NOP<unknown>>,
  parentMin: number,
  parentMax: number
): void {
  if (parentMax - parentMin < 1) {
    return; // No need to expand something that can only ever be one frame
  }
  // Handle DEL operations in general
  for (const [frame, op] of lifecycle) {
    if (op.kind === "DEL") {
      const [nextFrame, nextOp] = getNextFrame(
        lifecycle,
        frame,
        parentMin,
        parentMax
      );
      if (!nextOp) {
        lifecycle.set(frame, { kind: "BDE", from: op.item, item: op.item });
        lifecycle.set(nextFrame, op);
        break; // must not continue, else we visit "op" a second time
      } else if (nextOp.kind === "ADD") {
        lifecycle.set(frame, { kind: "BDE", from: op.item, item: nextOp.item });
      }
    }
  }
  // Handle ADD operations in general
  const ops = Array.from(lifecycle.values());
  for (const [frame, op] of lifecycle) {
    if (op.kind === "ADD") {
      const [prevFrame, prevOp] = getPrevFrame(
        lifecycle,
        frame,
        parentMin,
        parentMax
      );
      if (!prevOp) {
        const before = ops.slice(0, frame);
        const after = ops.slice(frame + 1).reverse();
        if (frame !== parentMin || before.find(isDel) || after.find(isDel)) {
          lifecycle.set(prevFrame, { kind: "BAD", item: op.item });
        }
      } else if (prevOp.kind === "BDE") {
        prevOp.item = op.item;
      } else if (prevOp.kind === "DEL") {
        lifecycle.set(prevFrame, { kind: "BAD", item: op.item });
      }
    }
  }
  // Handle wrap-around of tokens that are present in the last frame, but that
  // don't get properly deleted because the sequence is over. This makes for a
  // jarring visual effect in GIFs and such, so we have to augment these cases
  // with BDE and DEL where appropriate.
  const max = Math.max(...lifecycle.keys());
  const last = lifecycle.get(max) as ExtendedDiffOp<unknown> | NOP<unknown>;
  // No wrap-around for this token necessary, token not in last frame
  if (last.kind === "DEL") {
    return;
  }
  // No wrap-around for this token necessary, token present in first frame
  const first = lifecycle.get(parentMin);
  if (first) {
    return;
  }
  // Insert BDE to smooth out the wrap-around
  lifecycle.set(parentMin, { kind: "BDE", from: last.item, item: last.item });
  // If the second frame is also free, insert the proper DEL operation
  const second = lifecycle.get(parentMin + 1);
  if (!second) {
    lifecycle.set(parentMin + 1, { kind: "DEL", item: last.item });
  }
}

function expandLifecycleRoots(lifecycle: RootLifecycle): void {
  const [minFrame, maxFrame] = minmax(lifecycle.self.keys());
  for (const root of lifecycle.roots) {
    expandLifecycle(root.self, minFrame, maxFrame);
    expandLifecycleRoots(root);
  }
  for (const text of lifecycle.text) {
    expandLifecycle(text, minFrame, maxFrame);
  }
  for (const decoration of lifecycle.decorations) {
    expandLifecycle(decoration, minFrame, maxFrame);
  }
}

export function toLifecycle(
  frames: DiffRoot[],
  expand: boolean // only used in unit tests to simplify some assertions
): RootLifecycle | null {
  if (frames.length === 0) {
    return null;
  }
  const [root] = toRootLifecycles(
    frames.map((frame) => [frame]),
    0
  );
  if (expand) {
    expandLifecycleRoots(root);
  }
  return root;
}
