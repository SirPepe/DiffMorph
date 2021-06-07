import { diffArrays } from "diff";
import { DiffOp, DiffTokens } from "../types";

// Diff individual tokes by their hash and x/y positions
export function diffTokens(
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
