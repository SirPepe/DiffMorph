// Finds structures in diff tokens

import { DiffTokens } from "../types";
import { hash } from "./util";

export type Structure = {
  readonly type: string;
  readonly hash: number;
  readonly items: DiffTokens[];
  readonly structures: Structure[];
};

// Take items from "items", starting at index "from" until "done" returns either
// true or null (the latter signalling an abort)
function consume(
  items: DiffTokens[],
  from: number,
  done: (item: DiffTokens) => boolean | null // null = abort
): { result: DiffTokens[]; position: number } {
  const consumed = [];
  for (let i = from; i < items.length; i++) {
    const result = done(items[i]);
    if (result === null) {
      return { result: [], position: i };
    } else {
      consumed.push(items[i]);
      if (result === true) {
        return { result: consumed, position: i };
      }
    }
  }
  return { result: [], position: items.length };
}

export function findStructures(items: DiffTokens[]): Structure[] {
  const structures = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const structMatch = /(.*)-start-(\d)+$/.exec(item.type);
    if (structMatch && structMatch.length === 3) {
      const [, type, level] = structMatch;
      const { result, position } = consume(items, i, (next) => {
        if (next.parent !== item.parent) {
          return null;
        }
        if (next.type.match(new RegExp(`${type}-end-${level}`))) {
          return true;
        }
        return false;
      });
      if (result.length > 0) {
        structures.push({
          type,
          hash: hash(result.map(({ hash }) => hash)),
          items: result,
          structures: findStructures(result.slice(1, -1)),
        });
      }
      i = position;
    }
  }
  return structures;
}
