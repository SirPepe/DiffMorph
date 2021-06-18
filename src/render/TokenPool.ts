import { ADD, BAD, BDE, DEL, MOV, TextPosition, Token } from "../types";
import { createIdGenerator, toString } from "../util";
import { TokenLifecycle } from "./lifecycle";

export type InputToken = Token & { hash: number };
export type OutputToken = { id: string };

export function toRenderPosition<Input extends Token>(
  { x, y, width, height }: Input,
  id: string,
  isVisible: boolean
): TextPosition {
  return { id, x, y, width, height, alpha: Number(isVisible) };
}

export class TokenPool<Input extends InputToken, Output extends OutputToken> {
  private nextId = createIdGenerator();

  // hash -> list of currently not used output token
  private available = new Map<number, Output[]>();

  // holder -> [output, last position]
  private inUse = new Map<TokenLifecycle<Input>, [Output, TextPosition]>();

  // Customize how an input token turns into an output token
  constructor(private toOutput: (item: Input, newId: string) => Output) {}

  private require(
    holder: TokenLifecycle<Input>,
    { kind, item }: ADD<Input> | BAD<Input> | MOV<Input> | BDE<Input>
  ): [Output, TextPosition] {
    const isVisible = kind === "ADD" || kind === "MOV";
    const available = this.available.get(item.hash);
    if (available && available.length > 0) {
      const output = available.shift() as Output;
      const position = toRenderPosition(item, output.id, isVisible);
      this.inUse.set(holder, [output, position]);
      return [output, position];
    } else {
      if (!available) {
        // New list remains empty as the output token goes into use right away
        this.available.set(item.hash, []);
      }
      const nextId = this.nextId(null, toString(item.hash));
      const output = this.toOutput(item, nextId);
      const position = toRenderPosition(item, output.id, isVisible);
      this.inUse.set(holder, [output, position]);
      return [output, position];
    }
  }

  // Get the render token that was last used for a specific lifecycle or create
  // a new one depending on the input operation. If there's no input operation,
  // attempt to continue with the lifecycle without changes (as that's probably
  // a case of a unchanged token between frames)
  public use(
    holder: TokenLifecycle<Input>,
    operation?: ADD<Input> | BAD<Input> | MOV<Input> | BDE<Input>
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
    // Otherwise perform an update to tha last position
    const isVisible = operation.kind === "MOV" || operation.kind === "ADD";
    const newPosition = toRenderPosition(
      operation.item,
      previousOutput[0].id,
      isVisible
    );
    previousOutput[1] = newPosition; // update the last position
    return [previousOutput[0], newPosition];
  }

  // For DEL: free used token
  public free(holder: TokenLifecycle<Input>, operation: DEL<Input>): undefined {
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
}

export function renderToken<
  Input extends InputToken,
  Output extends OutputToken
>(
  lifecycle: TokenLifecycle<Input>,
  frame: number,
  pool: TokenPool<Input, Output>
): [Output, TextPosition] | undefined {
  const operation = lifecycle.get(frame);
  if (operation && operation.kind === "DEL") {
    return pool.free(lifecycle, operation);
  }
  return pool.use(lifecycle, operation);
}
