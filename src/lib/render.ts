// Turns diffing operations into rendering information.

import { DiffTree } from "./diff";
import { assertIs, assertIsNot, createIdGenerator } from "./util";
import {
  Decoration,
  RenderBox,
  RenderDecoration,
  RenderToken,
  Token,
  TypedToken,
} from "../types";

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
  newId: string
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

type RenderTokenPool = TokenPool<TypedToken, RenderToken>;
type RenderDecorationPool = TokenPool<Decoration<any>, RenderDecoration>;
type TokenPools = Map<string, [RenderTokenPool, RenderDecorationPool]>;

function getPools(
  pools: TokenPools,
  boxId: string
): [RenderTokenPool, RenderDecorationPool] {
  const existing = pools.get(boxId);
  if (existing) {
    return existing;
  }
  const renderTokenPool = new TokenPool(toRenderToken);
  const renderDecorationPool = new TokenPool(toRenderDecoration);
  pools.set(boxId, [renderTokenPool, renderDecorationPool]);
  return [renderTokenPool, renderDecorationPool];
}

function toRenderBox(
  diff: DiffTree<TypedToken, Decoration<TypedToken>>,
  prev: RenderBox | undefined,
  pools: TokenPools
): RenderBox {
  let width = 0;
  let height = 0;
  const { x, y, id, data } = diff.root.item;
  const [renderTokenPool, renderDecorationPool] = getPools(pools, id);
  // Start out with clones of what was there in the previous render box
  const tokens = new Map(prev?.tokens || []);
  const boxes = new Map(prev?.boxes || []);
  const decorations = new Map(prev?.decorations || []);
  for (const operation of diff.content) {
    if (operation.kind === "TREE") {
      const previousBox = boxes.get(operation.root.item.id);
      if (operation.root.kind === "NOP") {
        assertIs(previousBox, "Prev box should be defined for NOP!");
        boxes.set(id, toRenderBox(operation, previousBox, pools));
      } else {
        if (operation.root.kind === "ADD") {
          assertIsNot(previousBox, "Prev box should not be defined for ADD!");
          boxes.set(id, toRenderBox(operation, previousBox, pools));
        } else if (operation.root.kind === "DEL") {
          assertIs(previousBox, "Prev box should be defined for DEL!");
          boxes.delete(id);
        } else {
          // MOV
          assertIs(previousBox, "Prev box should be defined for MOV!");
          boxes.set(id, toRenderBox(operation, previousBox, pools));
        }
      }
      if (operation.root.item.x > width) {
        width = operation.root.item.x;
      }
      if (operation.root.item.y > height) {
        height = operation.root.item.y;
      }
    } else {
      if (operation.kind === "ADD") {
        const token = renderTokenPool.require(operation.item);
        tokens.set(token.id, token);
      } else if (operation.kind === "DEL") {
        const id = renderTokenPool.free(operation.item);
        tokens.delete(id);
      } else if (operation.kind === "MOV") {
        const token = renderTokenPool.reuse(operation.from, operation.item);
        tokens.set(token.id, token);
      }
      if (operation.item.x > width) {
        width = operation.item.x;
      }
      if (operation.item.y > height) {
        height = operation.item.y;
      }
    }
  }
  // TODO: for (const item of diff.decorations) {}
  // Width and height are at this point the largest _offsets_, not dimensions,
  // so we compensate for that by adding 1
  width++;
  height++;
  return {
    kind: "RENDER_BOX",
    x,
    y,
    id,
    data,
    tokens,
    boxes,
    decorations,
    width,
    height,
    isVisible: true,
  };
}

export function toRenderData(
  diffs: DiffTree<TypedToken, Decoration<TypedToken>>[]
): RenderBox[] {
  const renderBoxes: RenderBox[] = [];
  // box id -> token pools
  const tokenPools: TokenPools = new Map();
  for (let i = 0; i < diffs.length; i++) {
    renderBoxes.push(toRenderBox(diffs[i], renderBoxes[i - 1], tokenPools));
  }
  return renderBoxes;
}
