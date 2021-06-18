// This module is strictly speaking a sub module of the diff module and assigns
// hashes (which in the case of boxes are locally unique) to tokens, boxes and
// decorations. This all happens in-place which is why there's a lot of "any"
// annotations and type assertions.

import { hash } from "./hash";
import { Box, Decoration, DiffBox, TypedToken } from "../types";
import { isBox } from "../util";

function hashToken(target: TypedToken): void {
  (target as any).hash = hash([target.type, target.text]);
}

function hashDecoration(decoration: Decoration<TypedToken>): void {
  const input = Object.entries(decoration.data ?? {}).flat(3);
  (decoration as any).hash = hash(input);
}

function hashBox(
  box: Box<TypedToken, Decoration<TypedToken>>,
): void {
  const input = Object.entries(box.data ?? {}).flat(3);
  (box as any).hash = hash(input);
  box.content.forEach((item) => isBox(item) ? hashBox(item) : hashToken(item));
  box.decorations.forEach(hashDecoration);
}

export function assignHashes(
  boxes: Box<TypedToken, Decoration<TypedToken>>[]
): DiffBox[] {
  boxes.forEach((box) => hashBox(box));
  return boxes as DiffBox[]; // ¯\_(ツ)_/¯
}
