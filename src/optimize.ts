// This module attempts to make morphs nicer by turning addition/removal pairs
// into movements.

import { ADD, DEL, MOV, DiffOp } from "./diff";
import { TokenLike } from "./types";

export function optimize<T extends TokenLike>(
  diffs: DiffOp<T>[][]
): DiffOp<T>[][] {
  return diffs.map(optimizeFrame);
}

function optimizeFrame<T extends TokenLike>(diff: DiffOp<T>[]): DiffOp<T>[] {
  const byHash: Record<string, [MOV<T>[], ADD<T>[], DEL<T>[]]> = {};
  for (const op of diff) {
    if (!byHash[op.item.hash]) {
      byHash[op.item.hash] = [[], [], []];
    }
    if (op.type == "MOV") {
      byHash[op.item.hash][0].push(op);
    } else if (op.type == "ADD") {
      byHash[op.item.hash][1].push(op);
    } else if (op.type === "DEL") {
      byHash[op.item.hash][2].push(op);
    }
  }
  const result: DiffOp<T>[] = [];
  for (const [MOV, ADD, DEL] of Object.values(byHash)) {
    if (ADD.length === 0 || DEL.length === 0) {
      result.push(...MOV, ...ADD, ...DEL);
    } else {
      result.push(...MOV, ...resolveOptimizations(ADD, DEL));
    }
  }
  return result;
}

function resolveOptimizations<T extends TokenLike>(
  additions: ADD<T>[],
  deletions: DEL<T>[]
): DiffOp<T>[] {
  return [...additions, ...deletions];
}
