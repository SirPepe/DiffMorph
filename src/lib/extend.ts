import { DiffTree } from "./diff";

// Extends the already-optimized diff trees in-place in the following manner:
// * where possible, ADD ops are replaced with a MOV in the current and a BAD in
//   the previous frame; this places tokens in the places where they become
//   visible in the frame just before. This prevent every token from flying in
//   from the top left (which is every token's default position).
// * where possible, DEL ops are moves one frame forward and get replaced by a
//   ADE op; this allows the token to fade out without also moving to the top
//   left (which is every token's default position).
export function extendDiffs<T, D>(diffs: DiffTree<T, D>[]): DiffTree<T, D>[] {
  if (diffs.length < 2) {
    return diffs;
  }
  const treesById = new Map<string, DiffTree<T, D>[]>();
  for (let i = 0; i < diffs.length; i++) {
    const curr = diffs[i];
    const prev = i === 0 ? diffs[diffs.length - 1] : diffs[i - 1];
    // const next = i === diffs.length - 1 ? diffs[0] : diffs[i + 1];
    for (let j = 0; j < curr.content.length; j++) {
      const operation = curr.content[j];
      if (operation.kind === "TREE") {
        const trees = treesById.get(operation.root.item.id);
        if (!trees) {
          treesById.set(operation.root.item.id, [operation]);
        } else {
          trees.push(operation);
        }
        if (operation.root.kind == "ADD" && i !== 0) {
          prev.content.push({
            ...operation,
            root: {
              kind: "BAD",
              item: operation.root.item,
            },
          });
          curr.content.splice(j, 1, {
            ...operation,
            root: {
              kind: "MOV",
              item: operation.root.item,
              from: operation.root.item,
            },
          });
        }
        // TODO: DEL
      } else {
        if (operation.kind == "ADD" && i !== 0) {
          prev.content.push({ kind: "BAD", item: operation.item });
          curr.content.splice(j, 1, {
            kind: "MOV",
            item: operation.item,
            from: operation.item,
          });
        }
        // TODO: DEL
      }
    }
  }
  for (const trees of treesById.values()) {
    extendDiffs(trees);
  }
  return diffs;
}
