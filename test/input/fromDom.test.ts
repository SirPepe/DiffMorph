import { processCode } from "../../src/input/fromDom";
import { Box, TextToken } from "../../src/types";

describe("processing code from a DOM source", () => {
  const container = document.createElement("pre");

  test("copying attributes from the source element", () => {
    container.setAttribute("foo", "bar");
    const root = processCode(container);
    expect(root).toMatchObject({
      data: {
        attributes: [["foo", "bar"]],
        tagName: "pre",
      },
    });
    container.removeAttribute("foo");
  });

  test("splitting an element's text content", () => {
    container.innerHTML = "const a = () => 42";
    const root = processCode(container);
    expect(root).toEqual({
      kind: "BOX",
      x: 0,
      y: 0,
      width: 18,
      height: 1,
      data: {
        attributes: [],
        tagName: "pre",
      },
      hash: expect.any(String),
      id: root.hash + "0",
      tokens: expect.any(Array),
      parent: undefined,
    });
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { kind: "TEXT", x: 0, y: 0, text: "const", height: 1, width: 5, next: tokens[1], prev: undefined, parent: root },
      { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, next: tokens[2], prev: tokens[0], parent: root },
      { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, next: tokens[3], prev: tokens[1], parent: root },
      { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, next: tokens[4], prev: tokens[2], parent: root },
      { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, next: tokens[5], prev: tokens[3], parent: root },
      { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, next: tokens[6], prev: tokens[4], parent: root },
      { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, next: tokens[7], prev: tokens[5], parent: root },
      { kind: "TEXT", x: 16, y: 0, text: "42", height: 1, width: 2, next: undefined, prev: tokens[6], parent: root },
      /* eslint-enable */
    ]);
  });

  test("splitting multi-line code", () => {
    container.innerHTML = `const a = () => {
  return 42;
};`;
    const root = processCode(container);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 17,
      height: 3,
    });
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { kind: "TEXT", x: 0, y: 0, text: "const", height: 1, width: 5, next: tokens[1], prev: undefined, parent: root },
      { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, next: tokens[2], prev: tokens[0], parent: root },
      { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, next: tokens[3], prev: tokens[1], parent: root },
      { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, next: tokens[4], prev: tokens[2], parent: root },
      { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, next: tokens[5], prev: tokens[3], parent: root },
      { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, next: tokens[6], prev: tokens[4], parent: root },
      { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, next: tokens[7], prev: tokens[5], parent: root },
      { kind: "TEXT", x: 16, y: 0, text: "{", height: 1, width: 1, next: tokens[8], prev: tokens[6], parent: root },
      { kind: "TEXT", x: 2, y: 1, text: "return", height: 1, width: 6, next: tokens[9], prev: tokens[7], parent: root },
      { kind: "TEXT", x: 9, y: 1, text: "42", height: 1, width: 2, next: tokens[10], prev: tokens[8], parent: root },
      { kind: "TEXT", x: 11, y: 1, text: ";", height: 1, width: 1, next: tokens[11], prev: tokens[9], parent: root },
      { kind: "TEXT", x: 0, y: 2, text: "}", height: 1, width: 1, next: tokens[12], prev: tokens[10], parent: root },
      { kind: "TEXT", x: 1, y: 2, text: ";", height: 1, width: 1, next: tokens[13], prev: tokens[11], parent: root },
      /* eslint-enable */
    ]);
  });

  test("boxes", () => {
    container.innerHTML = "const <span foo='bar'>a</span> = () => 42";
    const root = processCode(container);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 18,
      height: 1,
    });
    const [txt, box, ...rest] = root.tokens as [
      TextToken,
      Box<TextToken>,
      ...TextToken[]
    ];
    expect(txt).toEqual({
      kind: "TEXT",
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: box.tokens[0],
      parent: root,
    });
    expect(box).toEqual({
      kind: "BOX",
      x: 6,
      y: 0,
      width: 1,
      height: 1,
      language: root.language,
      data: {
        tagName: "span",
        attributes: [["foo", "bar"]],
      },
      hash: expect.any(String),
      id: box.hash + "0",
      tokens: [
        {
          kind: "TEXT",
          x: 6,
          y: 0,
          text: "a",
          width: 1,
          height: 1,
          next: rest[0],
          prev: txt,
          parent: box,
        },
      ],
      parent: root,
    });
    expect(rest).toEqual([
      /* eslint-disable */
      { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, next: rest[1], prev: box.tokens[0], parent: root },
      { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, next: rest[2], prev: rest[0], parent: root },
      { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, next: rest[3], prev: rest[1], parent: root },
      { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, next: rest[4], prev: rest[2], parent: root },
      { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, next: rest[5], prev: rest[3], parent: root },
      { kind: "TEXT", x: 16, y: 0, text: "42", height: 1, width: 2, next: undefined, prev: rest[4], parent: root },
      /* eslint-enable */
    ]);
  });

  test("it handles multi-line boxes", () => {
    container.innerHTML = `const a = () => <span class="a">{
  return 42;
}</span>;`;
    const root = processCode(container);
    const textTokens = root.tokens.slice(0, 7);
    const box = root.tokens[7] as Box<TextToken>;
    expect(textTokens).toEqual([
      /* eslint-disable */
      { kind: "TEXT", x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: textTokens[1], parent: root },
      { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, prev: textTokens[0], next: textTokens[2], parent: root },
      { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, prev: textTokens[1], next: textTokens[3], parent: root },
      { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, prev: textTokens[2], next: textTokens[4], parent: root },
      { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, prev: textTokens[3], next: textTokens[5], parent: root },
      { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, prev: textTokens[4], next: textTokens[6], parent: root },
      { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, prev: textTokens[5], next: box.tokens[0], parent: root },
      /* eslint-enable */
    ]);
    expect(box).toEqual({
      kind: "BOX",
      x: 16,
      y: 0,
      width: 1,
      height: 3,
      language: root.language,
      data: {
        tagName: "span",
        attributes: [["class", "a"]],
      },
      hash: expect.any(String),
      id: box.hash + "0",
      tokens: [
        /* eslint-disable */
        { kind: "TEXT", x: 16, y: 0, text: "{", height: 1, width: 1, next: box.tokens[1], prev: textTokens[6], parent: box },
        { kind: "TEXT", x: 2, y: 1, text: "return", height: 1, width: 6, next: box.tokens[2], prev: box.tokens[0], parent: box },
        { kind: "TEXT", x: 9, y: 1, text: "42", height: 1, width: 2, next: box.tokens[3], prev: box.tokens[1], parent: box },
        { kind: "TEXT", x: 11, y: 1, text: ";", height: 1, width: 1, next: box.tokens[4], prev: box.tokens[2], parent: box },
        { kind: "TEXT", x: 0, y: 2, text: "}", height: 1, width: 1, next: expect.any(Object), prev: box.tokens[3], parent: box },
        /* eslint-enable */
      ],
      parent: root,
    });
  });

  test("it handles boxes inside boxes", () => {
    container.innerHTML = "const <span foo='bar'>a = <b>()</b> => 42</span>";
    const root = processCode(container);
    const tokens = root.tokens;
    const firstToken = tokens[0] as TextToken;
    const outerBox = tokens[1] as Box<TextToken>;
    const innerBox = outerBox.tokens[2] as Box<TextToken>;
    expect(firstToken).toEqual({
      kind: "TEXT",
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: outerBox.tokens[0],
      parent: root,
    });
    expect(outerBox).toEqual({
      kind: "BOX",
      x: 6,
      y: 0,
      width: 12,
      height: 1,
      language: root.language,
      data: {
        tagName: "span",
        attributes: [["foo", "bar"]],
      },
      hash: expect.any(String),
      id: expect.any(String),
      tokens: [
        /* eslint-disable */
        { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, prev: firstToken, next: outerBox.tokens[1], parent: outerBox },
        { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, prev: outerBox.tokens[0], next: innerBox.tokens[0], parent: outerBox },
        innerBox,
        { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, prev: innerBox.tokens[1], next: outerBox.tokens[4], parent: outerBox },
        { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, prev: outerBox.tokens[3], next: outerBox.tokens[5], parent: outerBox },
        { kind: "TEXT", x: 16, y: 0, text: "42", height: 1, width: 2, prev: outerBox.tokens[4], next: undefined, parent: outerBox },
        /* eslint-enable */
      ],
      parent: root,
    });
    expect(innerBox).toEqual({
      kind: "BOX",
      x: 10,
      y: 0,
      width: 2,
      height: 1,
      language: root.language,
      data: {
        tagName: "b",
        attributes: [],
      },
      hash: expect.any(String),
      id: expect.any(String),
      tokens: [
        /* eslint-disable */
        { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, prev: outerBox.tokens[1], next: innerBox.tokens[1], parent: innerBox },
        { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, prev: innerBox.tokens[0], next: outerBox.tokens[3], parent: innerBox },
        /* eslint-enable */
      ],
      parent: outerBox,
    });
  });

  test("it handles multi-line boxes inside multi-line boxes", () => {
    container.innerHTML = `const <span foo='bar'>a = <b>(
  x
)</b> => [
  x
]</span>;`;
    const root = processCode(container);
    const firstToken = root.tokens[0] as TextToken;
    const outerBox = root.tokens[1] as Box<TextToken>;
    const innerBox = outerBox.tokens[2] as Box<TextToken>;
    const lastToken = root.tokens[2] as TextToken;
    expect(firstToken).toEqual({
      kind: "TEXT",
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: outerBox.tokens[0],
      parent: root,
    });
    expect(outerBox).toEqual({
      kind: "BOX",
      x: 6,
      y: 0,
      width: 5,
      height: 5,
      language: root.language,
      data: {
        tagName: "span",
        attributes: [["foo", "bar"]],
      },
      hash: expect.any(String),
      id: expect.any(String),
      tokens: [
        /* eslint-disable */
        { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, prev: firstToken, next: outerBox.tokens[1], parent: outerBox },
        { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, prev: outerBox.tokens[0], next: innerBox.tokens[0], parent: outerBox },
        innerBox,
        { kind: "TEXT", x: 2, y: 2, text: "=", height: 1, width: 1, prev: innerBox.tokens[2], next: outerBox.tokens[4], parent: outerBox },
        { kind: "TEXT", x: 3, y: 2, text: ">", height: 1, width: 1, prev: outerBox.tokens[3], next: outerBox.tokens[5], parent: outerBox },
        { kind: "TEXT", x: 5, y: 2, text: "[", height: 1, width: 1, prev: outerBox.tokens[4], next: outerBox.tokens[6], parent: outerBox },
        { kind: "TEXT", x: 2, y: 3, text: "x", height: 1, width: 1, prev: outerBox.tokens[5], next: outerBox.tokens[7], parent: outerBox },
        { kind: "TEXT", x: 0, y: 4, text: "]", height: 1, width: 1, prev: outerBox.tokens[6], next: lastToken, parent: outerBox },
        /* eslint-enable */
      ],
      parent: root,
    });
    expect(innerBox).toEqual({
      x: 10,
      y: 0,
      width: 1,
      height: 3,
      kind: "BOX",
      language: root.language,
      data: {
        tagName: "b",
        attributes: [],
      },
      hash: expect.any(String),
      id: expect.any(String),
      tokens: [
        /* eslint-disable */
        { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, prev: outerBox.tokens[1], next: innerBox.tokens[1], parent: innerBox },
        { kind: "TEXT", x: 2, y: 1, text: "x", height: 1, width: 1, prev: innerBox.tokens[0], next: innerBox.tokens[2], parent: innerBox },
        { kind: "TEXT", x: 0, y: 2, text: ")", height: 1, width: 1, prev: innerBox.tokens[1], next: outerBox.tokens[3], parent: innerBox },
        /* eslint-enable */
      ],
      parent: outerBox,
    });
    expect(lastToken).toEqual({
      kind: "TEXT",
      x: 1,
      y: 4,
      text: ";",
      width: 1,
      height: 1,
      prev: outerBox.tokens[7],
      next: undefined,
      parent: root,
    });
  });

  test("it handles decorations", () => {
    container.innerHTML = "const a = () => <mark>42</mark>";
    const root = processCode(container);
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { kind: "TEXT", x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: tokens[1], parent: root },
      { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, prev: tokens[0], next: tokens[2], parent: root },
      { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, prev: tokens[1], next: tokens[3], parent: root },
      { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, prev: tokens[2], next: tokens[4], parent: root },
      { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, prev: tokens[3], next: tokens[5], parent: root },
      { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, prev: tokens[4], next: tokens[6], parent: root },
      { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, prev: tokens[5], next: tokens[7], parent: root },
      { kind: "TEXT", x: 16, y: 0, text: "42", height: 1, width: 2, prev: tokens[6], next: undefined, parent: root },
      {
        kind: "DECO",
        x: 16,
        y: 0,
        width: 2,
        height: 1,
        data: {
          tagName: "mark",
          attributes: [],
        },
        hash: expect.any(String),
        parent: root,
      },
      /* eslint-enable */
    ]);
  });

  test("it handles multiple decorations", () => {
    container.innerHTML =
      "const <mark class='a'>a</mark> = () => <mark class='b'>42</mark>";
    const root = processCode(container);
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { kind: "TEXT", x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: tokens[1], parent: root },
      { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, prev: tokens[0], next: tokens[3], parent: root },
      {
        kind: "DECO",
        x: 6,
        y: 0,
        width: 1,
        height: 1,
        data: {
          tagName: "mark",
          attributes: [["class", "a"]],
        },
        hash: expect.any(String),
        parent: root,
      },
      { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, prev: tokens[1], next: tokens[4], parent: root },
      { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, prev: tokens[3], next: tokens[5], parent: root },
      { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, prev: tokens[4], next: tokens[6], parent: root },
      { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, prev: tokens[5], next: tokens[7], parent: root },
      { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, prev: tokens[6], next: tokens[8], parent: root },
      { kind: "TEXT", x: 16, y: 0, text: "42", height: 1, width: 2, prev: tokens[7], next: undefined, parent: root },
      {
        kind: "DECO",
        x: 16,
        y: 0,
        width: 2,
        height: 1,
        data: {
          tagName: "mark",
          attributes: [["class", "b"]],
        },
        hash: expect.any(String),
        parent: root,
      },
      /* eslint-enable */
    ]);
  });

  test("it handles multi-line decorations", () => {
    container.innerHTML = `const a = () => <mark>{
  return 42;
}</mark>`;
    const root = processCode(container);
    const tokens = root.tokens;
    expect(tokens).toEqual([
      /* eslint-disable */
      { kind: "TEXT", x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: tokens[1], parent: root },
      { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, prev: tokens[0], next: tokens[2], parent: root },
      { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, prev: tokens[1], next: tokens[3], parent: root },
      { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, prev: tokens[2], next: tokens[4], parent: root },
      { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, prev: tokens[3], next: tokens[5], parent: root },
      { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, prev: tokens[4], next: tokens[6], parent: root },
      { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, prev: tokens[5], next: tokens[7], parent: root },
      { kind: "TEXT", x: 16, y: 0, text: "{", height: 1, width: 1, prev: tokens[6], next: tokens[8], parent: root },
      { kind: "TEXT", x: 2, y: 1, text: "return", height: 1, width: 6, prev: tokens[7], next: tokens[9], parent: root },
      { kind: "TEXT", x: 9, y: 1, text: "42", height: 1, width: 2, prev: tokens[8], next: tokens[10], parent: root },
      { kind: "TEXT", x: 11, y: 1, text: ";", height: 1, width: 1, prev: tokens[9], next: tokens[11], parent: root },
      { kind: "TEXT", x: 0, y: 2, text: "}", height: 1, width: 1, prev: tokens[10], next: undefined, parent: root },
      {
        kind: "DECO",
        x: 16,
        y: 0,
        width: 1,
        height: 3,
        data: {
          tagName: "mark",
          attributes: [],
        },
        hash: expect.any(String),
        parent: root,
      },
      /* eslint-enable */
    ]);
  });

  test("it handles decorations in boxes inside boxes", () => {
    container.innerHTML =
      "const <span foo='bar'>a = <b><mark>()</mark></b> => 42</span>";
    const root = processCode(container);
    const firstToken = root.tokens[0] as TextToken;
    const outerBox = root.tokens[1] as Box<TextToken>;
    const innerBox = outerBox.tokens[2] as Box<TextToken>;
    expect(firstToken).toEqual({
      kind: "TEXT",
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: outerBox.tokens[0],
      parent: root,
    });
    expect(outerBox).toEqual({
      kind: "BOX",
      x: 6,
      y: 0,
      width: 12,
      height: 1,
      language: root.language,
      data: {
        tagName: "span",
        attributes: [["foo", "bar"]],
      },
      hash: expect.any(String),
      id: expect.any(String),
      tokens: [
        /* eslint-disable */
        { kind: "TEXT", x: 6, y: 0, text: "a", height: 1, width: 1, prev: firstToken, next: outerBox.tokens[1], parent: outerBox },
        { kind: "TEXT", x: 8, y: 0, text: "=", height: 1, width: 1, prev: outerBox.tokens[0], next: innerBox.tokens[0], parent: outerBox },
        innerBox,
        { kind: "TEXT", x: 13, y: 0, text: "=", height: 1, width: 1, prev: innerBox.tokens[1], next: outerBox.tokens[4], parent: outerBox },
        { kind: "TEXT", x: 14, y: 0, text: ">", height: 1, width: 1, prev: outerBox.tokens[3], next: outerBox.tokens[5], parent: outerBox },
        { kind: "TEXT", x: 16, y: 0, text: "42", height: 1, width: 2, prev: outerBox.tokens[4], next: undefined, parent: outerBox },
        /* eslint-enable */
      ],
      parent: root,
    });
    expect(innerBox).toEqual({
      kind: "BOX",
      x: 10,
      y: 0,
      width: 2,
      height: 1,
      language: root.language,
      data: {
        tagName: "b",
        attributes: [],
      },
      hash: expect.any(String),
      id: expect.any(String),
      tokens: [
        /* eslint-disable */
        { kind: "TEXT", x: 10, y: 0, text: "(", height: 1, width: 1, prev: outerBox.tokens[1], next: innerBox.tokens[1], parent: innerBox },
        { kind: "TEXT", x: 11, y: 0, text: ")", height: 1, width: 1, prev: innerBox.tokens[0], next: outerBox.tokens[3], parent: innerBox },
        {
          kind: "DECO",
          x: 10,
          y: 0,
          width: 2,
          height: 1,
          data: {
            tagName: "mark",
            attributes: [],
          },
          hash: expect.any(String),
          parent: innerBox,
        },
        /* eslint-enable */
      ],
      parent: outerBox,
    });
  });
});
