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

export function toLifecycle<T extends Token, D extends Token>(
  diffs: DiffTree<T, D>[]
): BoxLifecycle<T, D> | null {
  if (diffs.length === 0) {
    return null;
  }
  const self = new Map(diffs.map((diff, idx) => [idx, diff.root]));
  const [text, boxes] = toTokenLifecycles(diffs.map(({ content }) => content));
  const [decorations] = toTokenLifecycles(diffs.map(({ decorations }) => decorations));
  return {
    kind: "BOX",
    base: diffs[0].root.item,
    self,
    text,
    decorations,
    boxes,
  };
}

function toPosition({x, y, width, height}: Token): string {
  return `${x}/${y}/${width}/${height}`;
}

function toTokenLifecycles<T extends Token>(
  frames: DiffOp<T>[][]
): [Lifecycle<T>[], never];
function toTokenLifecycles<T extends Token, D extends Token>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][]
): [Lifecycle<T>[], BoxLifecycle<T, D>[]];
function toTokenLifecycles<T extends Token, D extends Token>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][]
): [Lifecycle<T>[], BoxLifecycle<T, D>[]] {
  // Last token position -> lifecycle
  const lifecycles = new Map<string, Lifecycle<T>>();
  const finished: Lifecycle<T>[] = [];

  const treesById = new Map<string, DiffTree<T, D>[]>();
  for (let i = 0; i < frames.length; i++) {
    // First pass: free positions and collect trees
    const remaining: [string, Lifecycle<T>][] = [];
    for (const operation of frames[i]) {
      if (operation.kind === "TREE") {
        //
        const trees = treesById.get(operation.root.item.id);
        if (!trees) {
          treesById.set(operation.root.item.id, [operation]);
        } else {
          trees.push(operation);
        }
      } else if (operation.kind === "DEL") {
        const oldPosition = toPosition(operation.item);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error();
        }
        currentLifecycle.set(i, operation);
        finished.push(currentLifecycle);
        lifecycles.delete(oldPosition);
      } else if (operation.kind === "MOV") {
        const oldPosition = toPosition(operation.from);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error();
        }
        currentLifecycle.set(i, operation);
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
        lifecycles.set(key, new Map([[ i, operation ]]));
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
  const treeLifecycles = Array.from(treesById.values()).flatMap((trees) => {
    const lifecycle = toLifecycle(trees);
    if (lifecycle) {
      return [lifecycle];
    }
    return [];
  });
  return [tokenLifecycles, treeLifecycles];
}
