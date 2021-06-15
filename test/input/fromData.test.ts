import { processCode } from "../../src/input/fromData";
import { Box, CodeContainer, TextToken } from "../../src/types";

describe("processing code from a data source", () => {
  test("splitting code", () => {
    const rootContainer = {
      content: ["const a = 42;"],
      isDecoration: false,
      language: "base",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toEqual({
      data: {},
      language: "base",
      x: 0,
      y: 0,
      width: 13,
      height: 1,
      content: expect.any(Array),
      decorations: [],
      parent: undefined,
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 10, y: 0, text: "42", height: 1, width: 2, prev: content[2], next: content[4], parent: root },
      { x: 12, y: 0, text: ";", height: 1, width: 1, prev: content[3], next: undefined, parent: root },
      /* eslint-enable */
    ]);
  });

  test("multiple chunks of code", () => {
    const rootContainer = {
      content: ["const a", " =", " 42;"],
      isDecoration: false,
      language: "base",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toEqual({
      data: {},
      language: "base",
      x: 0,
      y: 0,
      width: 13,
      height: 1,
      content: expect.any(Array),
      decorations: [],
      parent: undefined,
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 10, y: 0, text: "42", height: 1, width: 2, prev: content[2], next: content[4], parent: root },
      { x: 12, y: 0, text: ";", height: 1, width: 1, prev: content[3], next: undefined, parent: root },
      /* eslint-enable */
    ]);
  });

  test("multi-line code", () => {
    /* eslint-disable */
    const rootContainer = {
      content: [`const a
  =
    42;`],
      isDecoration: false,
      language: undefined,
    };
    /* eslint-enable */
    const root = processCode(rootContainer, [], 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 7,
      height: 3,
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 2, y: 1, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 4, y: 2, text: "42", height: 1, width: 2, prev: content[2], next: content[4], parent: root },
      { x: 6, y: 2, text: ";", height: 1, width: 1, prev: content[3], next: undefined, parent: root },
      /* eslint-enable */
    ]);
  });

  test("multi-line code with tab characters", () => {
    /* eslint-disable */
    const rootContainer = {
      content: [`const a
\t= 42;`],
      isDecoration: false,
      language: undefined,
    };
    /* eslint-enable */
    const root = processCode(rootContainer, [], 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 7,
      height: 2,
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 2, y: 1, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 4, y: 1, text: "42", height: 1, width: 2, prev: content[2], next: content[4], parent: root },
      { x: 6, y: 1, text: ";", height: 1, width: 1, prev: content[3], next: undefined, parent: root },
      /* eslint-enable */
    ]);
  });

  test("multi-line code with tab characters and custom tab size", () => {
    /* eslint-disable */
    const rootContainer = {
      content: [`const a
\t= 42;`],
      isDecoration: false,
      language: undefined,
    };
    /* eslint-enable */
    const root = processCode(rootContainer, [], 4);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 9,
      height: 2,
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 4, y: 1, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 6, y: 1, text: "42", height: 1, width: 2, prev: content[2], next: content[4], parent: root },
      { x: 8, y: 1, text: ";", height: 1, width: 1, prev: content[3], next: undefined, parent: root },
      /* eslint-enable */
    ]);
  });

  test("boxes", () => {
    const rootContainer = {
      content: [
        "const ",
        {
          content: ["a = 42;"],
          isDecoration: false,
          language: undefined,
        },
      ],
      isDecoration: false,
      language: "javascript",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toEqual({
      data: {},
      language: "javascript",
      x: 0,
      y: 0,
      width: 13,
      height: 1,
      content: expect.any(Array),
      decorations: [],
      parent: undefined,
    });
    const content = root.content;
    const txt = content[0] as TextToken;
    const box = content[1] as Box<TextToken, never>;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: box.content[0],
      parent: root,
    });
    expect(box).toEqual({
      data: {},
      language: "javascript",
      x: 6,
      y: 0,
      width: 7,
      height: 1,
      content: expect.any(Array),
      decorations: [],
      parent: root,
    });
    expect(box.content).toEqual([
      /* eslint-disable */
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: txt, next: box.content[1], parent: box },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: box.content[0], next: box.content[2], parent: box },
      { x: 10, y: 0, text: "42", height: 1, width: 2, prev: box.content[1], next: box.content[3], parent: box },
      { x: 12, y: 0, text: ";", height: 1, width: 1, prev: box.content[2], next: undefined, parent: box },
      /* eslint-enable */
    ]);
  });

  test("empty boxes", () => {
    const rootContainer = {
      content: [
        "a",
        {
          content: [],
          isDecoration: false,
          language: undefined,
        },
        ";",
      ],
      isDecoration: false,
      language: "javascript",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toEqual({
      data: {},
      language: "javascript",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      content: expect.any(Array),
      decorations: [],
      parent: undefined,
    });
    const content = root.content;
    const txt1 = content[0] as TextToken;
    const box = content[1] as Box<TextToken, never>;
    const txt2 = content[2] as TextToken;
    expect(txt1).toEqual({
      x: 0,
      y: 0,
      text: "a",
      width: 1,
      height: 1,
      prev: undefined,
      next: txt2,
      parent: root,
    });
    expect(box).toEqual({
      data: {},
      language: "javascript",
      x: 1,
      y: 0,
      width: 0,
      height: 1,
      content: [],
      decorations: [],
      parent: root,
    });
    expect(txt2).toEqual({
      x: 1,
      y: 0,
      text: ";",
      width: 1,
      height: 1,
      prev: txt1,
      next: undefined,
      parent: root,
    });
  });

  test("tiny boxes that do not introduce a new maxX value", () => {
    const rootContainer = {
      content: [
        "const ",
        {
          content: ["a"],
          isDecoration: false,
          language: undefined,
        },
        " = 42;",
      ],
      isDecoration: false,
      language: "javascript",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toEqual({
      data: {},
      language: "javascript",
      x: 0,
      y: 0,
      width: 13,
      height: 1,
      content: expect.any(Array),
      decorations: [],
      parent: undefined,
    });
    const content = root.content;
    const box = content[1] as Box<TextToken, never>;
    expect(box).toEqual({
      data: {},
      language: "javascript",
      x: 6,
      y: 0,
      width: 1,
      height: 1,
      content: [
        {
          x: 6,
          y: 0,
          text: "a",
          width: 1,
          height: 1,
          prev: content[0],
          next: content[2],
          parent: box,
        },
      ],
      decorations: [],
      parent: root,
    });
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: box.content[0], parent: root },
      box,
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: box.content[0], next: content[3], parent: root },
      { x: 10, y: 0, text: "42", height: 1, width: 2, prev: content[2], next: content[4], parent: root },
      { x: 12, y: 0, text: ";", height: 1, width: 1, prev: content[3], next: undefined, parent: root },
      /* eslint-enable */
    ]);
  });

  test("boxes with content in one string equal boxes made up of chunks", () => {
    const aBox = {
      content: ["a = 42;"],
      isDecoration: false,
      language: undefined,
    };
    const bBox = {
      content: ["a", " = ", "42;"],
      isDecoration: false,
      language: undefined,
    };
    const aRoot = processCode(
      {
        content: ["const ", aBox],
        isDecoration: false,
        language: "javascript",
      },
      [],
      2
    );
    const bRoot = processCode(
      {
        content: ["const ", bBox],
        isDecoration: false,
        language: "javascript",
      },
      [],
      2
    );
    expect(aRoot).toEqual(bRoot);
  });

  test("multi-line boxes", () => {
    const rootContainer = {
      content: [
        "const \n",
        {
          content: [
            `a =
  42;`,
          ],
          isDecoration: false,
          language: undefined,
        },
      ],
      isDecoration: false,
      language: "javascript",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 6, // Should really be 5, the space after "const" should not count
      height: 3,
      decorations: [],
    });
    const content = root.content;
    const txt = content[0] as TextToken;
    const box = content[1] as Box<TextToken, never>;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: box.content[0],
      parent: root,
    });
    expect(box).toMatchObject({
      x: 0,
      y: 1,
      width: 5,
      height: 2,
      decorations: [],
    });
    expect(box.content).toEqual([
      /* eslint-disable */
      { x: 0, y: 1, text: "a", height: 1, width: 1, prev: txt, next: box.content[1], parent: box },
      { x: 2, y: 1, text: "=", height: 1, width: 1, prev: box.content[0], next: box.content[2], parent: box },
      { x: 2, y: 2, text: "42", height: 1, width: 2, prev: box.content[1], next: box.content[3], parent: box },
      { x: 4, y: 2, text: ";", height: 1, width: 1, prev: box.content[2], next: undefined, parent: box },
      /* eslint-enable */
    ]);
  });

  test("token offsets in boxes with line breaks", () => {
    const rootContainer = {
      content: [
        "const ",
        {
          content: [
            `a = [
  42
]`,
          ],
          isDecoration: false,
          language: undefined,
        },
        ";",
      ],
      isDecoration: false,
      language: "javascript",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 11,
      height: 3,
      decorations: [],
    });
    const content = root.content;
    const first = content[0] as TextToken;
    const box = content[1] as Box<TextToken, never>;
    const last = content[content.length - 1] as TextToken;
    expect(first).toEqual({
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: box.content[0],
      parent: root,
    });
    expect(box).toMatchObject({
      x: 6,
      y: 0,
      width: 5,
      height: 3,
      decorations: [],
    });
    expect(box.content).toEqual([
      /* eslint-disable */
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: first, next: box.content[1], parent: box },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: box.content[0], next: box.content[2], parent: box },
      { x: 10, y: 0, text: "[", height: 1, width: 1, prev: box.content[1], next: box.content[3], parent: box },
      { x: 2, y: 1, text: "42", height: 1, width: 2, prev: box.content[2], next: box.content[4], parent: box },
      { x: 0, y: 2, text: "]", height: 1, width: 1, prev: box.content[3], next: last, parent: box },
      /* eslint-enable */
    ]);
    expect(last).toEqual({
      x: 1,
      y: 2,
      text: ";",
      width: 1,
      height: 1,
      prev: box.content[4],
      next: undefined,
      parent: root,
    });
  });

  test("nested boxes", () => {
    const rootContainer = {
      content: [
        "const ",
        {
          content: [
            "a = () => ",
            {
              content: [`{ return 42; }`],
              isDecoration: false,
              language: undefined,
            },
          ],
          isDecoration: false,
          language: undefined,
        },
      ],
      isDecoration: false,
      language: "javascript",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 30,
      height: 1,
      parent: undefined,
      decorations: [],
    });
    const content = root.content;
    const txt = content[0] as TextToken;
    const box1 = content[1] as Box<TextToken, never>;
    const box2 = box1.content[6] as Box<TextToken, never>;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: box1.content[0],
      parent: root,
    });
    expect(box1).toMatchObject({
      x: 6,
      y: 0,
      width: 24,
      height: 1,
      parent: root,
      decorations: [],
    });
    expect(box1.content).toEqual([
      /* eslint-disable */
      { x: 6, y: 0, text: "a", height: 1, width: 1, next: box1.content[1], prev: txt, parent: box1, },
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: box1.content[2], prev: box1.content[0], parent: box1, },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: box1.content[3], prev: box1.content[1], parent: box1, },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: box1.content[4], prev: box1.content[2], parent: box1, },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: box1.content[5], prev: box1.content[3], parent: box1, },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: box2.content[0], prev: box1.content[4], parent: box1, },
      box2,
      /* eslint-enable */
    ]);
    expect(box2).toMatchObject({
      x: 16,
      y: 0,
      width: 14,
      height: 1,
      parent: box1,
      decorations: [],
    });
    expect(box2.content).toEqual([
      /* eslint-disable */
      { x: 16, y: 0, text: "{", height: 1, width: 1, next: box2.content[1], prev: box1.content[5], parent: box2 },
      { x: 18, y: 0, text: "return", height: 1, width: 6, next: box2.content[2], prev: box2.content[0], parent: box2 },
      { x: 25, y: 0, text: "42", height: 1, width: 2, next: box2.content[3], prev: box2.content[1], parent: box2 },
      { x: 27, y: 0, text: ";", height: 1, width: 1, next: box2.content[4], prev: box2.content[2], parent: box2 },
      { x: 29, y: 0, text: "}", height: 1, width: 1, next: undefined, prev: box2.content[3], parent: box2 },
      /* eslint-enable */
    ]);
  });

  test("content in nested boxes", () => {
    const rootContainer = {
      content: [
        {
          content: [
            {
              content: ["let x = 42"],
              isDecoration: false,
              language: undefined,
            },
          ],
          isDecoration: false,
          language: undefined,
        },
      ],
      isDecoration: false,
      language: "javascript",
    };
    const root = processCode(rootContainer, [], 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 10,
      height: 1,
      decorations: [],
    });
    const contentBox = (root as any).content[0].content[0];
    expect(root.content).toEqual([
      {
        x: 0,
        y: 0,
        width: 10,
        height: 1,
        language: "javascript",
        data: {},
        parent: root,
        content: [
          {
            x: 0,
            y: 0,
            width: 10,
            height: 1,
            language: "javascript",
            data: {},
            parent: root.content[0],
            content: [
              /* eslint-disable */
              { x: 0, y: 0, text: "let", height: 1, width: 3, next: contentBox.content[1], prev: undefined, parent: contentBox },
              { x: 4, y: 0, text: "x", height: 1, width: 1, next: contentBox.content[2], prev: contentBox.content[0], parent: contentBox },
              { x: 6, y: 0, text: "=", height: 1, width: 1, next: contentBox.content[3], prev: contentBox.content[1], parent: contentBox },
              { x: 8, y: 0, text: "42", height: 1, width: 2, next: undefined, prev: contentBox.content[2], parent: contentBox },
              /* eslint-enable */
            ],
            decorations: [],
          },
        ],
        decorations: [],
      },
    ]);
  });

  test("decoration boxes", () => {
    const rootContainer: CodeContainer = {
      content: [
        "const a = () => ",
        {
          content: ["42"],
          data: {},
          isDecoration: true,
          language: undefined,
        },
      ],
      data: {},
      isDecoration: false,
      language: undefined,
    };
    const root = processCode(rootContainer, [], 2);
    const { content, decorations } = root;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, next: content[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, next: content[2], prev: content[0], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: content[3], prev: content[1], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: content[4], prev: content[2], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: content[5], prev: content[3], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: content[6], prev: content[4], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: content[7], prev: content[5], parent: root },
      { x: 16, y: 0, text: "42", height: 1, width: 2, next: undefined, prev: content[6], parent: root },
      /* eslint-enable */
    ]);
    expect(decorations).toEqual([
      {
        x: 16,
        y: 0,
        width: 2,
        height: 1,
        data: {},
        parent: root,
      },
    ]);
  });

  test("external decorations", () => {
    const rootContainer: CodeContainer = {
      content: ["const a = () => 42"],
      data: {},
      isDecoration: false,
      language: undefined,
    };
    const root = processCode(
      rootContainer,
      [{ x: 16, y: 0, width: 2, height: 1, data: { test: "42" } }],
      2
    );
    const { content, decorations } = root;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, next: content[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, next: content[2], prev: content[0], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: content[3], prev: content[1], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: content[4], prev: content[2], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: content[5], prev: content[3], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: content[6], prev: content[4], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: content[7], prev: content[5], parent: root },
      { x: 16, y: 0, text: "42", height: 1, width: 2, next: undefined, prev: content[6], parent: root },
      /* eslint-enable */
    ]);
    expect(decorations).toEqual([
      {
        x: 16,
        y: 0,
        width: 2,
        height: 1,
        data: {
          test: "42",
        },
        parent: root,
      },
    ]);
  });

  test("decoration boxes plus external decorations", () => {
    const rootContainer: CodeContainer = {
      content: [
        "const a = () => ",
        {
          content: ["42"],
          data: {},
          isDecoration: true,
          language: undefined,
        },
      ],
      data: {},
      isDecoration: false,
      language: undefined,
    };
    const root = processCode(
      rootContainer,
      [{ x: 0, y: 0, width: 5, height: 1, data: { test: "23" } }],
      2
    );
    const { content, decorations } = root;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, next: content[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, next: content[2], prev: content[0], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: content[3], prev: content[1], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: content[4], prev: content[2], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: content[5], prev: content[3], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: content[6], prev: content[4], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: content[7], prev: content[5], parent: root },
      { x: 16, y: 0, text: "42", height: 1, width: 2, next: undefined, prev: content[6], parent: root },
      /* eslint-enable */
    ]);
    expect(decorations).toEqual([
      {
        x: 16,
        y: 0,
        width: 2,
        height: 1,
        data: {},
        parent: root,
      },
      {
        x: 0,
        y: 0,
        width: 5,
        height: 1,
        data: {
          test: "23",
        },
        parent: root,
      },
    ]);
  });
});
