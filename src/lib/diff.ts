// This module's main diff() function turns frames of tokens and decorations
// into diffing operations. It roughly works as follows:
// 1. diff boxes with equivalent IDs, returning ADD, DEL, MOV or BOX operations.
//    MOV also covers boxes resizing without moving, BOX handles cases where the
//    boxes positions and dimensions stay the same, but contents may have
//    changed.
// 2. diff typed tokens by
//    a. organizing them in lines and diffing the lines by a hash chain. Lines
//       that changed get translated into MOV operations for their constituent
//       typed tokens, which are thus removed from the diffing problem. This
//       could some day be optimized even further by diffing comment and
//       non-comment tokens as lines in two passes, which would prevent changes
//       in comments from breaking up entire lines and leading to confusing
//       diffs.
//    b. diffing the remaining tokens individually, returning only ADD and DEL
//       operations. The optimizer stage is responsible for turning an ADD and a
//       DEL on equivalent tokens into a MOV operation
// 3. diff decorations by hash, position and dimensions, returning only ADD and
//    DEL operations. The optimizer stage can again turn ADD and DEL into MOV.

import { diffArrays } from "diff";
import { groupBy } from "@sirpepe/shed";
import {
  Box,
  Decoration,
  DiffBox,
  DiffDecoration,
  DiffToken,
  Token,
  TypedToken,
} from "../types";
import { createUniqueHashGenerator, hash, isAdjacent, isBox } from "./util";
import { pickAlternative } from "./heuristics";
import { assignHashes } from "./hash";

// ADD does not need a "from" field because it is by definition an initial
// addition. It may get translated to a BAD + MOV pair, but there then BAD is
// the initial addition and MOV has a "from" field anyway.
export type ADD<T> = {
  readonly kind: "ADD";
  item: T;
};

// DEL does not need a "from" field because "item" in this case IS the "from"
export type DEL<T> = {
  readonly kind: "DEL";
  item: T;
};

// MOV is also responsible for changes in box or decoration dimensions. In many
// cases MOV operations are created in the optimizer by compensating for ADD
// operations with DEL operations for equivalent tokens.
export type MOV<T> = {
  readonly kind: "MOV";
  item: T;
  from: T; // reference to the item on it's previous position
};

// All regular operations that the diff and optimizer module deal with
export type DiffOp<T> = ADD<T> | DEL<T> | MOV<T>;

// BAD = "before add", essentially an invisible "add". Inserted into diff trees
// by the lifecycle extension mechanism. Does not need a "from" field because it
// is always an initial addition.
export type BAD<T> = {
  readonly kind: "BAD";
  item: T;
};

// BDE = "before del", essentially an invisible "mov". Inserted into diff trees
// by the lifecycle extension mechanism.
export type BDE<T> = {
  readonly kind: "BDE";
  item: T; // position when fading out ends
  from: T; // reference to the item when fading out starts
};

// Regular plus extra ops that only become relevant once (extended) lifecycles
// come into play
export type ExtendedDiffOp<T> = ADD<T> | DEL<T> | MOV<T> | BAD<T> | BDE<T>;

// Represents boxes that did not change themselves, but that may have changed
// contents or decorations.
export type BOX<T> = {
  readonly kind: "BOX";
  item: T; // reference to the previous box
};

// Models a box in the diff result
export type DiffTree = {
  readonly kind: "TREE";
  root: DiffOp<DiffBox> | BOX<DiffBox>;
  content: (DiffOp<DiffToken> | DiffTree)[];
  decorations: DiffOp<DiffDecoration>[];
};

type Line = {
  readonly x: number;
  readonly y: number;
  readonly id: number;
  readonly hash: number;
  readonly items: DiffToken[];
};

// Compatible to the type Optimizable used in optimizer and heuristics
type Pattern = Token & {
  readonly hash: number;
  readonly items: DiffToken[];
  readonly parent: Box<any, any>;
};

// Create a hash of a list of tokens by concatenating the token's hashes and
// their *relative* distance on the x axis. The allover level of indentation is
// not reflected in the hash - two lines containing the same characters the same
// distance apart get the same hash, no matter the indentation
function hashItems(items: DiffToken[]): number {
  const hashes = items.flatMap((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    return [item.hash, String(xDelta)];
  });
  return hash(hashes);
}

// Organize tokens into lines
function asLines(tokens: DiffToken[]): Line[] {
  const byLine = groupBy(tokens, "y");
  const generator = createUniqueHashGenerator();
  return Array.from(byLine, ([y, items]) => {
    const hash = hashItems(items);
    const id = generator([hash]);
    const x = items.length > 0 ? items[0].x : 0;
    return { hash, id, items, x, y };
  });
}

// Diff entire lines of tokens
function diffLines(
  from: Line[],
  to: Line[]
): { result: MOV<DiffToken>[]; restFrom: DiffToken[]; restTo: DiffToken[] } {
  const result: MOV<DiffToken>[] = [];
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
}

// Organize items into pattern objects
function asPattern(items: DiffToken[], parent: Box<DiffToken, any>): Pattern {
  const [{ x, y }] = items;
  return {
    x,
    y,
    hash: hashItems(items),
    width: 0, // irrelevant for patterns, only required for type compatibility
    height: 0, // irrelevant for patterns, only required for type compatibility
    items,
    parent,
  };
}

// Take items from "items", starting at index "from" until "done" returns either
// true or null (the latter signalling an abort)
function consume(
  items: DiffToken[],
  from: number,
  done: (item: DiffToken) => boolean | null // null = abort
): { result: DiffToken[]; position: number } {
  const consumed = [];
  for (let i = from; i < items.length; i++) {
    const result = done(items[i]);
    if (result === null) {
      return { result: [], position: i };
    } else {
      consumed.push(items[i]);
      if (result === true) {
        return { result: consumed, position: i };
      }
    }
  }
  return { result: [], position: items.length };
}

// Find generic patterns that are common to many languages:
//   * tokens separated by : or - (eg. namespaced tags in xml)
//   * string sequences wrapped in ", ', or `
//   * some variable-name-like text followed by =
// Only exported for unit tests
export function findPatterns(
  items: DiffToken[],
  parent: Box<DiffToken, any>
): Pattern[] {
  const patterns = [];
  for (let i = 0; i < items.length; i++) {
    if (
      (items[i].text === ":" || items[i].text === "-") &&
      isAdjacent(items[i], items[i - 1]) &&
      isAdjacent(items[i], items[i + 1])
    ) {
      patterns.push(asPattern([items[i - 1], items[i], items[i + 1]], parent));
      i += 2;
      continue;
    }
    if (['"', "'", "`"].includes(items[i].text)) {
      const { result, position } = consume(items, i + 1, (curr) => {
        if (curr.y !== items[i].y) {
          return null; // abort on new line
        }
        return curr.text === items[i].text;
      });
      if (result.length > 0) {
        patterns.push(asPattern([items[i], ...result], parent));
      }
      i += position;
      continue;
    }
    if (
      items[i].text?.match(/^[$_a-z][$_a-z0-9]*$/i) &&
      items[i + 1]?.text === "="
    ) {
      patterns.push(asPattern([items[i], items[i + 1]], parent));
      i++;
      continue;
    }
  }
  return patterns;
}

// This should work now
function diffPatterns(
  from: DiffToken[],
  fromParent: Box<DiffToken, any> | undefined,
  to: DiffToken[],
  toParent: Box<DiffToken, any> | undefined
): { result: MOV<DiffToken>[]; restFrom: DiffToken[]; restTo: DiffToken[] } {
  // This does never happen in practice, probably
  if (!fromParent || !toParent) {
    return { result: [], restFrom: from, restTo: to };
  }
  const fromPatternsByHash = groupBy(findPatterns(from, fromParent), "hash");
  const toPatternsByHash = groupBy(findPatterns(to, toParent), "hash");
  const result: MOV<DiffToken>[] = [];
  for (const [hash, fromPatterns] of fromPatternsByHash) {
    const toPatterns = new Set(toPatternsByHash.get(hash) ?? []);
    for (const fromPattern of fromPatterns) {
      const match = pickAlternative(fromPattern, toPatterns);
      if (match) {
        toPatterns.delete(match);
        // Remove the matching items from the source lists as the are definitely
        // taken care of, no matter if they do or don't change.
        from = from.filter((item) => !fromPattern.items.includes(item));
        to = to.filter((item) => !match.items.includes(item));
        // If coordinates don't match, turn the removed items into a bunch of
        // movement ops
        if (match.x !== fromPattern.x || match.y !== fromPattern.y) {
          for (let i = 0; i < match.items.length; i++) {
            result.push({
              kind: "MOV",
              item: match.items[i],
              from: fromPattern.items[i],
            });
          }
        }
        if (toPatterns.size === 0) {
          break;
        }
      }
    }
  }
  return { result, restFrom: from, restTo: to };
}

// Diff individual tokes by their hash and x/y positions
function diffTokens(from: DiffToken[], to: DiffToken[]): DiffOp<DiffToken>[] {
  const result: DiffOp<DiffToken>[] = [];
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
}

// Diff decorations by their hashes, positions and dimensions
function diffDecorations(
  from: DiffDecoration[],
  to: DiffDecoration[]
): DiffOp<DiffDecoration>[] {
  const result: DiffOp<DiffDecoration>[] = [];
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash && dimensionsEql(a, b),
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
}

function dimensionsEql(a: Token, b: Token): boolean {
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

function diffBox(
  from: DiffBox | undefined,
  to: DiffBox | undefined
): DiffOp<DiffBox> | BOX<DiffBox> {
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
  if (from && to) {
    if (dimensionsEql(from, to)) {
      return {
        kind: "BOX",
        item: to,
      };
    } else {
      return {
        kind: "MOV",
        item: to,
        from,
      };
    }
  }
  throw new Error("This can never happen");
}

function partitionTokens(
  source: DiffBox | undefined
): [Map<string, DiffBox>, DiffToken[], DiffDecoration[]] {
  const boxes = new Map();
  const textTokens: DiffToken[] = [];
  if (!source) {
    return [new Map(), [], []];
  }
  for (const item of source.content) {
    if (isBox<DiffBox>(item)) {
      boxes.set(item.id, item);
    } else if (!isBox(item)) {
      textTokens.push(item);
    }
  }
  return [boxes, textTokens, source.decorations];
}

function diffBoxes(
  from: DiffBox | undefined,
  to: DiffBox | undefined
): DiffTree {
  if (!from && !to) {
    throw new Error("Refusing to diff two undefined frames!");
  }
  const root = diffBox(from, to);
  const textOps: DiffOp<DiffToken>[] = [];
  const decoOps: DiffOp<DiffDecoration>[] = [];
  const boxOps: DiffTree[] = [];
  const [fromBoxesById, fromTokens, fromDecorations] = partitionTokens(from);
  const [toBoxesById, toTokens, toDecorations] = partitionTokens(to);
  // First pass: diff entire lines
  const lineDiff = diffLines(asLines(fromTokens), asLines(toTokens));
  textOps.push(...lineDiff.result);
  // Second pass: diff common patterns. This is less of a traditional diff but
  // rather a shortcut directly to optimizing heuristics.
  const patternDiff = diffPatterns(
    lineDiff.restFrom,
    from,
    lineDiff.restTo,
    to
  );
  textOps.push(...patternDiff.result);
  // Final pass: diff the remaining tokens on an individual basis
  textOps.push(...diffTokens(patternDiff.restFrom, patternDiff.restTo));
  // Decorations are less numerous than text token and thus can probably do with
  // just a single pass.
  decoOps.push(...diffDecorations(fromDecorations, toDecorations));
  const boxIds = new Set([...fromBoxesById.keys(), ...toBoxesById.keys()]);
  for (const id of boxIds) {
    const fromBox = fromBoxesById.get(id);
    const toBox = toBoxesById.get(id);
    boxOps.push(diffBoxes(fromBox, toBox));
  }
  return {
    kind: "TREE",
    root,
    content: [...textOps, ...boxOps],
    decorations: decoOps,
  };
}

export function diff(
  roots: Box<TypedToken, Decoration<TypedToken>>[]
): DiffTree[] {
  if (roots.length === 0) {
    return [];
  }
  const hashedRoots = assignHashes(roots);
  const diffs: DiffTree[] = [diffBoxes(undefined, hashedRoots[0])];
  for (let i = 0; i < hashedRoots.length - 1; i++) {
    diffs.push(diffBoxes(hashedRoots[i], hashedRoots[i + 1]));
  }
  return diffs;
}
