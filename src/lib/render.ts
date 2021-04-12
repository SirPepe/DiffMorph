// Turns diffing operations into rendering information.

import { DiffTree } from "./diff";
import { assertIs, assertIsNot, createIdGenerator } from "./util";
import {
  Box,
  RenderPositions,
  Decoration,
  DecorationPosition,
  Frame,
  RenderRoot,
  RenderData,
  TextPosition,
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
  Output extends { id: string }
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
  constructor(private toOutput: (input: Input, newId: string) => Output) {}

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
      const outputToken = this.toOutput(
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

function toRenderPosition(
  { x, y, width, height }: TypedToken | Decoration<any>,
  id: string
): TextPosition {
  return { id, x, y, width, height, isVisible: true };
}

type RenderTokenPool = TokenPool<TypedToken, TextPosition>;
type RenderDecorationPool = TokenPool<Decoration<any>, DecorationPosition>;
type TokenPools = Map<string, [RenderTokenPool, RenderDecorationPool]>;

// Box IDs are guaranteed to be unique within a parent box, but not globally.
// This fingerprint should remedy this particular problem.
function fingerprintBox(input: Box<any, any>): string {
  let fingerprint = input.id;
  while (input.parent) {
    fingerprint += "__" + input.parent.id;
    input = input.parent;
  }
  return fingerprint;
}

function getPools(
  pools: TokenPools,
  box: Box<any, any>
): [RenderTokenPool, RenderDecorationPool] {
  const id = fingerprintBox(box);
  const existing = pools.get(id);
  if (existing) {
    return existing;
  }
  const renderTokenPool = new TokenPool(toRenderPosition);
  const renderDecorationPool = new TokenPool(toRenderPosition);
  pools.set(id, [renderTokenPool, renderDecorationPool]);
  return [renderTokenPool, renderDecorationPool];
}

function toBoxPosition(
  diff: DiffTree<TypedToken, Decoration<TypedToken>>,
  prev: RenderPositions | undefined,
  pools: TokenPools,
  objects: RenderRoot
): RenderPositions {
  const { id, x, y, width, height } = diff.root.item;
  // Start out with clones of what was there in the previous frame and then add,
  // remove and replace items where needed.
  const frame: Frame = {
    text: new Map(prev?.frame.text || []),
    boxes: new Map(prev?.frame.boxes || []),
    decorations: new Map(prev?.frame.decorations || []),
  };
  const content = getBoxReference(diff.root.item, objects).content;
  const [renderTokenPool, renderDecorationPool] = getPools(
    pools,
    diff.root.item
  );
  for (const op of diff.content) {
    if (op.kind === "TREE") {
      const previousBox = frame.boxes.get(id);
      if (op.root.kind === "NOP") {
        assertIs(previousBox, "Prev box should be defined for NOP!");
        frame.boxes.set(id, toBoxPosition(op, previousBox, pools, objects));
      } else {
        if (op.root.kind === "ADD") {
          assertIsNot(previousBox, "Prev box should not be defined for ADD!");
          frame.boxes.set(id, toBoxPosition(op, undefined, pools, objects));
        } else if (op.root.kind === "DEL") {
          assertIs(previousBox, "Prev box should be defined for DEL!");
          frame.boxes.delete(id);
        } else {
          assertIs(previousBox, "Prev box should be defined for MOV!");
          frame.boxes.set(id, toBoxPosition(op, previousBox, pools, objects));
        }
      }
    } else {
      if (op.kind === "ADD") {
        const token = renderTokenPool.require(op.item);
        frame.text.set(token.id, token);
        content.text.set(token.id, {
          id: token.id,
          text: op.item.text,
          type: op.item.type,
        });
      } else if (op.kind === "DEL") {
        const id = renderTokenPool.free(op.item);
        frame.text.delete(id);
      } else if (op.kind === "MOV") {
        const token = renderTokenPool.reuse(op.from, op.item);
        frame.text.set(token.id, token);
      }
    }
  }
  for (const op of diff.decorations) {
    if (op.kind === "ADD") {
      const token = renderDecorationPool.require(op.item);
      frame.decorations.set(token.id, token);
      content.decorations.set(token.id, {
        id,
        data: op.item.data,
      });
    } else if (op.kind === "DEL") {
      const id = renderDecorationPool.free(op.item);
      frame.decorations.delete(id);
    } else if (op.kind === "MOV") {
      const token = renderDecorationPool.reuse(op.from, op.item);
      frame.decorations.set(token.id, token);
    }
  }
  return { id, x, y, width, height, frame, isVisible: true };
}

// For a given box object return the matching render box from the object graph
function getBoxReference(start: Box<any, any>, source: RenderRoot): RenderRoot {
  let box: Box<any, any> | undefined = start;
  const path = [];
  while (box) {
    path.unshift(box);
    box = box.parent;
  }
  let result: RenderRoot = source;
  if (path.length === 1 && start.id === source.id) {
    return source;
  }
  for (const element of path) {
    let renderBox = source.content.boxes.get(element.id);
    if (!renderBox) {
      renderBox = {
        id: element.id,
        data: element.data,
        language: element.language,
        content: {
          text: new Map(),
          decorations: new Map(),
          boxes: new Map(),
        },
      };
      source.content.boxes.set(element.id, renderBox);
    }
    result = renderBox;
  }
  return result;
}

export function toRenderData(
  diffs: DiffTree<TypedToken, Decoration<TypedToken>>[]
): RenderData {
  const { id, data, language } = diffs[0].root.item;
  // This object represents the actual object graph of everything that can ever
  // become visible and gets mutated in-place while the frame data is generated.
  const root: RenderRoot = {
    id,
    data,
    language,
    content: {
      text: new Map(),
      decorations: new Map(),
      boxes: new Map(),
    },
  };
  // box fingerprint -> token pools that manage which token id gets assigned to
  // render something at a given position
  const tokenPools: TokenPools = new Map();
  const frames: RenderPositions[] = [];
  let maxWidth = 0;
  let maxHeight = 0;
  for (let i = 0; i < diffs.length; i++) {
    const frame = toBoxPosition(diffs[i], frames[i - 1], tokenPools, root);
    if (frame.width > maxWidth) {
      maxWidth = frame.width;
    }
    if (frame.height > maxHeight) {
      maxHeight = frame.height;
    }
    frames.push(frame);
  }
  return { root, frames, maxWidth, maxHeight };
}
