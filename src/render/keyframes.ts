import { Diff } from "../diff";
import { createIdGenerator } from "../lib";
import { RenderToken, TypedToken } from "../types";

// Manages the available render tokens. The goal is to use as few render tokens
// as possible, so this class keeps track of which render token is in use by
// which value token. The render tokens that the classes various methods return
// are never the actual render tokens that it uses internally to track usage,
// but rather immutable copies with modified x/y values.
class TokenPool {
  private nextId = createIdGenerator();
  private reserved = new Map<string, RenderToken[]>(); // hash -> token[]
  private inUse = new Map<TypedToken, RenderToken>();

  // For ADD: get the next best available token or create a new one
  public require(token: TypedToken): RenderToken {
    let list = this.reserved.get(token.hash);
    if (list && list.length > 0) {
      const renderToken = list.shift() as RenderToken;
      this.inUse.set(token, renderToken);
      return { ...renderToken, x: token.x, y: token.y };
    } else {
      if (!list) {
        list = [];
        this.reserved.set(token.hash, []);
      }
      const renderToken = {
        ...token,
        visible: true,
        id: this.nextId(null, token.hash),
      };
      this.inUse.set(token, renderToken);
      return renderToken;
    }
  }

  // For MOV: get the render token that was last used for a specific typed token
  public reuse(source: TypedToken, target: TypedToken): RenderToken {
    let renderToken = this.inUse.get(source);
    // Wrap-around at the end of a keyframe list can cause this to happen.
    if (!renderToken) {
      renderToken = this.require(target);
    }
    return { ...renderToken, x: target.x, y: target.y };
  }

  // For DEL: free used token
  public free(token: TypedToken): string {
    const freed = this.inUse.get(token);
    if (!freed) {
      throw new Error("Can't free, token is not in use at this time!");
    }
    const list = this.reserved.get(token.hash);
    if (!list) {
      throw new Error("List for hash not in reserved map!");
    }
    list.push(freed);
    this.inUse.delete(token);
    return freed.id;
  }
}

type Keyframe = Map<string, RenderToken>; // id -> token

export function toKeyframes(diffs: Diff<TypedToken>[][]): Keyframe[] {
  const tokens = new TokenPool();
  const keyframes: Keyframe[] = [];
  for (let i = 0; i < diffs.length; i++) {
    const keyframe = new Map(keyframes[i - 1] || []);
    for (const op of diffs[i]) {
      if (op.type === "ADD") {
        const token = tokens.require(op.item);
        keyframe.set(token.id, token);
      } else if (op.type === "DEL") {
        const id = tokens.free(op.item);
        keyframe.delete(id);
      } else if (op.type === "MOV") {
        const token = tokens.reuse(op.ref, op.item);
        keyframe.set(token.id, token);
      }
    }
    keyframes.push(keyframe);
  }
  return keyframes;
}
