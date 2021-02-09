import { diffArrays } from "diff";
import { createIdGenerator, groupBy } from "./lib";

type TokenLike = {
  x: number;
  y: number;
  hash: string;
};

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

const diffLines = (
  from: Line<TokenLike>[],
  to: Line<TokenLike>[]
): {
  moved: TokenLike[];
  restFrom: TokenLike[];
  restTo: TokenLike[];
} => {
  const moved = [];
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
      // Otherwise the line was either completely unchanged or just indented, so
      // it can be taken out of the rest of the process.
      const fromLine = fromById.get(line.id);
      if (!fromLine) {
        throw new Error("Expected fromLine to be defined");
      }
      if (fromLine.x !== line.x) {
        // Line was indented
        moved.push(...line.items);
      }
      // Indented or unchanged, thus taken care of and can be removed
      toById.delete(line.id);
      fromById.delete(line.id);
    }
  }
  return {
    moved,
    restTo: Array.from(toById.values()).flatMap(({ items }) => items),
    restFrom: Array.from(fromById.values()).flatMap(({ items }) => items),
  };
};

const diffTokens = (
  from: TokenLike[],
  to: TokenLike[]
): {
  added: TokenLike[];
  deleted: TokenLike[];
} => {
  const added = [];
  const deleted = [];
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash,
    ignoreCase: false,
  });
  for (const change of changes) {
    if (change.added) {
      added.push(...change.value);
    } else if (change.removed) {
      deleted.push(...change.value);
    }
  }
  return { added, deleted };
};

export const diff = (
  from: TokenLike[],
  to: TokenLike[]
): {
  moved: TokenLike[];
  added: TokenLike[];
  deleted: TokenLike[];
} => {
  const { moved, restFrom, restTo } = diffLines(asLines(from), asLines(to));
  const { added, deleted } = diffTokens(restFrom, restTo);
  return { moved, added, deleted };
};
