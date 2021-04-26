import { Box, Token } from "../types";
import { BOX, DiffOp, ExtendedDiffOp, DiffTree } from "./diff";
import { minmax } from "./util";

export type Lifecycle<T> = Map<number, ExtendedDiffOp<T>>;

export type BoxLifecycle<T, D> = {
  readonly kind: "BOX";
  base: Box<T, D>;
  self: Map<number, ExtendedDiffOp<Box<T, D>> | BOX<Box<T, D>>>;
  text: Lifecycle<T>[];
  decorations: Lifecycle<D>[];
  boxes: BoxLifecycle<T, D>[];
}

function toPosition({x, y, width, height}: Token): string {
  return `${x}/${y}/${width}/${height}`;
}

function toTokenLifecycles<T extends Token>(
  frames: DiffOp<T>[][],
  startIdx: number,
): [Lifecycle<T>[], never];
function toTokenLifecycles<T extends Token, D extends Token>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][],
  startIdx: number,
): [Lifecycle<T>[], BoxLifecycle<T, D>[]];
function toTokenLifecycles<T extends Token, D extends Token>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][],
  startIdx: number,
): [Lifecycle<T>[], BoxLifecycle<T, D>[]] {
  // Last token position -> lifecycle
  const lifecycles = new Map<string, Lifecycle<T>>();
  const finished: Lifecycle<T>[] = [];
  // id -> [first index, trees[]]
  const trees = new Map<string, [number, DiffTree<T, D>[]]>();
  for (let i = 0; i < frames.length; i++) {
    const frameIdx = i + startIdx;
    // First pass: free positions and collect trees
    const remaining: [string, Lifecycle<T>][] = [];
    for (const operation of frames[i]) {
      if (operation.kind === "TREE") {
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
          throw new Error();
        }
        currentLifecycle.set(frameIdx, operation);
        finished.push(currentLifecycle);
        lifecycles.delete(oldPosition);
      } else if (operation.kind === "MOV") {
        const oldPosition = toPosition(operation.from);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error();
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
        lifecycles.set(key, new Map([[ i + startIdx, operation ]]));
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
  const treeLifecycles = Array.from(trees.values()).flatMap(([index, list]) => {
    const lifecycle = toBoxLifecycle(list, index);
    if (lifecycle) {
      return [lifecycle];
    }
    return [];
  });
  return [tokenLifecycles, treeLifecycles];
}

function toBoxLifecycle<T extends Token, D extends Token>(
  diffs: DiffTree<T, D>[],
  frameOffset: number,
): BoxLifecycle<T, D> {
  const self = new Map(diffs.map((diff, i) => [i + frameOffset, diff.root]));
  const [text, boxes] = toTokenLifecycles(
    diffs.map(({ content }) => content),
    frameOffset
  );
  const [decorations] = toTokenLifecycles(
    diffs.map(({ decorations }) => decorations),
    frameOffset
  );
  return {
    kind: "BOX",
    base: diffs[0].root.item,
    self,
    text,
    decorations,
    boxes,
  };
}

function getNextFrame<T>(
  source: Map<number, T>,
  from: number,
  parentMin: number,
  parentMax: number
): [number, T | undefined] {
  if (from + 1 > parentMax) { // wrap around
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
  if (from - 1 < parentMin) { // wrap around
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
//   - if the frame before the ADD is free and the current frame is not the
//     first frame in the lifecycle, insert a BAD in the previous frame. Skip
//     this for the first frame to ensure that we don't add a BAD (an invisible
//     frame) for tokens that are supposed to be visible for the parent's entire
//     lifetime (eg. there's an ADD in the first frame and then no other op)
//   - if the frame before the ADD is taken up by a BDE, update the BDE's "item"
//     position with the ADD's "item" position
//   - if the frame before the ADD is taken up by a DEL, replace the DEL with a
//     BDE with its "from" pointing to the DEL's "item" and it's "item" pointing
//     to the ADD's item. This essentially lets the BDE serve as both DEL and
//     BAD
function expandLifecycle(
  lifecycle: Map<number, ExtendedDiffOp<unknown> | BOX<unknown>>,
  parentMin: number,
  parentMax: number
): void {
  if (parentMax - parentMin < 1) {
    return; // No need to expand something that can only ever be one frame
  }
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
  for (const [frame, op] of lifecycle) {
    if (op.kind === "ADD") {
      const [prevFrame, prevOp] = getPrevFrame(
        lifecycle,
        frame,
        parentMin,
        parentMax
      );
      if (!prevOp) {
        if (frame !== parentMin) {
          lifecycle.set(prevFrame, { kind: "BAD", item: op.item });
        }
      } else if (prevOp.kind === "BDE") {
        prevOp.item = op.item;
      } else if (prevOp.kind === "DEL") {
        lifecycle.set(prevFrame, { kind: "BAD", item: op.item });
      }
    }
  }
}

function expandBoxLifecycles<T extends Token, D extends Token>(
  lifecycle: BoxLifecycle<T, D>,
): void {
  const [minFrame, maxFrame] = minmax(lifecycle.self.keys());
  for (const box of lifecycle.boxes) {
    expandLifecycle(box.self, minFrame, maxFrame);
    expandBoxLifecycles(box);
  }
  for (const text of lifecycle.text) {
    expandLifecycle(text, minFrame, maxFrame);
  }
  for (const decoration of lifecycle.decorations) {
    expandLifecycle(decoration, minFrame, maxFrame);
  }
}

export function toLifecycle<T extends Token, D extends Token>(
  diffs: DiffTree<T, D>[],
  expand: boolean
): BoxLifecycle<T, D> | null {
  if (diffs.length === 0) {
    return null;
  }
  const root = toBoxLifecycle(diffs, 0);
  if (expand) {
    expandBoxLifecycles(root);
  }
  return root;
}
