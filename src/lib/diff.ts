// This module's main diff() function turns frames of tokens and decorations
// into diffing operations. It roughly works as follows:
// 1. diff boxes with equivalent IDs, returning ADD, DEL, MOV or BOX operations.
//    MOV also covers boxes resizing without moving, BOX handles cases where the
//    boxes positions and dimensions stay the same, but contents may have
//    changed.
// 2. diff typed tokens by
//    a. organizing them into structures and diffing them by a hash chain. All
//       structures that moved without any other changes translated into MOV
//       operations for their constituent typed tokens, which are thus removed
//       from the diffing problem. This could some day be optimized even further
//       by diffing comment and non-comment tokens as lines in two passes, which
//       would prevent changes in comments from breaking up entire structures
//       and leading to confusing diffs.
//    b. diffing the remaining tokens individually, returning only ADD and DEL
//       operations. The optimizer stage is responsible for turning an ADD and a
//       DEL on equivalent tokens into a MOV operation
// 3. diff decorations by hash, position and dimensions, returning only ADD and
//    DEL operations. The optimizer stage can again turn ADD and DEL into MOV.

import { diffArrays } from "diff";
import {
  Box,
  Decoration,
  DiffBox,
  DiffDecoration,
  DiffOp,
  DiffRoot,
  DiffTokens,
  NOP,
  TypedToken,
} from "../types";
import { dimensionsEql, isBox } from "../util";
import { assignHashes } from "../diff/assignHashes";
import { diffLinesAndStructures } from "./struct";
import { diffDecorations } from "../diff/decorations";

// Diff individual tokes by their hash and x/y positions
function diffTokens(
  from: DiffTokens[],
  to: DiffTokens[]
): DiffOp<DiffTokens>[] {
  const result: DiffOp<DiffTokens>[] = [];
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

function diffBox(
  from: DiffBox | undefined,
  to: DiffBox | undefined
): DiffOp<DiffBox> | NOP<DiffBox> {
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
        kind: "NOP",
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
): [Map<string, DiffBox>, DiffTokens[], DiffDecoration[]] {
  const boxes = new Map();
  const textTokens: DiffTokens[] = [];
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
): DiffRoot {
  if (!from && !to) {
    throw new Error("Refusing to diff two undefined frames!");
  }
  const root = diffBox(from, to);
  const textOps: DiffOp<DiffTokens>[] = [];
  const decoOps: DiffOp<DiffDecoration>[] = [];
  const boxOps: DiffRoot[] = [];
  const [fromBoxesById, fromTokens, fromDecorations] = partitionTokens(from);
  const [toBoxesById, toTokens, toDecorations] = partitionTokens(to);
  // First pass: diff mayor structures (language constructs and lines of code)
  const structureDiff = diffLinesAndStructures(fromTokens, toTokens);
  textOps.push(...structureDiff.result);
  // Second pass: diff the remaining tokens on an individual basis
  textOps.push(...diffTokens(structureDiff.restFrom, structureDiff.restTo));
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
    kind: "ROOT",
    root,
    content: [...textOps, ...boxOps],
    decorations: decoOps,
  };
}

export function diff(
  roots: Box<TypedToken, Decoration<TypedToken>>[]
): DiffRoot[] {
  if (roots.length === 0) {
    return [];
  }
  const hashedRoots = assignHashes(roots);
  const diffs: DiffRoot[] = [diffBoxes(undefined, hashedRoots[0])];
  for (let i = 0; i < hashedRoots.length - 1; i++) {
    diffs.push(diffBoxes(hashedRoots[i], hashedRoots[i + 1]));
  }
  return diffs;
}
