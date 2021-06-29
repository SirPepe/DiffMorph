import { groupBy } from "@sirpepe/shed";
import { isBox } from "../lib/box";
import {
  DiffBox,
  DiffDecoration,
  DiffOp,
  DiffRoot,
  DiffTokens,
  NOP,
} from "../types";
import { dimensionsEql } from "../lib/util";
import { diffDecorations } from "./decorations";
import { pickAlternative } from "./heuristics";
import { diffLinesAndStructures } from "./structs";
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

// Pick alternatives from boxes with the same hash. All inputs must have the
// same hash
function matchBoxes(
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

// Diff boxes by their outer characteristics. The two inputs, if not undefined,
// must have the same hash.
export function diffOuterBox(
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

type ContentsDiff = {
  content: (DiffOp<DiffTokens> | DiffRoot)[];
  decorations: DiffOp<DiffDecoration>[];
};

function diffBoxContents(
  from: DiffBox | undefined,
  to: DiffBox | undefined
): ContentsDiff {
  const content: (DiffOp<DiffTokens> | DiffRoot)[] = [];
  const decorations: DiffOp<DiffDecoration>[] = [];
  const [fromBoxes, fromTokens, fromDecorations] = partitionContent(from);
  const [toBoxes, toTokens, toDecorations] = partitionContent(to);
  const structureDiff = diffLinesAndStructures(fromTokens, toTokens);
  content.push(...structureDiff.result);
  content.push(...diffTokens(structureDiff.restFrom, structureDiff.restTo));
  decorations.push(...diffDecorations(fromDecorations, toDecorations));
  // Match up and diff nested boxes
  const boxHashes = new Set([...fromBoxes.keys(), ...toBoxes.keys()]);
  for (const hash of boxHashes) {
    const pairs = matchBoxes(
      fromBoxes.get(hash) ?? [],
      toBoxes.get(hash) ?? []
    );
    for (const pair of pairs) {
      content.push(diffBox(...pair));
    }
  }
  return { content, decorations };
}

export function diffBox(
  from: DiffBox | undefined,
  to: DiffBox | undefined
): DiffRoot {
  if (!from && !to) {
    throw new Error("Refusing to diff two undefined frames!");
  }
  const root = diffOuterBox(from, to);
  const { content, decorations } = diffBoxContents(from, to);
  return { kind: "ROOT", root, content, decorations };
}
