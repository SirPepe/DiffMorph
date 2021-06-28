// Turn lifecycles into useable object graphs for rendering.

import { assertIs } from "@sirpepe/shed";
import {
  DecorationPosition,
  DiffBox,
  RenderBox,
  RenderData,
  RenderDecoration,
  RenderPositions,
  RenderRoot,
  RenderText,
  TextPosition,
} from "../types";
import { BoxLifecycle, RootLifecycle, TokenLifecycle } from "./lifecycle";
import { BoxTokenPool, PoolInput, PoolOutput, TokenPool } from "./TokenPool";

// Renders a box, token or decoration for a given frame, using the pool.
function renderObject<Input extends PoolInput, Output extends PoolOutput>(
  lifecycle: TokenLifecycle<Input>,
  frame: number,
  pool: TokenPool<TokenLifecycle<Input>, Input, Output>
): [Output, TextPosition] | undefined;
function renderObject(
  lifecycle: BoxLifecycle,
  frame: number,
  pool: TokenPool<BoxLifecycle, DiffBox, RenderBox>
): [RenderBox, TextPosition] | undefined;
function renderObject<Output extends PoolOutput>(
  lifecycle: TokenLifecycle<any> | BoxLifecycle,
  frame: number,
  pool: TokenPool<TokenLifecycle<any> | BoxLifecycle, any, any>
): [Output, TextPosition] | undefined {
  const operation = lifecycle.get(frame);
  if (operation && operation.kind === "DEL") {
    return pool.free(lifecycle, operation);
  }
  return pool.use(lifecycle, operation);
}

// Note that each lifecycle must be accompanied by the box token pool that it
// can access its render token from
function renderFrames(
  lifecycle: RootLifecycle,
  sourcePool: BoxTokenPool
): [RenderRoot<RenderText, RenderDecoration>, Map<number, RenderPositions>] {
  const frames = new Map<number, RenderPositions>();
  const textTokens = new Map<string, RenderText>();
  const decoTokens = new Map<string, RenderDecoration>();
  const boxTokens = new Map<string, RenderRoot<RenderText, RenderDecoration>>();
  // Pools for the current lifecycle
  const textPool = TokenPool.forText();
  const decoPool = TokenPool.forDeco();
  // Pools that renderFrames() get passed for nested lifecycles
  const boxPool = TokenPool.forBoxes();
  for (const frameIdx of lifecycle.self.keys()) {
    const frame = {
      text: new Map<string, TextPosition>(),
      decorations: new Map<string, DecorationPosition>(),
      boxes: new Map<string, RenderPositions>(),
    };
    // Important: take render tokens from the source pool
    const boxResult = renderObject(lifecycle.self, frameIdx, sourcePool);
    // bxoResult may be undefined on DEL
    if (boxResult) {
      frames.set(frameIdx, { ...boxResult[1], frame });
    }
    // Render and free text tokens on a per-frame basis
    for (const textLifecycle of lifecycle.text) {
      const result = renderObject(textLifecycle, frameIdx, textPool);
      if (result) {
        textTokens.set(result[0].id, result[0]);
        frame.text.set(result[1].id, result[1]);
      }
    }
    // Render and free decoration tokens on a per-frame basis
    for (const decorationLifecycle of lifecycle.decorations) {
      const result = renderObject(decorationLifecycle, frameIdx, decoPool);
      if (result) {
        decoTokens.set(result[0].id, result[0]);
        frame.decorations.set(result[1].id, result[1]);
      }
    }
  }
  for (const boxLifecycle of lifecycle.roots) {
    // Important: take render tokens from the pool for nested boxes
    const [boxToken, boxFrames] = renderFrames(boxLifecycle, boxPool);
    boxTokens.set(boxToken.id, boxToken);
    for (const [boxFrame, boxPositions] of boxFrames) {
      const root = frames.get(boxFrame);
      assertIs(root, "frameRoot");
      root.frame.boxes.set(boxToken.id, boxPositions);
    }
  }
  const id = frames.values().next().value.id ?? fail("No id");
  return [
    {
      id,
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
  rootLifecycle: RootLifecycle | null
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
  const [objects, frames] = renderFrames(rootLifecycle, TokenPool.forBoxes());
  const maxWidth = Math.max(
    ...Array.from(frames.values()).map(({ width }) => width)
  );
  const maxHeight = Math.max(
    ...Array.from(frames.values()).map(({ height }) => height)
  );
  return { objects, frames, maxWidth, maxHeight };
}
