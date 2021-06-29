// This module's main diff() function turns frames of tokens and decorations
// into diffing operations. It roughly works as follows:
// 1. diff boxes with equivalent hashes, by using the diff heuristics returning
//    ADD, DEL, MOV or NOP operations. MOV also covers boxes resizing without
//    moving, NOP handles cases where the boxes positions and dimensions stay
//    the same, but contents may have changed. Whether the content actually DID
//    change is another matter.
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

import { isBox } from "../lib/box";
import { Box, Decoration, DiffBox, DiffRoot, TypedToken } from "../types";
import { diffBox } from "./boxes";
import { hash } from "./hash";

function hashBox(box: Box<TypedToken, Decoration<TypedToken>>): void {
  const input = Object.entries(box.data ?? {}).flat(3);
  (box as any).hash = hash(input);
  box.content.forEach((item) => {
    if (isBox(item)) {
      hashBox(item);
    } else {
      (item as any).hash = hash([item.type, item.text]);
    }
  });
  box.decorations.forEach((decoration) => {
    const input = Object.entries(decoration.data ?? {}).flat(3);
    (decoration as any).hash = hash(input);
  });
}

// Assigning hashes happens in-place which is why there's a lot of "any"
// annotations and type assertions in this function and in hashBox()
function hashBoxes(
  boxes: Box<TypedToken, Decoration<TypedToken>>[]
): DiffBox[] {
  boxes.forEach((box) => hashBox(box));
  return boxes as DiffBox[]; // ¯\_(ツ)_/¯
}

export function diff(
  roots: Box<TypedToken, Decoration<TypedToken>>[]
): DiffRoot[] {
  if (roots.length === 0) {
    return [];
  }
  const hashedRoots = hashBoxes(roots);
  const diffs: DiffRoot[] = [diffBox(undefined, hashedRoots[0])];
  for (let i = 0; i < hashedRoots.length - 1; i++) {
    diffs.push(diffBox(hashedRoots[i], hashedRoots[i + 1]));
  }
  return diffs;
}
