// This module's main diff() function turns frames of typed tokens into diffing
// operations. It first attempts to diff the source code on a line-by-line level
// and only looks at individual tokens in a second pass.

import { diffArrays } from "diff";
import { groupBy, mapBy } from "@sirpepe/shed";
import { Box, Token } from "../types";
import { createIdGenerator, isBox, isDecoration } from "./util";

export type ADD<T> = {
  readonly kind: "ADD";
  item: T;
};

export type DEL<T> = {
  readonly kind: "DEL";
  item: T;
};

// also responsible for changes in dimensions
export type MOV<T> = {
  readonly kind: "MOV";
  item: T;
  from: T; // reference to the item on it's previous position
};

export type DiffOp<T> = ADD<T> | DEL<T> | MOV<T>;

export type DiffTree<T, D> = {
  readonly kind: "TREE";
  id: string; // box id
  root: DiffOp<Box<T, D>> | undefined;
  tokens: (DiffOp<T> | DiffTree<T, D>)[];
  decorations: DiffOp<D>[];
};

type Line<T extends Token> = {
  readonly x: number;
  readonly y: number;
  readonly id: string;
  readonly hash: string;
  readonly items: T[];
};

// Create a hash of a list of tokens by concatenating the token's hashes and
// their *relative* distance on the x axis. The allover level of indentation is
// not reflected in the hash - two lines containing the same characters the same
// distance apart get the same hash, no matter the indentation
const hashLine = (items: Token[]): string => {
  const hashes = items.map((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    return item.hash + String(xDelta);
  });
  return hashes.join("");
};

// Organize tokens into lines
const asLines = <T extends Token>(tokens: T[]): Line<T>[] => {
  const nextId = createIdGenerator();
  const byLine = groupBy(tokens, "y");
  return Array.from(byLine, ([y, items]) => {
    const hash = hashLine(items);
    const id = nextId(null, hash);
    const x = items.length > 0 ? items[0].x : 0;
    return { hash, id, items, x, y };
  });
};

const diffLines = <T extends Token>(
  from: Line<T>[],
  to: Line<T>[]
): {
  result: DiffOp<T>[];
  restFrom: T[];
  restTo: T[];
} => {
  const result: DiffOp<T>[] = [];
  const toById = new Map(to.map((line) => [line.id, line]));
  const fromById = new Map(from.map((line) => [line.id, line]));
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash,
    ignoreCase: false,
  });
  for (const change of changes) {
    for (const line of change.value) {
      // Line was "added" or "removed" (either added/removed in actuality or
      // some of its tokens changed), so its content must be looked at closer
      // in another stage.
      if (change.added || change.removed) {
        continue;
      }
      // Otherwise the line was either completely unchanged or just moved with
      // all of its tokens, so it can be taken out of the rest of the process.
      const fromLine = fromById.get(line.id);
      if (!fromLine) {
        throw new Error("Expected fromLine to be defined");
      }
      if (fromLine.x !== line.x || fromLine.y !== line.y) {
        // Line was moved on some axis! Link tokens to their predecessors and
        // push them to the moved list (and thus out of the way for the rest of
        // the diffing process)
        for (let i = 0; i < line.items.length; i++) {
          result.push({
            kind: "MOV",
            item: line.items[i],
            from: fromLine.items[i],
          });
        }
      }
      // Indented or unchanged, thus taken care of and can be removed
      fromById.delete(line.id);
      toById.delete(line.id);
    }
  }
  return {
    result,
    restTo: Array.from(toById.values()).flatMap(({ items }) => items),
    restFrom: Array.from(fromById.values()).flatMap(({ items }) => items),
  };
};

const diffTokens = <T extends Token>(from: T[], to: T[]): DiffOp<T>[] => {
  const result: DiffOp<T>[] = [];
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash && a.x === b.x && a.y === b.y,
    ignoreCase: false,
  });
  for (const change of changes) {
    for (const value of change.value) {
      if (change.added) {
        result.push({ kind: "ADD", item: value });
      } else if (change.removed) {
        result.push({ kind: "DEL", item: value });
      }
    }
  }
  return result;
};

function boxMeasurementsEql(a: Box<any, any>, b: Box<any, any>): boolean {
  if (
    a.x !== b.x ||
    a.y !== b.y ||
    a.width !== b.width ||
    a.height !== b.height
  ) {
    return false;
  }
  return true;
}

function diffBox<T, D>(
  from: Box<T, D> | undefined,
  to: Box<T, D> | undefined
): DiffOp<Box<T, D>> | undefined {
  if (from && !to) {
    return {
      kind: "DEL",
      item: from,
    };
  }
  if (to && !from) {
    return {
      kind: "ADD",
      item: to,
    };
  }
  if (from && to && !boxMeasurementsEql(from, to)) {
    return {
      kind: "MOV",
      item: to,
      from,
    };
  }
  return undefined;
}

function partitionTokens<T extends Token, D extends Token>(
  source: Box<T, D> | undefined
): [Box<T, D>[], T[], D[]] {
  const boxes: Box<T, D>[] = [];
  const textTokens: T[] = [];
  if (!source) {
    return [[], [], []];
  }
  for (const item of source.tokens) {
    if (isBox(item)) {
      boxes.push(item);
    } else {
      textTokens.push(item);
    }
  }
  return [boxes, textTokens, source.decorations];
}

// Only exported for unit tests
export function diffBoxes<T extends Token, D extends Token>(
  from: Box<T, D> | undefined,
  to: Box<T, D> | undefined
): DiffTree<T, D> {
  if (!from && !to) {
    throw new Error("Refusing to diff two undefined frames!");
  }
  const root = diffBox<T, D>(from, to);
  const textOps: DiffOp<T>[] = [];
  const decoOps: DiffOp<D>[] = [];
  const boxOps: DiffTree<T, D>[] = [];
  const [fromBoxes, fromTokens, fromDecorations] = partitionTokens(from);
  const [toBoxes, toTokens, toDecorations] = partitionTokens(to);
  const lineDiff = diffLines(asLines(fromTokens), asLines(toTokens));
  textOps.push(...lineDiff.result);
  textOps.push(...diffTokens(lineDiff.restFrom, lineDiff.restTo));
  decoOps.push(...diffTokens(fromDecorations, toDecorations)); // TODO: this probably does not cut it
  const fromBoxesById = mapBy(fromBoxes, "id");
  const toBoxesById = mapBy(toBoxes, "id");
  const boxIds = new Set([...fromBoxesById.keys(), ...toBoxesById.keys()]);
  for (const id of boxIds) {
    const fromBox = fromBoxesById.get(id);
    const toBox = toBoxesById.get(id);
    boxOps.push(diffBoxes(fromBox, toBox));
  }
  return {
    kind: "TREE",
    root: root,
    id: from?.id || to?.id || fail(),
    tokens: [...textOps, ...boxOps],
    decorations: decoOps,
  };
}

export const diff = <T extends Token, D extends Token>(
  roots: Box<T, D>[]
): DiffTree<T, D>[] => {
  if (roots.length < 2) {
    throw new Error("Need at least two frames to diff");
  }
  const diffs: DiffTree<T, D>[] = [diffBoxes(undefined, roots[0])];
  for (let i = 0; i < roots.length - 1; i++) {
    diffs.push(diffBoxes(roots[i], roots[i + 1]));
  }
  return diffs;
};
