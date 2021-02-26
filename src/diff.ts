import { diffArrays } from "diff";
import { createIdGenerator, groupBy } from "./lib";

type TokenLike = {
  x: number;
  y: number;
  hash: string;
  parent: {
    hash: any;
  };
};

// "ref" on MOV keeps track of the position a moved token had before it moved
type MOV<T extends TokenLike> = { readonly type: "MOV"; item: T; ref: T };
type ADD<T extends TokenLike> = { readonly type: "ADD"; item: T };
type DEL<T extends TokenLike> = { readonly type: "DEL"; item: T };
export type Diff<T extends TokenLike> = MOV<T> | ADD<T> | DEL<T>;

type Line<T extends TokenLike> = {
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
const hashLine = (items: TokenLike[]): string => {
  const hashes = items.map((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    return item.hash + String(xDelta);
  });
  return hashes.join("");
};

// Organize tokens into lines
const asLines = <T extends TokenLike>(tokens: T[]): Line<T>[] => {
  const nextId = createIdGenerator();
  const byLine = groupBy(tokens, "y");
  return Array.from(byLine, ([y, items]) => {
    const hash = hashLine(items);
    const id = nextId(null, hash);
    const x = items.length > 0 ? items[0].x : 0;
    return { hash, id, items, x, y };
  });
};

const diffLines = <T extends TokenLike>(
  from: Line<T>[],
  to: Line<T>[]
): {
  result: Diff<T>[];
  restFrom: T[];
  restTo: T[];
} => {
  const result: Diff<T>[] = [];
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

const diffTokens = <T extends TokenLike>(from: T[], to: T[]): Diff<T>[] => {
  const result: Diff<T>[] = [];
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

export const diff = <T extends TokenLike>(from: T[], to: T[]): Diff<T>[] => {
  const result: Diff<T>[] = [];
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

export const diffAll = <T extends TokenLike>(frames: T[][]): Diff<T>[][] => {
  const diffs: Diff<T>[][] = [diff([], frames[0])];
  for (let i = 0; i < frames.length - 1; i++) {
    diffs.push(diff(frames[i], frames[i + 1]));
  }
  return diffs;
};
