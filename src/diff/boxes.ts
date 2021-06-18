import { DiffBox, DiffOp, NOP } from "../types";
import { dimensionsEql } from "../util";
import { pickAlternative } from "./heuristics";

// Pick alternatives from boxes with the same hash
export function matchBoxes(
  fromBoxes: DiffBox[],
  toBoxes: DiffBox[]
): [From: DiffBox | undefined, To: DiffBox | undefined][] {
  // Most common case by far
  if (fromBoxes.length === 1 && toBoxes.length === 1) {
    return [[fromBoxes[0], toBoxes[0]]];
  }
  const matched: [From: DiffBox | undefined, To: DiffBox | undefined][] = [];
  for (const toBox of toBoxes) {
    const [match, index] = pickAlternative(toBox, fromBoxes);
    if (match) {
      matched.push([match, toBox]);
      fromBoxes.splice(index, 1);
    } else {
      matched.push([undefined, toBox]);
    }
  }
  return matched.concat(fromBoxes.map((from) => [from, undefined]));
}

export function diffBox(
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
