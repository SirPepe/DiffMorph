import { mapBy } from "@sirpepe/shed";
import { Decoration, DecorationPosition, Frame, RenderData, RenderDecoration, RenderPositions, RenderRoot, RenderText, TextPosition, Token, TypedToken } from "../types";
import { ADD, BAD, BDE, DEL, MOV } from "./diff";
import { BoxLifecycle, Lifecycle } from "./lifecycle";
import { createIdGenerator, minmax } from "./util";

type OutputToken = { id: string; };

function toRenderPosition<Input extends Token>(
  { x, y, width, height }: Input,
  id: string,
  isVisible: boolean
): TextPosition {
  return { id, x, y, width, height, isVisible };
}

class TokenPool<Input extends Token, Output extends OutputToken> {
  private nextId = createIdGenerator();

  // hash -> list of currently not used output token
  private available = new Map<string, Output[]>();

  // holder -> [output, last position]
  private inUse = new Map<Lifecycle<Input>, [Output, TextPosition]>();

  // Customize how an input token turns into an output token
  constructor(
    private toOutput: (
      item: Input,
      newId: string
    ) => Output
  ) {}

  // require() actually works and has to work with MOV and BDE in addition to
  // ADD and BAD, but the public interface should only accept the latter two
  private baseRequire(
    holder: Lifecycle<Input>,
    { kind, item }: ADD<Input> | BAD<Input> | MOV<Input> | BDE<Input>
  ): [Output, TextPosition] {
    const isVisible = kind === "ADD" || kind === "MOV";
    let list = this.available.get(item.hash);
    if (list && list.length > 0) {
      const output = list.shift() as Output;
      const position = toRenderPosition(item, output.id, isVisible);
      this.inUse.set(holder, [output, position]);
      return [output, position];
    } else {
      if (!list) {
        // New list remains empty as the output token goes into use right away
        this.available.set(item.hash, []);
      }
      const output = this.toOutput(item, this.nextId(kind, item.hash));
      const position = toRenderPosition(item, output.id, isVisible);
      this.inUse.set(holder, [output, position]);
      return [output, position];
    }
  }

  // For ADD and BAD: get the next best available token or create a new one
  public require(
    holder: Lifecycle<Input>,
    operation: ADD<Input> | BAD<Input>
  ): [Output, TextPosition] {
    return this.baseRequire(holder, operation);
  }

  // For MOV and BDE: get the render token that was last used for a specific
  // typed token
  public reuse(
    holder: Lifecycle<Input>,
    operation: MOV<Input> | BDE<Input>
  ): [Output, TextPosition] {
    let previousOutput = this.inUse.get(holder);
    // Wrap-around at the end of a keyframe list may require us to require a
    // new token because for a MOV in the first frame there's nothing to re-use.
    if (!previousOutput) {
      return this.baseRequire(holder, operation);
    }
    const isVisible = operation.kind === "MOV";
    const newPosition = toRenderPosition(
      operation.item,
      previousOutput[0].id,
      isVisible
    );
    previousOutput[1] = newPosition; // update the last position
    return [previousOutput[0], newPosition];
  }

  // For DEL: free used token
  public free(
    holder: Lifecycle<Input>,
    operation: DEL<Input>
  ): undefined {
    const freed = this.inUse.get(holder);
    if (!freed) {
      // This can happen for DEL ops in the first frame, which in turn may be
      // inserted there by the extender.
      return;
    }
    const list = this.available.get(operation.item.hash);
    if (!list) {
      throw new Error("List for hash not in reserved map!");
    }
    list.push(freed[0]);
    this.inUse.delete(holder);
  }

  // In case there is no current operation, see if the holder holds onto
  // something and re-use the existing information
  public getLast(holder: Lifecycle<Input>): [Output, TextPosition] | undefined {
    return this.inUse.get(holder);
  }
}

function renderToken<Input extends Token, Output extends OutputToken>(
  lifecycle: Lifecycle<Input>,
  frame: number,
  pool: TokenPool<Input, Output>
): [Output, TextPosition] | undefined {
  const operation = lifecycle.get(frame);
  // If there's no current operation, see if the lifecycle holds onto something
  // in the pool and just recycle that.
  if (!operation) {
    return pool.getLast(lifecycle);
  }
  // If there is a current operation, pull render info from the pool
  switch (operation.kind) {
    case "ADD":
    case "BAD": {
      return pool.require(lifecycle, operation);
    }
    case "MOV":
    case "BDE": {
      return pool.reuse(lifecycle, operation);
    }
    case "DEL": {
      return pool.free(lifecycle, operation);
    }
  }
}

function toRenderText(
  { type, text }: TypedToken,
  id: string
): RenderText {
  return { type, text, id };
}

function toRenderDecoration(
  { data }: Decoration<any>,
  id: string
): RenderDecoration {
  return { data, id };
}

function renderFrames(
  lifecycle: BoxLifecycle<TypedToken, Decoration<any>>,
): [ RenderRoot, Map<number, RenderPositions> ] {
  const frames = new Map();
  const boxLifecycles = new Set<BoxLifecycle<TypedToken, Decoration<any>>>();
  const textTokens = new Map<string, RenderText>();
  const decoTokens = new Map<string, RenderDecoration>();
  const textPool = new TokenPool(toRenderText);
  const decoPool = new TokenPool(toRenderDecoration);
  const [minFrame, maxFrame] = minmax(lifecycle.self.keys());
  for (let i = minFrame; i <= maxFrame; i++) {
    //
    const self = lifecycle.self.get(i);
    if (!self) {
      continue;
    }
    const frame = {
      text: new Map<string, TextPosition>(),
      decorations: new Map<string, DecorationPosition>(),
      boxes: new Map<string, RenderPositions>(),
    };
    const isVisible = ["ADD", "MOV", "BOX"].includes(self.kind);
    frames.set(i, {
      ...toRenderPosition(self.item, lifecycle.base.id, isVisible),
      frame,
    });
    //
    for (const textLifecycle of lifecycle.text) {
      const result = renderToken(textLifecycle, i, textPool);
      if (result) {
        textTokens.set(result[0].id, result[0]);
        frame.text.set(result[1].id, result[1]);
      }
    }
    //
    for (const decoLifecycle of lifecycle.decorations) {
      const result = renderToken(decoLifecycle, i, decoPool);
      if (result) {
        decoTokens.set(result[0].id, result[0]);
        frame.decorations.set(result[1].id, result[1]);
      }
    }
    // Collect the entire lifecycles in a set, as each lifecycle only has to
    // be processed once.
    for (const boxLifecycle of lifecycle.boxes) {
      boxLifecycles.add(boxLifecycle);
    }
  }
  //
  const boxTokens = new Map<string, RenderRoot>();
  for (const boxLifecycle of boxLifecycles) {
    const [root, frames] = renderFrames(boxLifecycle);
    boxTokens.set(root.id, root);
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
      }
    },
    frames,
  ];
}

export function toRenderData(
  rootLifecycle: BoxLifecycle<TypedToken, Decoration<any>> | null
): RenderData {
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
        }
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
