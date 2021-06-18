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

import { groupBy } from "@sirpepe/shed";
import {
  Box,
  Decoration,
  DiffBox,
  DiffDecoration,
  DiffOp,
  DiffRoot,
  DiffTokens,
  TypedToken,
} from "../types";
import { isBox } from "../util";
import { assignHashes } from "./assignHashes";
import { diffLinesAndStructures } from "./structs";
import { diffDecorations } from "./decorations";
import { diffBox, matchBoxes } from "./boxes";
import { diffTokens } from "./tokens";

function partitionContent(
  source: DiffBox | undefined
): [Map<number, DiffBox[]>, DiffTokens[], DiffDecoration[]] {
  if (!source) {
    return [new Map(), [], []];
  }
  const boxes: DiffBox[] = [];
  const texts: DiffTokens[] = [];
  for (const item of source.content) {
    if (isBox<DiffBox>(item)) {
      boxes.push(item);
    } else if (!isBox(item)) {
      texts.push(item);
    }
  }
  return [groupBy(boxes, "hash"), texts, source.decorations];
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
  const [fromBoxesByHash, fromTokens, fromDecorations] = partitionContent(from);
  const [toBoxesByHash, toTokens, toDecorations] = partitionContent(to);
  // First pass: diff mayor structures (language constructs and lines of code)
  const structureDiff = diffLinesAndStructures(fromTokens, toTokens);
  textOps.push(...structureDiff.result);
  // Second pass: diff the remaining tokens on an individual basis
  textOps.push(...diffTokens(structureDiff.restFrom, structureDiff.restTo));
  // Decorations are less numerous than text token and thus can probably do with
  // just a single pass.
  decoOps.push(...diffDecorations(fromDecorations, toDecorations));
  // Match up boxes, the recurse
  const boxHashes = new Set([
    ...fromBoxesByHash.keys(),
    ...toBoxesByHash.keys(),
  ]);
  for (const hash of boxHashes) {
    const pairs = matchBoxes(
      fromBoxesByHash.get(hash) ?? [],
      toBoxesByHash.get(hash) ?? []
    );
    for (const pair of pairs) {
      boxOps.push(diffBoxes(...pair));
    }
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
