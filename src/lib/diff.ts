// This module's diffAll() function turns frames of typed tokens into diffing
// operations. It first attempts to diff the source code on a line-by-line level
// and only looks at individual tokens in a second pass.

import { diffArrays } from "diff";
import { createIdGenerator, groupBy } from "./util";

// Represents the minimum of token info that diffing functions require to work.
type DiffToken = {
  x: number;
  y: number;
  hash: string;
  parent: {
    hash: any;
  };
};

export type ADD<T extends DiffToken> = { readonly type: "ADD"; item: T };
export type DEL<T extends DiffToken> = { readonly type: "DEL"; item: T };
export type MOV<T extends DiffToken> = {
  readonly type: "MOV";
  item: T;
  ref: T; // keeps track of the position a moved token had before it moved
};
export type DiffOp<T extends DiffToken> = MOV<T> | ADD<T> | DEL<T>;

type Line<T extends DiffToken> = {
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
const hashLine = (items: DiffToken[]): string => {
  const hashes = items.map((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    return item.hash + String(xDelta);
  });
  return hashes.join("");
};

// Organize tokens into lines
const asLines = <T extends DiffToken>(tokens: T[]): Line<T>[] => {
  const nextId = createIdGenerator();
  const byLine = groupBy(tokens, "y");
  return Array.from(byLine, ([y, items]) => {
    const hash = hashLine(items);
    const id = nextId(null, hash);
    const x = items.length > 0 ? items[0].x : 0;
    return { hash, id, items, x, y };
  });
};

const diffLines = <T extends DiffToken>(
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

const diffTokens = <T extends DiffToken>(from: T[], to: T[]): DiffOp<T>[] => {
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

// Only exported for unit tests
export const diff = <T extends DiffToken>(from: T[], to: T[]): DiffOp<T>[] => {
  const result: DiffOp<T>[] = [];
  const fromByParent = groupBy(from, (token) => token.parent.hash);
  const toByParent = groupBy(to, (token) => token.parent.hash);
  const parentHashes = new Set([...fromByParent.keys(), ...toByParent.keys()]);
  for (const parentHash of parentHashes) {
    const fromTokens = fromByParent.get(parentHash) || [];
    const toTokens = toByParent.get(parentHash) || [];
    const lineDiff = diffLines(asLines(fromTokens), asLines(toTokens));
    result.push(...lineDiff.result);
    result.push(...diffTokens(lineDiff.restFrom, lineDiff.restTo));
  }
  return result;
};

export const diffAll = <T extends DiffToken>(tokens: T[][]): DiffOp<T>[][] => {
  if (tokens.length < 2) {
    throw new Error("Need at least two frames to diff");
  }
  const diffs: DiffOp<T>[][] = [diff([], tokens[0])];
  for (let i = 0; i < tokens.length - 1; i++) {
    diffs.push(diff(tokens[i], tokens[i + 1]));
  }
  return diffs;
};
