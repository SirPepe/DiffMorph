import { Box, Token } from "../types";
import { BOX, DiffOp, DiffTree } from "./diff";

type Lifecycle<T> = Map<number, DiffOp<T>>;

type BoxLifecycle<T, D> = {
  readonly kind: "BOX";
  self: Map<number, DiffOp<Box<T, D>> | BOX<Box<T, D>>>;
  content: (Lifecycle<T> | BoxLifecycle<T, D>)[];
  decorations: Lifecycle<D>[];
}

export function toLifecycle<T extends Token, D extends Token>(
  diffs: DiffTree<T, D>[]
): BoxLifecycle<T, D> {
  const self = new Map(diffs.map((diff, idx) => [idx, diff.root]));
  const content = toTokenLifecycles(diffs.map(({ content }) => content));
  const decorations = toTokenLifecycles(diffs.map(({ decorations }) => decorations));
  return {
    kind: "BOX",
    self,
    content,
    decorations,
  };
}

function toPosition({x, y, width, height}: Token): string {
  return `${x}/${y}/${width}/${height}`;
}

function toTokenLifecycles<T extends Token>(
  frames: DiffOp<T>[][]
): Lifecycle<T>[];
function toTokenLifecycles<T extends Token, D extends Token>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][]
): (Lifecycle<T> | BoxLifecycle<T, D>)[];
function toTokenLifecycles<T extends Token, D extends Token>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][]
): (Lifecycle<T> | BoxLifecycle<T, D>)[] {
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
      } if (operation.kind === "DEL") {
        const oldPosition = toPosition(operation.item);
        const currentLifecycle = lifecycles.get(oldPosition);
        if (!currentLifecycle) {
          throw new Error();
        }
        currentLifecycle.set(i, operation);
        finished.push(currentLifecycle);
        lifecycles.delete(oldPosition);
      } else if (operation.kind === "MOV" || operation.kind === "BDE") {
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
      if (operation.kind === "ADD" || operation.kind === "BAD") {
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
  for (const trees of treesById.values()) {
    toLifecycle(trees);
  }

  return [...finished, ...lifecycles.values()];
}
