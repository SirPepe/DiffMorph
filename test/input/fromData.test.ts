import { processCode } from "../../src/input/fromData";

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
      { x: 0, y: 0, text: "const" },
      { x: 6, y: 0, text: "a" },
      { x: 8, y: 0, text: "=" },
      { x: 10, y: 0, text: "(" },
      { x: 11, y: 0, text: ")" },
      { x: 13, y: 0, text: "=" },
      { x: 14, y: 0, text: ">" },
      { x: 16, y: 0, text: "42" },
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
      { x: 0, y: 0, text: "const" },
      { x: 6, y: 0, text: "a" },
      { x: 8, y: 0, text: "=" },
      { x: 10, y: 0, text: "(" },
      { x: 11, y: 0, text: ")" },
      { x: 13, y: 0, text: "=" },
      { x: 14, y: 0, text: ">" },
      { x: 16, y: 0, text: "{" },
      { x: 2, y: 1, text: "return" },
      { x: 9, y: 1, text: "42" },
      { x: 11, y: 1, text: ";" },
      { x: 0, y: 2, text: "}" },
      { x: 1, y: 2, text: ";" },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it splits multiple chunks of code", () => {
    const rootContainer = {
      content: ["const a = () => {", "\n", "  return 42;", "\n};"],
      id: "root",
      isHighlight: false,
    };
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const" },
      { x: 6, y: 0, text: "a" },
      { x: 8, y: 0, text: "=" },
      { x: 10, y: 0, text: "(" },
      { x: 11, y: 0, text: ")" },
      { x: 13, y: 0, text: "=" },
      { x: 14, y: 0, text: ">" },
      { x: 16, y: 0, text: "{" },
      { x: 2, y: 1, text: "return" },
      { x: 9, y: 1, text: "42" },
      { x: 11, y: 1, text: ";" },
      { x: 0, y: 2, text: "}" },
      { x: 1, y: 2, text: ";" },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles boxes", () => {
    const rootContainer = {
      content: [
        "const ",
        { content: ["a = () => 42"], id: "box", isHighlight: false },
      ],
      id: "root",
      isHighlight: false,
    };
    const [{ x, y, tokens }, highlights] = processCode(rootContainer);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        meta: {
          id: "box",
          isHighlight: false,
        },
        hash: expect.any(String),
        tokens: [
          { x: 0, y: 0, text: "a" },
          { x: 2, y: 0, text: "=" },
          { x: 4, y: 0, text: "(" },
          { x: 5, y: 0, text: ")" },
          { x: 7, y: 0, text: "=" },
          { x: 8, y: 0, text: ">" },
          { x: 10, y: 0, text: "42" },
        ],
      },
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
      { x: 0, y: 0, text: "const" },
      { x: 6, y: 0, text: "a" },
      { x: 8, y: 0, text: "=" },
      { x: 10, y: 0, text: "(" },
      { x: 11, y: 0, text: ")" },
      { x: 13, y: 0, text: "=" },
      { x: 14, y: 0, text: ">" },
      { x: 16, y: 0, text: "42" },
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
