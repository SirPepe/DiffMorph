// "Diff" hash-equivalent decorations by essentially keeping them in their
// original order as far as possible.

import { groupBy } from "@sirpepe/shed";
import { diffArrays } from "diff";
import { DiffDecoration, DiffOp } from "../types";
import { positionsEql } from "../lib/util";

function diffDecorationGroups(
  from: DiffDecoration[],
  to: DiffDecoration[]
): DiffOp<DiffDecoration>[] {
  const result: DiffOp<DiffDecoration>[] = [];
  if (from.length === to.length) {
    for (let i = 0; i < from.length; i++) {
      if (!positionsEql(from[i], to[i])) {
        result.push({ kind: "MOV", item: to[i], from: from[i] });
      }
    }
    return result;
  }
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash && positionsEql(a, b),
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

export function diffDecorations(
  from: DiffDecoration[],
  to: DiffDecoration[]
): DiffOp<DiffDecoration>[] {
  const ops = [];
  const fromByHash = groupBy(from, "hash");
  const toByHash = groupBy(to, "hash");
  for (const hash of new Set([...fromByHash.keys(), ...toByHash.keys()])) {
    ops.push(
      ...diffDecorationGroups(
        fromByHash.get(hash) ?? [],
        toByHash.get(hash) ?? []
      )
    );
  }
  return ops;
}
