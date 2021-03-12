import { DiffOp } from "../lib/diff";
import { createIdGenerator } from "../lib/util";
import { RenderToken, TypedToken } from "../types";

// Manages the available render tokens. The goal is to use as few render tokens
// as possible, so this class keeps track of which render token is in use by
// which value token. The render tokens that the classes various methods return
// are never the actual render tokens that it uses internally to track usage,
// but rather immutable copies with modified x/y values.
class TokenPool {
  private nextId = createIdGenerator();
  // typed token hash -> token[]
  private reserved = new Map<string, RenderToken[]>();
  // hash(typed token hash + typed token x + typed token y) -> token[]
  // We can't use the typed token themselves as keys as we can't be sure that
  // they are always reference equal. They usually are, but not when they did
  // not change between frames. So this hash over the token's hash and its
  // position is the best way to use them as keys.
  private inUse = new Map<string, RenderToken>();

  // Probably should be using a real hashing algorithm
  private hashTypedToken(token: TypedToken): string {
    return `${token.hash}/${token.x}/${token.y}`;
  }

  // For ADD: get the next best available token or create a new one
  public require(token: TypedToken): RenderToken {
    let list = this.reserved.get(token.hash);
    if (list && list.length > 0) {
      const renderToken = list.shift() as RenderToken;
      this.inUse.set(this.hashTypedToken(token), renderToken);
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
      this.inUse.set(this.hashTypedToken(token), renderToken);
      return renderToken;
    }
  }

  // For MOV: get the render token that was last used for a specific typed token
  public reuse(source: TypedToken, target: TypedToken): RenderToken {
    let renderToken = this.inUse.get(this.hashTypedToken(source));
    // Wrap-around at the end of a keyframe list may require us to require a
    // new token because for a MOV in the first frame there's nothing to re-use.
    if (!renderToken) {
      return { ...this.require(target), x: target.x, y: target.y };
    } else {
      renderToken = { ...renderToken, x: target.x, y: target.y };
      // update who's re-using the render token for next keyframe
      this.inUse.delete(this.hashTypedToken(source));
      this.inUse.set(this.hashTypedToken(target), renderToken);
      return renderToken;
    }
  }

  // For DEL: free used token
  public free(token: TypedToken): string {
    const freed = this.inUse.get(this.hashTypedToken(token));
    if (!freed) {
      throw new Error(
        `Can't free unused ${token.type} ${token.text} @ ${token.hash}!`
      );
    }
    const list = this.reserved.get(token.hash);
    if (!list) {
      throw new Error("List for hash not in reserved map!");
    }
    list.push(freed);
    this.inUse.delete(this.hashTypedToken(token));
    return freed.id;
  }
}

export type Keyframe = {
  data: Map<string, RenderToken>; // id -> token
  width: number;
  height: number;
};

export function toKeyframes(diffs: DiffOp<TypedToken>[][]): Keyframe[] {
  const tokens = new TokenPool();
  const keyframes: Keyframe[] = [];
  for (let i = 0; i < diffs.length; i++) {
    const data = new Map(keyframes[i - 1]?.data || []);
    let width = 0;
    let height = 0;
    for (const op of diffs[i]) {
      if (op.type === "ADD") {
        const token = tokens.require(op.item);
        data.set(token.id, token);
      } else if (op.type === "DEL") {
        const id = tokens.free(op.item);
        data.delete(id);
      } else if (op.type === "MOV") {
        const token = tokens.reuse(op.ref, op.item);
        data.set(token.id, token);
      }
      if (op.item.x > width) {
        width = op.item.x;
      }
      if (op.item.y > height) {
        height = op.item.y;
      }
    }
    // Width and height are at this point the largest _offsets_, not dimensions,
    // so we compensate for that
    width++;
    height++;
    keyframes.push({ data, width, height });
  }
  return keyframes;
}
