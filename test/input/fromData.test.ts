import { processCode } from "../../src/input/fromData";
import { Box, CodeContainer, TextToken } from "../../src/types";

describe("processing code from a data source", () => {
  test("it splits code", () => {
    const rootContainer = {
      content: ["const a = () => 42"],
      id: "root",
      isHighlight: false,
      language: undefined,
    };
    const { root, highlights } = processCode(rootContainer);
    expect(root).toEqual({
      meta: {},
      id: "root0",
      hash: "root",
      tokens: expect.any(Array),
      parent: undefined,
    });
    const tokens = root.tokens;
    expect(root.tokens).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", size: 5, prev: undefined, next: tokens[1], parent: root },
      { x: 6, y: 0, text: "a", size: 1, prev: tokens[0], next: tokens[2], parent: root },
      { x: 8, y: 0, text: "=", size: 1, prev: tokens[1], next: tokens[3], parent: root },
      { x: 10, y: 0, text: "(", size: 1, prev: tokens[2], next: tokens[4], parent: root },
      { x: 11, y: 0, text: ")", size: 1, prev: tokens[3], next: tokens[5], parent: root },
      { x: 13, y: 0, text: "=", size: 1, prev: tokens[4], next: tokens[6], parent: root },
      { x: 14, y: 0, text: ">", size: 1, prev: tokens[5], next: tokens[7], parent: root },
      { x: 16, y: 0, text: "42", size: 2, prev: tokens[6], next: undefined, parent: root },
      /* eslint-enable */
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
      language: undefined,
    };
    /* eslint-enable */
    const { root, highlights } = processCode(rootContainer);
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", size: 5, next: tokens[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", size: 1, next: tokens[2], prev: tokens[0], parent: root },
      { x: 8, y: 0, text: "=", size: 1, next: tokens[3], prev: tokens[1], parent: root },
      { x: 10, y: 0, text: "(", size: 1, next: tokens[4], prev: tokens[2], parent: root },
      { x: 11, y: 0, text: ")", size: 1, next: tokens[5], prev: tokens[3], parent: root },
      { x: 13, y: 0, text: "=", size: 1, next: tokens[6], prev: tokens[4], parent: root },
      { x: 14, y: 0, text: ">", size: 1, next: tokens[7], prev: tokens[5], parent: root },
      { x: 16, y: 0, text: "{", size: 1, next: tokens[8], prev: tokens[6], parent: root },
      { x: 2, y: 1, text: "return", size: 6, next: tokens[9], prev: tokens[7], parent: root },
      { x: 9, y: 1, text: "42", size: 2, next: tokens[10], prev: tokens[8], parent: root },
      { x: 11, y: 1, text: ";", size: 1, next: tokens[11], prev: tokens[9], parent: root },
      { x: 0, y: 2, text: "}", size: 1, next: tokens[12], prev: tokens[10], parent: root },
      { x: 1, y: 2, text: ";", size: 1, next: tokens[13], prev: tokens[11], parent: root },
      /* eslint-enable */
    ]);
    expect(highlights).toEqual([]);
  });

  test("it splits multiple chunks of code", () => {
    const rootContainer = {
      content: ["const a", " = () => {\n", "  return 42;", "\n};"],
      id: "root",
      isHighlight: false,
      language: undefined,
    };
    const { root, highlights } = processCode(rootContainer);
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", size: 5, next: tokens[1], prev: undefined, parent: root, },
      { x: 6, y: 0, text: "a", size: 1, next: tokens[2], prev: tokens[0], parent: root, },
      { x: 8, y: 0, text: "=", size: 1, next: tokens[3], prev: tokens[1], parent: root, },
      { x: 10, y: 0, text: "(", size: 1, next: tokens[4], prev: tokens[2], parent: root, },
      { x: 11, y: 0, text: ")", size: 1, next: tokens[5], prev: tokens[3], parent: root, },
      { x: 13, y: 0, text: "=", size: 1, next: tokens[6], prev: tokens[4], parent: root, },
      { x: 14, y: 0, text: ">", size: 1, next: tokens[7], prev: tokens[5], parent: root, },
      { x: 16, y: 0, text: "{", size: 1, next: tokens[8], prev: tokens[6], parent: root, },
      { x: 2, y: 1, text: "return", size: 6, next: tokens[9], prev: tokens[7], parent: root, },
      { x: 9, y: 1, text: "42", size: 2, next: tokens[10], prev: tokens[8], parent: root, },
      { x: 11, y: 1, text: ";", size: 1, next: tokens[11], prev: tokens[9], parent: root, },
      { x: 0, y: 2, text: "}", size: 1, next: tokens[12], prev: tokens[10], parent: root, },
      { x: 1, y: 2, text: ";", size: 1, next: undefined, prev: tokens[11], parent: root, },
      /* eslint-enable */
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles boxes", () => {
    const rootContainer = {
      content: [
        "const ",
        {
          content: ["a = (", ") => 42"],
          id: "box",
          isHighlight: false,
          language: undefined,
        },
      ],
      id: "root",
      isHighlight: false,
      language: undefined,
    };
    const { root, highlights } = processCode(rootContainer);
    const tokens = root.tokens;
    const txt = tokens[0] as TextToken;
    const box = tokens[1] as Box<TextToken>;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      size: 5,
      prev: undefined,
      next: box.tokens[0],
      parent: root,
    });
    expect(box).toEqual({
      meta: {},
      id: "box0",
      hash: "box",
      tokens: expect.any(Array),
      parent: root,
    });
    expect(box.tokens).toEqual([
      /* eslint-disable */
      { x: 6, y: 0, text: "a", size: 1, next: box.tokens[1], prev: txt, parent: box },
      { x: 8, y: 0, text: "=", size: 1, next: box.tokens[2], prev: box.tokens[0], parent: box },
      { x: 10, y: 0, text: "(", size: 1, next: box.tokens[3], prev: box.tokens[1], parent: box },
      { x: 11, y: 0, text: ")", size: 1, next: box.tokens[4], prev: box.tokens[2], parent: box },
      { x: 13, y: 0, text: "=", size: 1, next: box.tokens[5], prev: box.tokens[3], parent: box },
      { x: 14, y: 0, text: ">", size: 1, next: box.tokens[6], prev: box.tokens[4], parent: box },
      { x: 16, y: 0, text: "42", size: 2, next: undefined, prev: box.tokens[5], parent: box },
      /* eslint-enable */
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
              language: undefined,
            },
          ],
          id: "box",
          isHighlight: false,
          language: undefined,
        },
      ],
      id: "root",
      isHighlight: false,
      language: undefined,
    };
    const { root, highlights } = processCode(rootContainer);
    const tokens = root.tokens;
    const txt = tokens[0] as TextToken;
    const box1 = tokens[1] as Box<TextToken>;
    const box2 = box1.tokens[6] as Box<TextToken>;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      size: 5,
      prev: undefined,
      next: box1.tokens[0],
      parent: root,
    });
    expect(box1).toEqual({
      meta: {},
      id: "box0",
      hash: "box",
      tokens: expect.any(Array),
      parent: root,
    });
    expect(box1.tokens).toEqual([
      /* eslint-disable */
      { x: 6, y: 0, text: "a", size: 1, next: box1.tokens[1], prev: txt, parent: box1, },
      { x: 8, y: 0, text: "=", size: 1, next: box1.tokens[2], prev: box1.tokens[0], parent: box1, },
      { x: 10, y: 0, text: "(", size: 1, next: box1.tokens[3], prev: box1.tokens[1], parent: box1, },
      { x: 11, y: 0, text: ")", size: 1, next: box1.tokens[4], prev: box1.tokens[2], parent: box1, },
      { x: 13, y: 0, text: "=", size: 1, next: box1.tokens[5], prev: box1.tokens[3], parent: box1, },
      { x: 14, y: 0, text: ">", size: 1, next: box2.tokens[0], prev: box1.tokens[4], parent: box1, },
      box2,
      /* eslint-enable */
    ]);
    expect(box2).toEqual({
      meta: {},
      id: "nested0",
      hash: "nested",
      tokens: expect.any(Array),
      parent: box1,
    });
    expect(box2.tokens).toEqual([
      /* eslint-disable */
      { x: 16, y: 0, text: "{", size: 1, next: box2.tokens[1], prev: box1.tokens[5], parent: box2 },
      { x: 18, y: 0, text: "return", size: 6, next: box2.tokens[2], prev: box2.tokens[0], parent: box2 },
      { x: 25, y: 0, text: "42", size: 2, next: box2.tokens[3], prev: box2.tokens[1], parent: box2 },
      { x: 27, y: 0, text: ";", size: 1, next: box2.tokens[4], prev: box2.tokens[2], parent: box2 },
      { x: 29, y: 0, text: "}", size: 1, next: undefined, prev: box2.tokens[3], parent: box2 },
      /* eslint-enable */
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles cases where all content is in nested boxes", () => {
    const rootContainer = {
      content: [
        {
          content: [
            {
              content: ["let x = 42"],
              id: "nested",
              isHighlight: false,
              language: undefined,
            },
          ],
          id: "box",
          isHighlight: false,
          language: undefined,
        },
      ],
      id: "root",
      isHighlight: false,
      language: undefined,
    };
    const { root, highlights } = processCode(rootContainer);
    const contentBox = (root as any).tokens[0].tokens[0];
    expect(root.tokens).toEqual([
      {
        id: "box0",
        hash: "box",
        meta: {},
        tokens: [
          {
            id: "nested0",
            hash: "nested",
            meta: {},
            tokens: [
              /* eslint-disable */
              { x: 0, y: 0, text: "let", size: 3, next: contentBox.tokens[1], prev: undefined, parent: contentBox },
              { x: 4, y: 0, text: "x", size: 1, next: contentBox.tokens[2], prev: contentBox.tokens[0], parent: contentBox },
              { x: 6, y: 0, text: "=", size: 1, next: contentBox.tokens[3], prev: contentBox.tokens[1], parent: contentBox },
              { x: 8, y: 0, text: "42", size: 2, next: undefined, prev: contentBox.tokens[2], parent: contentBox },
              /* eslint-enable */
            ],
            parent: root.tokens[0],
          },
        ],
        parent: root,
      },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles highlights", () => {
    const rootContainer: CodeContainer = {
      content: [
        "const a = () => ",
        {
          content: ["42"],
          id: "red",
          hash: "red",
          meta: {},
          isHighlight: true,
          language: undefined,
        },
      ],
      id: "root",
      hash: "root",
      meta: {},
      isHighlight: false,
      language: undefined,
    };
    const { root, highlights } = processCode(rootContainer);
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", size: 5, next: tokens[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", size: 1, next: tokens[2], prev: tokens[0], parent: root },
      { x: 8, y: 0, text: "=", size: 1, next: tokens[3], prev: tokens[1], parent: root },
      { x: 10, y: 0, text: "(", size: 1, next: tokens[4], prev: tokens[2], parent: root },
      { x: 11, y: 0, text: ")", size: 1, next: tokens[5], prev: tokens[3], parent: root },
      { x: 13, y: 0, text: "=", size: 1, next: tokens[6], prev: tokens[4], parent: root },
      { x: 14, y: 0, text: ">", size: 1, next: tokens[7], prev: tokens[5], parent: root },
      { x: 16, y: 0, text: "42", size: 2, next: undefined, prev: tokens[6], parent: root },
      /* eslint-enable */
    ]);
    expect(highlights).toEqual([
      {
        meta: {},
        id: "red0",
        hash: "red",
        start: [16, 0],
        end: [18, 0],
      },
    ]);
  });
});
