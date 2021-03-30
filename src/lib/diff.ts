// This module's main diff() function turns frames of typed tokens into diffing
// operations. It first attempts to diff the source code on a line-by-line level
// and only looks at individual tokens in a second pass.

import { diffArrays } from "diff";
import { groupBy, mapBy, partition } from "@sirpepe/shed";
import { Box } from "../types";
import { createIdGenerator, isBox } from "./util";

// Represents the minimal token info that diffing functions require to work.
type DiffableToken = {
  x: number;
  y: number;
  hash: string;
};

export type ADD<T extends DiffableToken> = { readonly type: "ADD"; item: T };
export type DEL<T extends DiffableToken> = { readonly type: "DEL"; item: T };
export type MOV<T extends DiffableToken> = {
  readonly type: "MOV";
  item: T;
  ref: T; // keeps track of the position a moved token had before it moved
};
export type DiffOp<T extends DiffableToken> = MOV<T> | ADD<T> | DEL<T>;

type Line<T extends DiffableToken> = {
  readonly x: number;
  readonly y: number;
  readonly id: string;
  readonly hash: string;
  readonly items: T[];
};

type DiffResult<T extends DiffableToken> = {
  source: Omit<Box<T>, "parent" | "tokens">;
  nested: DiffResult<T>[];
  ops: DiffOp<T>[];
};

// Create a hash of a list of tokens by concatenating the token's hashes and
// their *relative* distance on the x axis. The allover level of indentation is
// not reflected in the hash - two lines containing the same characters the same
// distance apart get the same hash, no matter the indentation
const hashLine = (items: DiffableToken[]): string => {
  const hashes = items.map((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    return item.hash + String(xDelta);
  });
  return hashes.join("");
};

// Organize tokens into lines
const asLines = <T extends DiffableToken>(tokens: T[]): Line<T>[] => {
  const nextId = createIdGenerator();
  const byLine = groupBy(tokens, "y");
  return Array.from(byLine, ([y, items]) => {
    const hash = hashLine(items);
    const id = nextId(null, hash);
    const x = items.length > 0 ? items[0].x : 0;
    return { hash, id, items, x, y };
  });
};

const diffLines = <T extends DiffableToken>(
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
            type: "MOV",
            item: line.items[i],
            ref: fromLine.items[i],
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

const diffTokens = <T extends DiffableToken>(from: T[], to: T[]): DiffOp<T>[] => {
  const result: DiffOp<T>[] = [];
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash && a.x === b.x && a.y === b.y,
    ignoreCase: false,
  });
  for (const change of changes) {
    for (const value of change.value) {
      if (change.added) {
        result.push({ type: "ADD", item: value });
      } else if (change.removed) {
        result.push({ type: "DEL", item: value });
      }
    }
  }
  return result;
};

function getBoxSource<T extends DiffableToken>(
  from: Box<T> | undefined,
  to: Box<T> | undefined
): Omit<Box<T>, "parent" | "tokens"> {
  return {
    id: from?.id || to?.id || fail(),
    hash: from?.hash || to?.hash || fail(),
    meta: from?.meta || to?.meta || fail(),
    language: from?.language || to?.language || fail(),
  };
}

// Only exported for unit tests
export function diffBoxes<T extends DiffableToken>(
  from: Box<T> | undefined,
  to: Box<T> | undefined
): DiffResult<T> {
  if (!from && !to) {
    throw new Error("Refusing to diff two undefined frames!");
  }
  const tokens = [];
  const nested = [];
  const [fromBoxes, fromTokens] = partition<Box<T>, T>(from?.tokens ?? [], isBox);
  const [toBoxes, toTokens] = partition<Box<T>, T>(to?.tokens ?? [], isBox);
  const lineDiff = diffLines(asLines(fromTokens), asLines(toTokens));
  tokens.push(...lineDiff.result);
  tokens.push(...diffTokens(lineDiff.restFrom, lineDiff.restTo));
  const fromBoxesById = mapBy(fromBoxes, "id");
  const toBoxesById = mapBy(toBoxes, "id");
  for (const id of new Set([...fromBoxesById.keys(), ...toBoxesById.keys()])) {
    const fromBox = fromBoxesById.get(id);
    const toBox = toBoxesById.get(id);
    nested.push(diffBoxes(fromBox, toBox));
  }
  return {
    source: getBoxSource(from, to),
    ops: tokens,
    nested,
  };
};

export const diff = <T extends DiffableToken>(
  roots: Box<T>[]
): DiffResult<T>[] => {
  if (roots.length < 2) {
    throw new Error("Need at least two frames to diff");
  }
  const diffs: DiffResult<T>[] = [diffBoxes(undefined, roots[0])];
  for (let i = 0; i < roots.length - 1; i++) {
    diffs.push(diffBoxes(roots[i], roots[i + 1]));
  }
  return diffs;
};
