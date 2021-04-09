import { RenderBox } from "../types";

type PositionData = {
  readonly kind: "POSITION";
  id: string;
  x: number;
  y: number;
  isVisible: boolean;
};

type Text = {
  text: string;
  type: string;
};

type Decoration = {
  data: Record<string, any>;
};

type Frame = {
  readonly kind: "FRAME";
  id: string;
  data: Record<string, any>;
  content: (Frame | PositionData)[];
  decorations: PositionData[];
};

type Data = {
  tokens: {
    [id: string]: Text;
  };
  decorations: {
    [id: string]: Decoration;
  };
  frames: Frame[];
};

export function toData(renderBoxes: RenderBox[]): Data {
  const frames: Frame[] = [];
  const textTokens = new Map<string, Text>();
  const decoTokens = new Map<string, Decoration>();
  for (const { id, data, tokens, decorations } of renderBoxes) {
    const frame: Frame = {
      kind: "FRAME",
      id,
      data,
      content: [],
      decorations: [],
    };
    for (const [id, { text, type, x, y, isVisible }] of tokens) {
      if (!textTokens.has(id)) {
        textTokens.set(id, { text, type });
      }
      frame.content.push({ kind: "POSITION", id, x, y, isVisible });
    }
    for (const [id, { data, x, y, isVisible }] of decorations) {
      if (!decoTokens.has(id)) {
        decoTokens.set(id, { data });
      }
      frame.decorations.push({ kind: "POSITION", id, x, y, isVisible });
    }
    frames.push(frame);
  }
  return {
    tokens: Object.fromEntries(textTokens.entries()),
    decorations: Object.fromEntries(decoTokens.entries()),
    frames,
  };
}
