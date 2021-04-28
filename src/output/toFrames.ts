import {
  DecorationPosition,
  RenderData,
  RenderPositions,
  TextPosition
} from "../types";
import BezierEasing from "bezier-easing";

const ease = BezierEasing(0.25, 0.1, 0.25, 1);

function value(from: number, to: number, step: number, steps: number): number {
  return from + (to - from) * ease(step / steps)
}

// Decorations can change positions, dimensions and alpha
function tweenDecorationPositions(
  fromPositions: Map<string, DecorationPosition>,
  toPositions: Map<string, DecorationPosition>,
  step: number,
  steps: number
): Map<string, DecorationPosition> {
  const result = new Map<string, DecorationPosition>();
  const ids = new Set([...fromPositions.keys(), ...toPositions.keys()]);
  for (const id of ids) {
    const from = fromPositions.get(id);
    const to = toPositions.get(id);
    if (!from || !to){
      continue;
    }
    result.set(id, {
      ...from,
      x: value(from.x, to.x, step, steps),
      y: value(from.y, to.y, step, steps),
      width: value(from.width, to.width, step, steps),
      height: value(from.height, to.height, step, steps),
      alpha: value(from.alpha, to.alpha, step, steps),
    });
  }
  return result;
}

// Text does not change its dimensions
function tweenTextPositions(
  fromPositions: Map<string, TextPosition>,
  toPositions: Map<string, TextPosition>,
  step: number,
  steps: number
): Map<string, TextPosition> {
  const result = new Map<string, TextPosition>();
  const ids = new Set([...fromPositions.keys(), ...toPositions.keys()]);
  for (const id of ids) {
    const from = fromPositions.get(id);
    const to = toPositions.get(id);
    if (!from || !to){
      continue;
    }
    result.set(id, {
      ...from,
      x: value(from.x, to.x, step, steps),
      y: value(from.y, to.y, step, steps),
      alpha: value(from.alpha, to.alpha, step, steps),
    });
  }
  return result;
}

// Boxes' alpha can probably be ignored when rendering to pixels and we don't
// need to interpolate width and height.
function tweenBoxPositions(
  fromPositions: Map<string, RenderPositions>,
  toPositions: Map<string, RenderPositions>,
  step: number,
  steps: number
): Map<string, RenderPositions> {
  const result = new Map<string, RenderPositions>();
  const ids = new Set([...fromPositions.keys(), ...toPositions.keys()]);
  for (const id of ids) {
    const from = fromPositions.get(id);
    const to = toPositions.get(id);
    if (!from || !to){
      continue;
    }
    result.set(id, {
      ...to,
      alpha: 1,
      frame: {
        text: tweenTextPositions(from.frame.text, to.frame.text, step, steps),
        decorations: tweenDecorationPositions(from.frame.decorations, to.frame.decorations, step, steps),
        boxes: tweenBoxPositions(from.frame.boxes, to.frame.boxes, step, steps),
      }
    });
  }
  return result;
}

// Expand a singe keyframe transition
function tweenRootPositions(
  from: RenderPositions,
  to: RenderPositions,
  steps: number
): RenderPositions[] {
  return Array.from({ length: steps }, (_, step) => ({
    ...to,
    alpha: 1,
    frame: {
      text: tweenTextPositions(from.frame.text, to.frame.text, step, steps),
      decorations: tweenDecorationPositions(from.frame.decorations, to.frame.decorations, step, steps),
      boxes: tweenBoxPositions(from.frame.boxes, to.frame.boxes, step, steps),
    }
  }));
}

// Expand all the keyframes
function tweenFrames(
  keyframes: Map<number, RenderPositions>,
  steps: number
): Map<number, RenderPositions> {
  let frame = 0;
  const output = new Map<number, RenderPositions>();
  const input = Array.from(keyframes.values());
  for (let i = 1; i < input.length; i++) {
    const positions = tweenRootPositions(input[i - 1], input[i], steps);
    for (const position of positions) {
      output.set(frame++, position);
    }
  }
  // Close the loop between last and first frame
  const last = tweenRootPositions(input[input.length - 1], input[0], steps);
  for (const position of last) {
    output.set(frame++, position);
  }
  return output;
}

// Only exported for unit tests
export function toFrames(
  renderData: RenderData,
  steps = 30 // 500ms @ 60fps
): RenderData {
  return { ...renderData, frames: tweenFrames(renderData.frames, steps) };
}
