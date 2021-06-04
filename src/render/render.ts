// Assigns concrete render objects based on lifecycles. The outcome of this
// module could be probably be improved by prioritizing MOV ops over all other
// operations across all lifecycles.

import {
  DecorationPosition,
  DiffDecoration,
  DiffTokens,
  RenderData,
  RenderDecoration,
  RenderPositions,
  RenderRoot,
  RenderText,
  TextPosition,
  Token,
  ADD,
  BAD,
  BDE,
  DEL,
  MOV,
} from "../types";
import { BoxLifecycle, Lifecycle } from "../render/lifecycle";
import { assertIs, createIdGenerator, toString } from "../util";

type InputToken = Token & { hash: number };
type OutputToken = { id: string };

function toRenderPosition<Input extends Token>(
  { x, y, width, height }: Input,
  id: string,
  isVisible: boolean
): TextPosition {
  return { id, x, y, width, height, alpha: Number(isVisible) };
}

class TokenPool<Input extends InputToken, Output extends OutputToken> {
  private nextId = createIdGenerator();

  // hash -> list of currently not used output token
  private available = new Map<number, Output[]>();

  // holder -> [output, last position]
  private inUse = new Map<Lifecycle<Input>, [Output, TextPosition]>();

  // Customize how an input token turns into an output token
  constructor(private toOutput: (item: Input, newId: string) => Output) {}

  private require(
    holder: Lifecycle<Input>,
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
    holder: Lifecycle<Input>,
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
  public free(holder: Lifecycle<Input>, operation: DEL<Input>): undefined {
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

function renderToken<Input extends InputToken, Output extends OutputToken>(
  lifecycle: Lifecycle<Input>,
  frame: number,
  pool: TokenPool<Input, Output>
): [Output, TextPosition] | undefined {
  const operation = lifecycle.get(frame);
  if (operation && operation.kind === "DEL") {
    return pool.free(lifecycle, operation);
  }
  return pool.use(lifecycle, operation);
}

function toRenderText({ type, text }: DiffTokens, id: string): RenderText {
  return { type, text, id };
}

function toRenderDecoration(
  { data }: DiffDecoration,
  id: string
): RenderDecoration {
  return { data, id };
}

function renderFrames(
  lifecycle: BoxLifecycle
): [RenderRoot<RenderText, RenderDecoration>, Map<number, RenderPositions>] {
  const frames = new Map<number, RenderPositions>();
  const textTokens = new Map<string, RenderText>();
  const decoTokens = new Map<string, RenderDecoration>();
  const boxTokens = new Map<string, RenderRoot<RenderText, RenderDecoration>>();
  const textPool = new TokenPool(toRenderText);
  const decoPool = new TokenPool(toRenderDecoration);
  for (const [frameIdx, self] of lifecycle.self) {
    const frame = {
      text: new Map<string, TextPosition>(),
      decorations: new Map<string, DecorationPosition>(),
      boxes: new Map<string, RenderPositions>(),
    };
    const isVisible = ["ADD", "MOV", "NOP"].includes(self.kind);
    frames.set(frameIdx, {
      ...toRenderPosition(self.item, lifecycle.base.id, isVisible),
      frame,
    });
    // Render and free text tokens on a per-frame basis
    for (const textLifecycle of lifecycle.text) {
      const result = renderToken(textLifecycle, frameIdx, textPool);
      if (result) {
        textTokens.set(result[0].id, result[0]);
        frame.text.set(result[1].id, result[1]);
      }
    }
    // Render and free decoration tokens on a per-frame basis
    for (const decorationLifecycle of lifecycle.decorations) {
      const result = renderToken(decorationLifecycle, frameIdx, decoPool);
      if (result) {
        decoTokens.set(result[0].id, result[0]);
        frame.decorations.set(result[1].id, result[1]);
      }
    }
  }
  for (const boxLifecycle of lifecycle.boxes) {
    const [boxToken, boxFrames] = renderFrames(boxLifecycle);
    boxTokens.set(boxToken.id, boxToken);
    for (const [boxFrame, boxPositions] of boxFrames) {
      const root = frames.get(boxFrame);
      assertIs(root, "frameRoot");
      root.frame.boxes.set(boxToken.id, boxPositions);
    }
  }
  return [
    {
      id: lifecycle.base.id,
      data: lifecycle.base.data,
      language: lifecycle.base.language,
      content: {
        text: textTokens,
        decorations: decoTokens,
        boxes: boxTokens,
      },
    },
    frames,
  ];
}

export function toRenderData(
  rootLifecycle: BoxLifecycle | null
): RenderData<RenderText, RenderDecoration> {
  if (rootLifecycle === null) {
    return {
      objects: {
        id: "",
        data: {},
        language: undefined,
        content: {
          text: new Map(),
          decorations: new Map(),
          boxes: new Map(),
        },
      },
      frames: new Map(),
      maxWidth: 0,
      maxHeight: 0,
    };
  }
  const [objects, frames] = renderFrames(rootLifecycle);
  const maxWidth = Math.max(
    ...Array.from(frames.values()).map(({ width }) => width)
  );
  const maxHeight = Math.max(
    ...Array.from(frames.values()).map(({ height }) => height)
  );
  return { objects, frames, maxWidth, maxHeight };
}
