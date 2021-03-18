import { processCode } from "../../src/input/fromData";
import { BoxToken, TextToken } from "../../src/types";

describe("processing code from a data source", () => {
  test("it splits code", () => {
    const rootContainer = {
      content: ["const a = () => 42"],
      id: "root",
      isHighlight: false,
    };
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", prev: undefined, next: tokens[1] },
      { x: 6, y: 0, text: "a", prev: tokens[0], next: tokens[2] },
      { x: 8, y: 0, text: "=", prev: tokens[1], next: tokens[3] },
      { x: 10, y: 0, text: "(", prev: tokens[2], next: tokens[4] },
      { x: 11, y: 0, text: ")", prev: tokens[3], next: tokens[5] },
      { x: 13, y: 0, text: "=", prev: tokens[4], next: tokens[6] },
      { x: 14, y: 0, text: ">", prev: tokens[5], next: tokens[7] },
      { x: 16, y: 0, text: "42", prev: tokens[6], next: undefined },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it splits multi-line code", () => {
    /* eslint-disable */
    const rootContainer = {
      content: [`const a = () => {
  return 42;
};`],
      id: "root",
      isHighlight: false,
    };
    /* eslint-enable */
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", next: tokens[1], prev: undefined },
      { x: 6, y: 0, text: "a", next: tokens[2], prev: tokens[0] },
      { x: 8, y: 0, text: "=", next: tokens[3], prev: tokens[1] },
      { x: 10, y: 0, text: "(", next: tokens[4], prev: tokens[2] },
      { x: 11, y: 0, text: ")", next: tokens[5], prev: tokens[3] },
      { x: 13, y: 0, text: "=", next: tokens[6], prev: tokens[4] },
      { x: 14, y: 0, text: ">", next: tokens[7], prev: tokens[5] },
      { x: 16, y: 0, text: "{", next: tokens[8], prev: tokens[6] },
      { x: 2, y: 1, text: "return", next: tokens[9], prev: tokens[7] },
      { x: 9, y: 1, text: "42", next: tokens[10], prev: tokens[8] },
      { x: 11, y: 1, text: ";", next: tokens[11], prev: tokens[9] },
      { x: 0, y: 2, text: "}", next: tokens[12], prev: tokens[10] },
      { x: 1, y: 2, text: ";", next: tokens[13], prev: tokens[11] },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it splits multiple chunks of code", () => {
    const rootContainer = {
      content: ["const a", " = () => {\n", "  return 42;", "\n};"],
      id: "root",
      isHighlight: false,
    };
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", next: tokens[1], prev: undefined },
      { x: 6, y: 0, text: "a", next: tokens[2], prev: tokens[0] },
      { x: 8, y: 0, text: "=", next: tokens[3], prev: tokens[1] },
      { x: 10, y: 0, text: "(", next: tokens[4], prev: tokens[2] },
      { x: 11, y: 0, text: ")", next: tokens[5], prev: tokens[3] },
      { x: 13, y: 0, text: "=", next: tokens[6], prev: tokens[4] },
      { x: 14, y: 0, text: ">", next: tokens[7], prev: tokens[5] },
      { x: 16, y: 0, text: "{", next: tokens[8], prev: tokens[6] },
      { x: 2, y: 1, text: "return", next: tokens[9], prev: tokens[7] },
      { x: 9, y: 1, text: "42", next: tokens[10], prev: tokens[8] },
      { x: 11, y: 1, text: ";", next: tokens[11], prev: tokens[9] },
      { x: 0, y: 2, text: "}", next: tokens[12], prev: tokens[10] },
      { x: 1, y: 2, text: ";", next: undefined, prev: tokens[11] },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles boxes", () => {
    const rootContainer = {
      content: [
        "const ",
        { content: ["a = (", ") => 42"], id: "box", isHighlight: false },
      ],
      id: "root",
      isHighlight: false,
    };
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    const txt = tokens[0] as TextToken;
    const box = tokens[1] as BoxToken;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      prev: undefined,
      next: box.tokens[0],
    });
    expect(box).toMatchObject({
      x: 6,
      y: 0,
      meta: {
        id: "box",
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: expect.any(Array),
    });
    expect(box.tokens).toEqual([
      { x: 0, y: 0, text: "a", next: box.tokens[1], prev: txt },
      { x: 2, y: 0, text: "=", next: box.tokens[2], prev: box.tokens[0] },
      { x: 4, y: 0, text: "(", next: box.tokens[3], prev: box.tokens[1] },
      { x: 5, y: 0, text: ")", next: box.tokens[4], prev: box.tokens[2] },
      { x: 7, y: 0, text: "=", next: box.tokens[5], prev: box.tokens[3] },
      { x: 8, y: 0, text: ">", next: box.tokens[6], prev: box.tokens[4] },
      { x: 10, y: 0, text: "42", next: undefined, prev: box.tokens[5] },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles nested boxes", () => {
    const rootContainer = {
      content: [
        "const ",
        {
          content: [
            "a = () => ",
            {
              content: ["{ return 42; }"],
              id: "nested",
              isHighlight: false,
            },
          ],
          id: "box",
          isHighlight: false,
        },
      ],
      id: "root",
      isHighlight: false,
    };
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    const txt = tokens[0] as TextToken;
    const box1 = tokens[1] as BoxToken;
    const box2 = box1.tokens[6] as BoxToken;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      prev: undefined,
      next: box1.tokens[0],
    });
    expect(box1).toMatchObject({
      x: 6,
      y: 0,
      meta: {
        id: "box",
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: expect.any(Array),
    });
    expect(box1.tokens).toEqual([
      { x: 0, y: 0, text: "a", next: box1.tokens[1], prev: txt },
      { x: 2, y: 0, text: "=", next: box1.tokens[2], prev: box1.tokens[0] },
      { x: 4, y: 0, text: "(", next: box1.tokens[3], prev: box1.tokens[1] },
      { x: 5, y: 0, text: ")", next: box1.tokens[4], prev: box1.tokens[2] },
      { x: 7, y: 0, text: "=", next: box1.tokens[5], prev: box1.tokens[3] },
      { x: 8, y: 0, text: ">", next: box2.tokens[0], prev: box1.tokens[4] },
      box2,
    ]);
    expect(box2.tokens).toEqual([
      { x: 0, y: 0, text: "{", next: box2.tokens[1], prev: box1.tokens[5] },
      { x: 2, y: 0, text: "return", next: box2.tokens[2], prev: box2.tokens[0] }, // eslint-disable-line
      { x: 9, y: 0, text: "42", next: box2.tokens[3], prev: box2.tokens[1] },
      { x: 11, y: 0, text: ";", next: box2.tokens[4], prev: box2.tokens[2] },
      { x: 13, y: 0, text: "}", next: undefined, prev: box2.tokens[3] },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles highlights", () => {
    const rootContainer = {
      content: [
        "const a = () => ",
        { content: ["42"], id: "red", isHighlight: true },
      ],
      id: "root",
      isHighlight: false,
    };
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", next: tokens[1], prev: undefined },
      { x: 6, y: 0, text: "a", next: tokens[2], prev: tokens[0] },
      { x: 8, y: 0, text: "=", next: tokens[3], prev: tokens[1] },
      { x: 10, y: 0, text: "(", next: tokens[4], prev: tokens[2] },
      { x: 11, y: 0, text: ")", next: tokens[5], prev: tokens[3] },
      { x: 13, y: 0, text: "=", next: tokens[6], prev: tokens[4] },
      { x: 14, y: 0, text: ">", next: tokens[7], prev: tokens[5] },
      { x: 16, y: 0, text: "42", next: undefined, prev: tokens[6] },
    ]);
    expect(highlights).toEqual([
      {
        meta: {
          id: "red",
          isHighlight: true,
        },
        hash: expect.any(String),
        start: [16, 0],
        end: [18, 0],
      },
    ]);
  });
});
