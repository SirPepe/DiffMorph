import { DiffOp, DiffTree } from "./diff";

type Extendable = { hash: string };

// Extends the already-optimized diff trees in-place in the following manner:
// * where possible, ADD ops are replaced with a MOV in the current and a BAD in
//   the previous frame; this places tokens in the places where they become
//   visible in the frame just before. This prevent every token from flying in
//   from the top left (which is every token's default position).
// * where possible, DEL ops are moves one frame forward and get replaced by a
//   ADE op; this allows the token to fade out without also moving to the top
//   left (which is every token's default position).
export function extendDiffs<T extends Extendable, D extends Extendable>(
  diffs: DiffTree<T, D>[]
): DiffTree<T, D>[] {
  if (diffs.length < 2) {
    return diffs;
  }
  const contentFrames = diffs.map(({ content }) => content);
  extendAdditions(contentFrames);
  extendDeletions(contentFrames);
  const decorationFrames = diffs.map(({ decorations }) => decorations);
  extendAdditions(decorationFrames);
  extendDeletions(decorationFrames);
  return diffs;
}

// Also extends nested trees. This is a step that extendDeletions() must not
// repeat.
function extendAdditions<T extends Extendable, D extends Extendable>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][]
): void {
  const treesById = new Map<string, DiffTree<T, D>[]>();
  for (let i = 0; i < frames.length; i++) {
    const curr = frames[i];
    const prev = i === 0 ? frames[frames.length - 1] : frames[i - 1];
    for (let j = 0; j < curr.length; j++) {
      const operation = curr[j];
      if (operation.kind === "TREE") {
        const trees = treesById.get(operation.root.item.id);
        if (!trees) {
          treesById.set(operation.root.item.id, [operation]);
        } else {
          trees.push(operation);
        }
        // Add BAD to ADD (trees)
        if (operation.root.kind == "ADD" && i !== 0) {
          const newPrevOp = {
            ...operation,
            root: {
              kind: "BAD" as const,
              item: operation.root.item,
            },
          };
          // Index of the DEL operation to replace with BAD in prev, if any
          const replaceIdx = prev.findIndex((op) => {
            return (
              op.kind === "TREE" &&
              op.root.kind === "DEL" &&
              op.root.item.id === operation.root.item.id
            );
          });
          if (replaceIdx === -1) {
            prev.push(newPrevOp);
          } else {
            prev.splice(replaceIdx, 1, newPrevOp);
          }
          prev.push();
          curr.splice(j, 1, {
            ...operation,
            root: {
              kind: "MOV",
              item: operation.root.item,
              from: operation.root.item,
            },
          });
        }
      } else {
        // Add BAD to ADD (tokens)
        if (operation.kind == "ADD" && i !== 0) {
          const newPrevOp = { kind: "BAD" as const, item: operation.item };
          // Index of the DEL operation to replace with BAD in prev, if any
          const replaceIdx = prev.findIndex((op) => {
            return op.kind === "DEL" && op.item.hash === operation.item.hash;
          });
          if (replaceIdx === -1) {
            prev.push(newPrevOp);
          } else {
            prev.splice(replaceIdx, 1, newPrevOp);
          }
          curr.splice(j, 1, {
            kind: "MOV",
            item: operation.item,
            from: operation.item,
          });
        }
      }
    }
  }
  for (const trees of treesById.values()) {
    extendDiffs(trees);
  }
}

// Does nothing to the contents of nested trees, as extendAdditions has already
// taken care of that.
function extendDeletions<T extends Extendable, D extends Extendable>(
  frames: (DiffTree<T, D> | DiffOp<T>)[][]
): void {
  for (let i = 0; i < frames.length; i++) {
    const curr = frames[i];
    const next = i === frames.length - 1 ? frames[0] : frames[i + 1];
    for (let j = 0; j < curr.length; j++) {
      const operation = curr[j];
      if (operation.kind === "TREE") {
        // TODO: Add ADE to DEL (trees)
      } else {
        // Add BDE before DEL (tokens)
        if (operation.kind == "DEL") {
          // Index of an ADD/BAD operation that may clash
          const existingIndex = next.findIndex((op) => {
            return (
              (op.kind === "ADD" || op.kind === "BAD") &&
              op.item.hash === operation.item.hash
            );
          });
          curr.splice(j, 1, {
            kind: "BDE" as const,
            item: operation.item,
            from: operation.item
          });
          if (existingIndex === -1) {
            next.push({
              kind: "DEL" as const,
              item: operation.item,
            });
          }
        }
      }
    }
  }
}
