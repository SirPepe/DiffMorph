// Turn lifecycles into useable object graphs for rendering.

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
} from "../types";
import { BoxLifecycle } from "../render/lifecycle";
import { assertIs } from "../util";
import { renderToken, TokenPool, toRenderPosition } from "./TokenPool";

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
