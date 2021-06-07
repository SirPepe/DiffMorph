import { DiffBox, DiffOp, NOP } from "../types";
import { dimensionsEql } from "../util";

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
