// Finds structures in diff tokens. This can be logical language constructs as
// well as lines of code.

import { groupBy } from "@sirpepe/shed";
import { diffArrays } from "diff";
import { DiffTokens, Token } from "../types";
import { DiffOp, MOV } from "./diff";
import { pickAlternative } from "./heuristics";
import { findMaxValue, hash } from "./util";

// May encapsulate a language construct or any other sort of softer logical
// structure (a block, a function body etc)
export type Structure = Token & {
  readonly type: string;
  readonly hash: number;
  readonly items: DiffTokens[];
  readonly structures: Structure[];
};

// Create a hash of a list of tokens by concatenating the token's hashes and
// their *relative* offsets. The absolute coordinates are not reflected in the
// hash - two structs containing the same characters the same distances apart on
// either axis get the same hash, no matter the absolute offsets.
function hashItems(items: DiffTokens[]): number {
  const hashes = items.flatMap((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    const yDelta = idx > 0 ? item.y - items[idx - 1].y : 0;
    return [item.hash, xDelta, yDelta];
  });
  return hash(hashes);
}

// Take items from "items", starting at index "from" until "done" returns either
// true or null (the latter signalling an abort)
function consume(
  items: DiffTokens[],
  from: number,
  done: (item: DiffTokens) => boolean | null // null = abort
): { result: DiffTokens[]; position: number } {
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

function toStructure(
  items: DiffTokens[],
  type: string,
  hints: (string | RegExp)[][]
): Structure {
  const { x, y } = items[0];
  return {
    x,
    y,
    width: findMaxValue(items, (item) => item.x + item.width) - x,
    height: findMaxValue(items, (item) => item.y + item.height) - y,
    type,
    hash: hashItems(items),
    items,
    structures: findStructures(items.slice(1, -1), hints),
  };
}

type EndMatcher = {
  type: string;
  match: (item: DiffTokens) => boolean;
};

// Create a pattern for operators and their LHS and RHS
function matchOperatorAndOperands(item: DiffTokens): DiffTokens[] {
  if (item.next && /operator[ -]/.test(item.next.type) && item.next.next) {
    return [item, item.next, item.next.next];
  }
  return [];
}

function matchHints(
  item: DiffTokens,
  hints: (string | RegExp)[][]
): DiffTokens[] {
  const operatorMatch = matchOperatorAndOperands(item);
  if (operatorMatch.length > 0) {
    return operatorMatch;
  }
  for (const hint of hints) {
    const match = [];
    for (let i = 0; i < hint.length; i++) {
      const condition = hint[i];
      if (
        (item && typeof condition === "string" && item.type === condition) ||
        (item && typeof condition === "object" && item.type.match(condition))
      ) {
        match.push(item);
        item = item.next as any;
      } else {
        match.length = 0;
        break;
      }
    }
    if (match.length > 0) {
      return match;
    }
  }
  return [];
}

function matchStructureStart(item: DiffTokens): EndMatcher | null {
  const typeMatch = /(.*)-start-(\d)+$/.exec(item.type);
  if (typeMatch && typeMatch.length === 3) {
    const [, type, level] = typeMatch;
    return {
      type,
      match: (end: DiffTokens) =>
        new RegExp(`${type}-end-${level}`).test(end.type),
    };
  }
  if (item.type.startsWith("string")) {
    const quotesMatch = /^(?<!\\)(["'`])+/.exec(item.text);
    if (quotesMatch && quotesMatch.length === 2) {
      const [, quotes] = quotesMatch;
      return {
        type: "string",
        match: (end: DiffTokens) =>
          end.type.startsWith("string") &&
          !end.prev?.text.endsWith("\\") &&
          new RegExp(`(?<!\\\\)[${quotes}]$`).test(end.text),
      };
    }
  }
  return null;
}

// Only exported for unit tests
export function findStructures(
  items: DiffTokens[],
  hints: (string | RegExp)[][]
): Structure[] {
  const structures: Structure[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const hintsMatch = matchHints(item, hints);
    if (hintsMatch.length > 0) {
      structures.push(toStructure(hintsMatch, "hint", hints));
      i += hintsMatch.length - 1;
      continue;
    }
    const endMatcher = matchStructureStart(item);
    if (endMatcher) {
      const { result, position } = consume(items, i, (next) => {
        if (next.parent !== item.parent) {
          return null;
        }
        if (next !== item && endMatcher.match(next)) {
          return true;
        }
        return false;
      });
      if (result.length > 0) {
        structures.push(toStructure(result, endMatcher.type, hints));
      }
      i = position;
    }
  }
  return structures;
}

function findRest<T>(items: T[], containers: { items: T[] }[]): T[] {
  return items.filter(
    (item) => !containers.some((container) => container.items.includes(item))
  );
}

// Organize tokens into lines, which are just a special case of structure
function asLines(tokens: DiffTokens[]): Structure[] {
  const byLine = groupBy(tokens, "y");
  return Array.from(byLine, ([y, items]) => {
    const hash = hashItems(items);
    const x = items.length > 0 ? items[0].x : 0;
    const width = items[items.length - 1].x + items[items.length - 1].width - x;
    return {
      type: "line",
      hash,
      items,
      x,
      y,
      width,
      height: 1,
      structures: [],
    };
  });
}

// If a structure was moved on some axis, create MOV ops for the affected tokens
function shiftStructure(from: Structure, to: Structure): MOV<DiffTokens>[] {
  const ops: MOV<DiffTokens>[] = [];
  if (from.x !== to.x || from.y !== to.y) {
    for (let i = 0; i < from.items.length; i++) {
      ops.push({
        kind: "MOV",
        item: to.items[i],
        from: from.items[i],
      });
    }
  }
  return ops;
}

// Find and keep unique language structures
function diffStructures(
  from: Structure[],
  to: Structure[]
): { result: MOV<DiffTokens>[]; restFrom: DiffTokens[]; restTo: DiffTokens[] } {
  const result: MOV<DiffTokens>[] = [];
  const fromByHash = groupBy(from, "hash");
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash,
    ignoreCase: false,
  });
  for (const change of changes) {
    if (change.removed) {
      continue;
    }
    // Check if the structure in question has just been moved. This includes
    // changes that are marked as nether "added" nor "removed" because the hash
    // that the diff operates on ignores absolute coordinates
    for (const structure of change.value) {
      const alternatives = fromByHash.get(structure.hash);
      if (!alternatives) {
        continue;
      }
      const [previous, index] = pickAlternative(structure, alternatives);
      if (previous) {
        result.push(...shiftStructure(previous, structure));
        alternatives.splice(index, 1);
      }
    }
  }
  const done = new Set(result.flatMap(({ item, from }) => [item, from]));
  const restFrom = from.flatMap(({ items }) =>
    items.filter((item) => !done.has(item))
  );
  const restTo = to.flatMap(({ items }) =>
    items.filter((item) => !done.has(item))
  );
  return { result, restFrom, restTo };
}

type StructDiff = {
  result: DiffOp<DiffTokens>[];
  restFrom: DiffTokens[];
  restTo: DiffTokens[];
};

export function diffLinesAndStructures(
  fromTokens: DiffTokens[],
  toTokens: DiffTokens[],
  hints: (string | RegExp)[][]
): StructDiff {
  const result: DiffOp<DiffTokens>[] = [];
  // First pass: find and keep unique language structures
  const fromStructures = findStructures(fromTokens, hints);
  const toStructures = findStructures(toTokens, hints);
  // Not every token is part of a structure. The restFrom/restTo arrays returned
  // by diffStructures() only contain the tokens that could not be assigned in
  // the diffing process.
  const remainingFrom = findRest(fromTokens, fromStructures);
  const remainingTo = findRest(toTokens, toStructures);
  const structureDiff = diffStructures(fromStructures, toStructures);
  remainingFrom.push(...structureDiff.restFrom);
  remainingTo.push(...structureDiff.restTo);
  result.push(...structureDiff.result);
  // Second pass: diff lines of remaining tokens
  const lineDiff = diffStructures(asLines(remainingFrom), asLines(remainingTo));
  result.push(...lineDiff.result);
  return { result, restFrom: lineDiff.restFrom, restTo: lineDiff.restTo };
}
