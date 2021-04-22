import { Box, Token } from "../types";
import { BOX, DiffOp, ExtendedDiffOp, DiffTree } from "./diff";

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
    //
    const frameIdx = i + startIdx;
    // First pass: free positions and collect trees
    const remaining: [string, Lifecycle<T>][] = [];
    for (const operation of frames[i]) {
      if (operation.kind === "TREE") {
        //
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
      const frameIdx = i + startIdx;
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
  startIdx: number,
): BoxLifecycle<T, D> {
  const self = new Map(diffs.map((diff, idx) => [idx + startIdx, diff.root]));
  const [text, boxes] = toTokenLifecycles(
    diffs.map(({ content }) => content),
    startIdx
  );
  const [decorations] = toTokenLifecycles(
    diffs.map(({ decorations }) => decorations),
    startIdx
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

export function toLifecycle<T extends Token, D extends Token>(
  diffs: DiffTree<T, D>[],
): BoxLifecycle<T, D> | null {
  if (diffs.length === 0) {
    return null;
  }
  return toBoxLifecycle(diffs, 0);
}
