import BezierEasing from "bezier-easing";
import {
  DecorationPosition,
  RenderData,
  RenderDecoration,
  RenderPositions,
  RenderRoot,
  RenderText,
  TextPosition
} from "../types";
import { languages } from "../languages";
import { assertIs } from "../lib/util";
import { DEFAULT_COLORS, Theme, ThemeProperties } from "../lib/theme";

// Translate language theme into canvas styles
function setStyles(
  ctx: CanvasRenderingContext2D,
  styles: ThemeProperties
): void {
  const {
    color,
    "font-style": fontStyle = "normal",
    "font-weight": fontWeight = "normal"
  } = styles;
  // Text color
  if (color) {
    const value = (DEFAULT_COLORS as any)[color] as string | undefined;
    if (value) {
      ctx.fillStyle = value;
    }
  }
  // Assuming the base style is just the size and font family, this should work
  ctx.font = `${fontStyle} ${fontWeight} ${ctx.font}`;
}

const ease = BezierEasing(0.25, 0.1, 0.25, 1);

function value(from: number, to: number, step: number, steps: number): number {
  return from + (to - from) * ease(step / steps)
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

// Expand all the keyframes. Only exported for unit tests
export function tweenFrames(
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

class TextNode {
  private styles: ThemeProperties | undefined;
  constructor(
    private ctx: CanvasRenderingContext2D,
    private text: string,
    type: string,
    theme: Theme,
    private cellSize: number,
    private lineHeight: number,
  ){
    type = type.split(/\s/)[0];
    this.styles = theme[type];
  }

  public draw(x: number, y: number, alpha: number): void {
    if (alpha === 0) {
      return;
    }
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    if (this.styles) {
      setStyles(this.ctx, this.styles);
    }
    this.ctx.fillText(
      this.text,
      x * this.cellSize,
      y * this.cellSize * this.lineHeight
    );
    this.ctx.restore();
  }
}

class DecorationNode {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private styles: Record<string, string>,
    private cellSize: number,
    private lineHeight: number,
  ){}
  public draw(x: number, y: number, w: number, h: number, alpha: number) {
  }
}

function toRenderNodes(
  root: RenderRoot<RenderText, RenderDecoration>,
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  lineHeight: number,
): RenderRoot<TextNode, DecorationNode> {
  const styles = root.language
    ? languages[root.language]?.theme
    : {};
  return {
    ...root,
    content: {
      text: new Map(Array.from(root.content.text, ([id, { text, type }]) => {
        return [
          id,
          new TextNode(ctx, text, type, styles, cellSize, lineHeight)
        ];
      })),
      decorations: new Map(Array.from(root.content.decorations, ([id]) => {
        return [id, new DecorationNode(ctx, {}, cellSize, lineHeight)];
      })),
      boxes: new Map(Array.from(root.content.boxes, ([id, box]) => {
        return [id, toRenderNodes(box, ctx, cellSize, lineHeight)];
      })),
    }
  }
}

function renderNodes(
  nodes: RenderRoot<TextNode, DecorationNode>,
  ctx: CanvasRenderingContext2D,
  frame: RenderPositions,
  xOffset: number,
  yOffset: number,
): void {
  xOffset += frame.x;
  yOffset += frame.y;
  const { frame: { text, decorations, boxes } } = frame;
  for (const [id, { x, y, alpha }] of text) {
    const node = nodes.content.text.get(id);
    assertIs(node, "text node");
    node.draw(x + xOffset, y + yOffset, alpha);
  }
  for (const [id, { x, y, width, height, alpha }] of decorations) {
    const node = nodes.content.decorations.get(id);
    assertIs(node, "decoration node");
    node.draw(x + xOffset, y + yOffset, width, height, alpha);
  }
  for (const [id, boxFrame] of boxes) {
    const node = nodes.content.boxes.get(id);
    assertIs(node, "box node");
    renderNodes(node, ctx, boxFrame, xOffset, yOffset);
  }
}

function setupContext(
  lineHeight: number,
  maxWidth: number,
  maxHeight: number,
  padding: number
): [CanvasRenderingContext2D, number] {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("");
  }
  // Basic setup for measuring text
  ctx.font = `16px monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  // Figure out the equivalent of 1ch
  const { width: cellSize } = ctx.measureText(" ");
  // Resizing the canvas wipes the context state...
  canvas.width = (maxWidth * cellSize) + 2 * padding;
  canvas.height = (maxHeight * cellSize * lineHeight) + 2 * padding;
  // ... so the basic setup needs to be repeated
  ctx.font = `16px monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  // Adjust offset for padding
  ctx.translate(padding, padding);
  return [ctx, cellSize];
}

class ColorIndex {
  #map = new Map<string, [number, number, number, number]>();
  public storeColors(colors: Uint8ClampedArray): void {
    for (let i = 0; i < colors.length; i+=4) {
      const rgba: [number, number, number, number] = [
        colors[i],
        colors[i + 1],
        colors[i + 2],
        colors[i + 3],
      ];
      const hash = rgba.join("/");
      if (!this.#map.has(hash)) {
        this.#map.set(hash, rgba);
      }
    }
  }
  public getColors(): Uint8ClampedArray {
    return new Uint8ClampedArray([...this.#map.values()].flat());
  }
}

// Generate lazily for hopefully some resemblance of efficiency
export function toFrames(
  renderData: RenderData<RenderText, RenderDecoration>,
  steps = 30, // 500ms @ 60fps
  padding = 16,
): [number, number, () => Generator<ImageData, Uint8ClampedArray, unknown>] {
  const lineHeight = 2.5;
  const [ctx, cellSize] = setupContext(
    lineHeight,
    renderData.maxWidth,
    renderData.maxHeight,
    padding,
  );
  const frames = tweenFrames(renderData.frames, steps);
  const nodes = toRenderNodes(renderData.objects, ctx, cellSize, lineHeight);
  const colors = new ColorIndex();
  return [ctx.canvas.width, ctx.canvas.height, function * () {
    for (const frame of frames.values()) {
      ctx.save();
      ctx.setTransform(); // unset padding
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
      renderNodes(nodes, ctx, frame, 0, 0);
      const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      colors.storeColors(data.data);
      yield data;
    }
    return colors.getColors();
  }];
}
