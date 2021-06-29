// This class manages render tokens. In its internal state, lifecycles hold onto
// render tokens (positions associated with an ID) until a lifecycle is over.
// Render tokens are created on demand and reused where possible. The intent is
// to re-use as many render tokens as possible while making sure that every
// ongoing lifecycle has a render token for itself as long as required. Having
// this class work for text, declarations and boxes alike costs DX, but the
// three static factories and the helper functions hide much of the complexity.

import {
  ADD,
  BAD,
  BasePosition,
  BDE,
  DEL,
  DiffBox,
  DiffDecoration,
  DiffTokens,
  ExtendedDiffOp,
  MOV,
  NOP,
  RenderBox,
  RenderDecoration,
  RenderText,
  TextPosition,
  Token,
} from "../types";
import { createIdGenerator, toString } from "../lib/util";
import { BoxLifecycle, TokenLifecycle } from "./lifecycle";

export type PoolInput = Token & { hash: number };
export type PoolOutput = { id: string };

/* eslint-disable */
export type BoxTokenPool = TokenPool<BoxLifecycle, DiffBox, RenderBox>;
export type TextTokenPool = TokenPool<
  TokenLifecycle<DiffTokens>,
  DiffTokens,
  RenderText
>;
export type DecoTokenPool = TokenPool<
  TokenLifecycle<DiffDecoration>,
  DiffDecoration,
  RenderDecoration
>;
/* eslint-enable */

function isVisible(operation: ExtendedDiffOp<any> | NOP<any>): boolean {
  return ["MOV", "ADD", "NOP"].includes(operation.kind);
}

function toRenderPosition(
  { x, y, width, height }: Token,
  id: string,
  isVisible: boolean
): BasePosition {
  return { id, x, y, width, height, alpha: Number(isVisible) };
}

export class TokenPool<
  Holder,
  Input extends PoolInput,
  Output extends PoolOutput
> {
  private nextId = createIdGenerator();

  // hash -> list of currently not used output token
  private available = new Map<number, Output[]>();

  // holder -> [output, last position]
  private inUse = new Map<Holder, [Output, TextPosition]>();

  // Customize how an input token turns into an output token
  constructor(private toOutput: (item: Input, newId: string) => Output) {}

  private require(
    holder: Holder,
    operation: ADD<Input> | BAD<Input> | MOV<Input> | BDE<Input> | NOP<Input>
  ): [Output, TextPosition] {
    const { item } = operation;
    const available = this.available.get(item.hash);
    if (available && available.length > 0) {
      const output = available.shift() as Output;
      const position = toRenderPosition(item, output.id, isVisible(operation));
      this.inUse.set(holder, [output, position]);
      return [output, position];
    } else {
      if (!available) {
        // New list remains empty as the output token goes into use right away
        this.available.set(item.hash, []);
      }
      const nextId = this.nextId(null, toString(item.hash));
      const output = this.toOutput(item, nextId);
      const position = toRenderPosition(item, output.id, isVisible(operation));
      this.inUse.set(holder, [output, position]);
      return [output, position];
    }
  }

  // Get the render token that was last used for a specific lifecycle or create
  // a new one depending on the input operation. If there's no input operation,
  // attempt to continue with the lifecycle without changes (as that's probably
  // a case of a unchanged token between frames)
  public use(
    holder: Holder,
    operation?: ADD<Input> | BAD<Input> | MOV<Input> | BDE<Input> | NOP<Input>
  ): [Output, TextPosition] | undefined {
    const previousOutput = this.inUse.get(holder);
    // In case there is no current operation, see if the holder holds onto
    // something and re-use the existing information
    if (!operation) {
      return previousOutput;
    }
    // If there is a current operation, but the holder holds onto nothing,
    // create a new token
    if (!previousOutput) {
      return this.require(holder, operation);
    }
    // Otherwise perform an update to the last position
    const newPosition = toRenderPosition(
      operation.item,
      previousOutput[0].id,
      isVisible(operation)
    );
    previousOutput[1] = newPosition; // update the last position
    return [previousOutput[0], newPosition];
  }

  // For DEL: free used token
  public free(holder: Holder, operation: DEL<Input>): undefined {
    const freed = this.inUse.get(holder);
    if (!freed) {
      // This can happen for DEL ops in the first frame, which in turn may be
      // inserted there by lifecycle extensions.
      return;
    }
    const list = this.available.get(operation.item.hash);
    if (!list) {
      throw new Error("List for hash not in reserved map!");
    }
    list.push(freed[0]);
    this.inUse.delete(holder);
  }

  // Factory function for text-specific token pools
  static forText(): TextTokenPool {
    return new TokenPool(({ type, text }: DiffTokens, id: string) => ({
      type,
      text,
      id,
    }));
  }

  // Factory function for decoration-specific token pools
  static forDeco(): DecoTokenPool {
    return new TokenPool(({ data }: DiffDecoration, id: string) => ({
      data,
      id,
    }));
  }

  // Factory function for box-specific token pools
  static forBoxes(): BoxTokenPool {
    return new TokenPool((_, id) => ({ id }));
  }
}
