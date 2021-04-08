// Turns diffing operations into rendering information.

import { DiffTree } from "./diff";
import { createIdGenerator } from "./util";
import { Box, Decoration, RenderBox, RenderDecoration, RenderToken, Token, TypedToken } from "../types";
import { mapBy } from "@sirpepe/shed";

// Manages the available render tokens. The goal is to use as few render tokens
// as possible, so this class keeps track of which render token is in use by
// which value token. The render tokens that the classes various methods return
// are never the actual render tokens that it uses internally to track usage,
// but rather immutable copies with modified x/y values.
class TokenPool<
  Input extends Token & { kind: string },
  Output extends Token & { kind: string; id: string }
> {
  private nextId = createIdGenerator();

  // token hash -> token[]
  private reserved = new Map<string, Output[]>();

  // hash(token + coords) -> token[]
  // We can't use the typed token themselves as keys as we can't be sure that
  // they are always reference equal. They usually are, but not when they did
  // not change between frames. So this hash over the token's hash and its
  // position is the best way to use them as keys.
  private inUse = new Map<string, Output>();

  // Customize how an input token turns into an output token
  constructor(private toOutputToken: (input: Input, newId: string) => Output) {}

  // Probably should be using a real hashing algorithm
  private hashInput(token: Input): string {
    const { kind, hash, x, y, width, height } = token;
    return `${kind}/${hash}/${x}/${y}/${width}/${height}`;
  }

  // For ADD: get the next best available token or create a new one
  public require(token: Input): Output {
    let list = this.reserved.get(token.hash);
    if (list && list.length > 0) {
      const outputToken = list.shift() as Output;
      this.inUse.set(this.hashInput(token), outputToken);
      return { ...outputToken, x: token.x, y: token.y };
    } else {
      if (!list) {
        list = [];
        this.reserved.set(token.hash, []);
      }
      const outputToken = this.toOutputToken(
        token,
        this.nextId(token.kind, token.hash)
      );
      this.inUse.set(this.hashInput(token), outputToken);
      return outputToken;
    }
  }

  // For MOV: get the render token that was last used for a specific typed token
  public reuse(source: Input, target: Input): Output {
    let outputToken = this.inUse.get(this.hashInput(source));
    // Wrap-around at the end of a keyframe list may require us to require a
    // new token because for a MOV in the first frame there's nothing to re-use.
    if (!outputToken) {
      return { ...this.require(target), x: target.x, y: target.y };
    } else {
      outputToken = { ...outputToken, x: target.x, y: target.y };
      // update who's re-using the render token for next keyframe
      this.inUse.delete(this.hashInput(source));
      this.inUse.set(this.hashInput(target), outputToken);
      return outputToken;
    }
  }

  // For DEL: free used token
  public free(token: Input): string {
    const freed = this.inUse.get(this.hashInput(token));
    if (!freed) {
      throw new Error(`Can't free unused ${token.kind} @ ${token.hash}!`);
    }
    const list = this.reserved.get(token.hash);
    if (!list) {
      throw new Error("List for hash not in reserved map!");
    }
    list.push(freed);
    this.inUse.delete(this.hashInput(token));
    return freed.id;
  }
}

function toRenderToken(input: TypedToken, newId: string): RenderToken {
  return {
    kind: "RENDER",
    x: input.x,
    y: input.y,
    text: input.text,
    width: input.width,
    height: input.height,
    type: input.type,
    hash: input.hash,
    id: newId,
    isVisible: true,
  };
}

function toRenderDecoration(
  input: Decoration<any>,
  newId: string,
): RenderDecoration {
  return {
    kind: "RENDER_DECO",
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
    data: input.data,
    hash: input.hash,
    id: newId,
    isVisible: true,
  };
}

export function toRenderData(
  diffs: DiffTree<TypedToken, Decoration<TypedToken>>[],
  parent: Box<any, any> | undefined
): RenderBox[] {
  const renderTokenPool = new TokenPool(toRenderToken);
  const renderDecorationPool = new TokenPool(toRenderDecoration);
  const renderBoxes: RenderBox[] = [];
  for (let i = 0; i < diffs.length; i++) {
    const tokens = renderBoxes[i - 1]?.tokens || new Map();
    const boxes = renderBoxes[i - 1]?.boxes || new Map();
    const decorations = renderBoxes[i - 1]?.decorations || new Map();
    let width = 0;
    let height = 0;
    for (const item of diffs[i].content) {
      if (item.kind === "TREE") {
        // TODO
      } else {
        if (item.kind === "ADD") {
          const token = renderTokenPool.require(item.item);
          tokens.set(token.id, token);
        } else if (item.kind === "DEL") {
          const id = renderTokenPool.free(item.item);
          tokens.delete(id);
        } else if (item.kind === "MOV") {
          const token = renderTokenPool.reuse(item.from, item.item);
          tokens.set(token.id, token);
        }
        if (item.item.x > width) {
          width = item.item.x;
        }
        if (item.item.y > height) {
          height = item.item.y;
        }
      }
    }
    // Width and height are at this point the largest _offsets_, not dimensions,
    // so we compensate for that by adding 1
    width++;
    height++;
    renderBoxes.push({
      kind: "RENDER_BOX",
      x: parent?.x || 0,
      y: parent?.y || 0,
      id: diffs[i].id,
      tokens,
      boxes,
      decorations,
      width,
      height,
      data: parent?.data || {},
      isVisible: true,
    });
  }
  return renderBoxes;
}
