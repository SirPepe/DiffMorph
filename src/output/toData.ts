import { RenderBox } from "../lib/render";

type TokenData = { text: string; type: string };
type PositionData = { id: string; x: number; y: number; visible: boolean };
type Box = { id: string; content: (Box | PositionData)[] };

type Data = {
  tokens: {
    [id: string]: TokenData;
  };
  frames: Box[][];
  highlights: [];
};

export function toData(keyframes: RenderBox[]): Data {
  const tokenData = new Map<string, TokenData>();
  for (const { tokens } of keyframes) {
    for (const [id, token] of tokens) {
      if (!tokenData.has(id)) {
        tokenData.set(id, { text: token.text, type: token.type });
      }
    }
  }
  return {
    tokens: Object.fromEntries(tokenData.entries()),
    frames: [],
    highlights: [],
  };
}
