// This module turns diff ops into lifecycle maps. These serve to connect diff
// ops across potentially many frames and also inserts pre-visibility and
// post-visibility ops (called "lifecycle extension"). The main render function
// can then trace every object through its entire lifecycle.

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
import { minmax } from "../util";

// A lifecycle root hosts other lifecycles. It represents a box's lifecycle
// (field "self") as well as it's content's lifecycles ("text", "decorations").
// Each lifecycle root is generated from an ADD operation on a box and continues
// until a DEL is encountered or until the last frame.
export type RootLifecycle = {
  base: DiffBox;
  self: Map<number, ExtendedDiffOp<DiffBox> | NOP<DiffBox>>;
  text: TokenLifecycle<DiffTokens>[];
  decorations: TokenLifecycle<DiffDecoration>[];
  roots: RootLifecycle[];
};

// frame index -> op for text tokens and decorations
export type TokenLifecycle<T> = Map<number, ExtendedDiffOp<T>>;

// Serves as a basic hash function to make element's positions comparable
function toPosition({ x, y }: Token): string {
  return `${x}/${y}`;
}

function toTokenLifecycles<T extends Token>(
  frames: DiffOp<T>[][],
  startIdx: number
): [TokenLifecycle<T>[], never];
function toTokenLifecycles<T extends Token>(
  frames: (DiffRoot | DiffOp<T>)[][],
  startIdx: number
): [TokenLifecycle<T>[], RootLifecycle[]];
function toTokenLifecycles<T extends Token>(
  frames: (DiffRoot | DiffOp<T>)[][],
  startIdx: number
): [TokenLifecycle<T>[], RootLifecycle[]] {
  // Last token position -> lifecycle
  const lifecycles = new Map<string, TokenLifecycle<T>>();
  const finished: TokenLifecycle<T>[] = [];
  // id -> [first index, trees[]]
  const trees = new Map<string, [number, DiffRoot[]]>();
  for (let i = 0; i < frames.length; i++) {
    const frameIdx = i + startIdx;
    // First pass: free positions and collect trees
    const remaining: [string, TokenLifecycle<T>][] = [];
    for (const operation of frames[i]) {
      if (operation.kind === "ROOT") {
        const treeData = trees.get(operation.root.item.id);
        if (!treeData) {
          trees.set(operation.root.item.id, [frameIdx, [operation]]);
        } else {
          treeData[1].push(operation);
        }
      } else if (operation.kind === "DEL") {
        const oldPosition = toPosition(operation.item);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error(`DEL @ ${i}: no lifecycle at ${oldPosition}!`);
        }
        currentLifecycle.set(frameIdx, operation);
        finished.push(currentLifecycle);
        lifecycles.delete(oldPosition);
      } else if (operation.kind === "MOV") {
        const oldPosition = toPosition(operation.from);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error(`MOV @ ${i}: no lifecycle at ${oldPosition}!`);
        }
        currentLifecycle.set(frameIdx, operation);
        lifecycles.delete(oldPosition);
        const newPosition = toPosition(operation.item);
        if (lifecycles.has(newPosition)) {
          // position currently occupied, defer placing at the new position
          remaining.push([newPosition, currentLifecycle]);
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
          throw new Error();
        }
        lifecycles.set(key, new Map([[i + startIdx, operation]]));
      }
    }
    // Third pass: place remaining items
    for (const [newPosition, lifecycle] of remaining) {
      if (lifecycles.has(newPosition)) {
        throw new Error();
      } else {
        lifecycles.set(newPosition, lifecycle);
      }
    }
  }
  const tokenLifecycles = [...finished, ...lifecycles.values()];
  const boxLifecycles = Array.from(trees.values()).flatMap(([index, list]) => {
    const lifecycle = toLifecycleRoot(list, index);
    if (lifecycle) {
      return [lifecycle];
    }
    return [];
  });
  return [tokenLifecycles, boxLifecycles];
}

function toLifecycleRoot(diffs: DiffRoot[], frame: number): RootLifecycle {
  const self = new Map(diffs.map((diff, i) => [i + frame, diff.root]));
  const [text, roots] = toTokenLifecycles(
    diffs.map(({ content }) => content),
    frame
  );
  const [decorations] = toTokenLifecycles(
    diffs.map(({ decorations }) => decorations),
    frame
  );
  return {
    base: diffs[0].root.item,
    self,
    text,
    decorations,
    roots,
  };
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
  diffs: DiffRoot[],
  expand: boolean // only used in unit tests to simplify some assertions
): RootLifecycle | null {
  if (diffs.length === 0) {
    return null;
  }
  const root = toLifecycleRoot(diffs, 0);
  if (expand) {
    expandLifecycleRoots(root);
  }
  return root;
}
