import { processCode } from "../../src/input/fromDom";
import { BoxToken, TextToken } from "../../src/types";

describe("processing code from a DOM source", () => {
  const container = document.createElement("pre");

  test("it splits code", () => {
    container.innerHTML = "const a = () => 42";
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", size: 5, next: tokens[1], prev: undefined },
      { x: 6, y: 0, text: "a", size: 1, next: tokens[2], prev: tokens[0] },
      { x: 8, y: 0, text: "=", size: 1, next: tokens[3], prev: tokens[1] },
      { x: 10, y: 0, text: "(", size: 1, next: tokens[4], prev: tokens[2] },
      { x: 11, y: 0, text: ")", size: 1, next: tokens[5], prev: tokens[3] },
      { x: 13, y: 0, text: "=", size: 1, next: tokens[6], prev: tokens[4] },
      { x: 14, y: 0, text: ">", size: 1, next: tokens[7], prev: tokens[5] },
      { x: 16, y: 0, text: "42", size: 2, next: undefined, prev: tokens[6] },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it splits multi-line code", () => {
    container.innerHTML = `const a = () => {
  return 42;
};`;
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", size: 5, next: tokens[1], prev: undefined },
      { x: 6, y: 0, text: "a", size: 1, next: tokens[2], prev: tokens[0] },
      { x: 8, y: 0, text: "=", size: 1, next: tokens[3], prev: tokens[1] },
      { x: 10, y: 0, text: "(", size: 1, next: tokens[4], prev: tokens[2] },
      { x: 11, y: 0, text: ")", size: 1, next: tokens[5], prev: tokens[3] },
      { x: 13, y: 0, text: "=", size: 1, next: tokens[6], prev: tokens[4] },
      { x: 14, y: 0, text: ">", size: 1, next: tokens[7], prev: tokens[5] },
      { x: 16, y: 0, text: "{", size: 1, next: tokens[8], prev: tokens[6] },
      { x: 2, y: 1, text: "return", size: 6, next: tokens[9], prev: tokens[7] },
      { x: 9, y: 1, text: "42", size: 2, next: tokens[10], prev: tokens[8] },
      { x: 11, y: 1, text: ";", size: 1, next: tokens[11], prev: tokens[9] },
      { x: 0, y: 2, text: "}", size: 1, next: tokens[12], prev: tokens[10] },
      { x: 1, y: 2, text: ";", size: 1, next: tokens[13], prev: tokens[11] },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles boxes", () => {
    container.innerHTML = "const <span foo='bar'>a = () => 42</span>";
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    const txt = tokens[0] as TextToken;
    const box = tokens[1] as BoxToken;
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      size: 5,
      prev: undefined,
      next: box.tokens[0],
    });
    expect(box).toMatchObject({
      meta: {
        tagName: "span",
        attributes: [["foo", "bar"]],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: expect.any(Array),
    });
    expect(box.tokens).toEqual([
      /* eslint-disable */
      { x: 6, y: 0, text: "a", size: 1, next: box.tokens[1], prev: txt },
      { x: 8, y: 0, text: "=", size: 1, next: box.tokens[2], prev: box.tokens[0] },
      { x: 10, y: 0, text: "(", size: 1, next: box.tokens[3], prev: box.tokens[1] },
      { x: 11, y: 0, text: ")", size: 1, next: box.tokens[4], prev: box.tokens[2] },
      { x: 13, y: 0, text: "=", size: 1, next: box.tokens[5], prev: box.tokens[3] },
      { x: 14, y: 0, text: ">", size: 1, next: box.tokens[6], prev: box.tokens[4] },
      { x: 16, y: 0, text: "42", size: 2, next: undefined, prev: box.tokens[5] },
      /* eslint-enable */
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles boxes in the middle of code", () => {
    container.innerHTML = "const <span foo='bar'>a</span> = () => 42";
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    const [txt, box, ...rest] = tokens as [TextToken, BoxToken, ...TextToken[]];
    expect(txt).toEqual({
      x: 0,
      y: 0,
      text: "const",
      size: 5,
      prev: undefined,
      next: box.tokens[0],
    });
    expect(box).toMatchObject({
      meta: {
        tagName: "span",
        attributes: [["foo", "bar"]],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [{ x: 6, y: 0, text: "a", size: 1, next: rest[0], prev: txt }],
    });
    expect(rest).toEqual([
      { x: 8, y: 0, text: "=", size: 1, next: rest[1], prev: box.tokens[0] },
      { x: 10, y: 0, text: "(", size: 1, next: rest[2], prev: rest[0] },
      { x: 11, y: 0, text: ")", size: 1, next: rest[3], prev: rest[1] },
      { x: 13, y: 0, text: "=", size: 1, next: rest[4], prev: rest[2] },
      { x: 14, y: 0, text: ">", size: 1, next: rest[5], prev: rest[3] },
      { x: 16, y: 0, text: "42", size: 2, next: undefined, prev: rest[4] },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles multi-line boxes", () => {
    container.innerHTML = `const a = () => <span class="a">{
  return 42;
}</span>;`;
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    const textTokens = tokens.slice(0, 7);
    const box = tokens[7] as BoxToken;
    expect(textTokens).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", size: 5, prev: undefined, next: textTokens[1] },
      { x: 6, y: 0, text: "a", size: 1, prev: textTokens[0], next: textTokens[2] },
      { x: 8, y: 0, text: "=", size: 1, prev: textTokens[1], next: textTokens[3] },
      { x: 10, y: 0, text: "(", size: 1, prev: textTokens[2], next: textTokens[4] },
      { x: 11, y: 0, text: ")", size: 1, prev: textTokens[3], next: textTokens[5] },
      { x: 13, y: 0, text: "=", size: 1, prev: textTokens[4], next: textTokens[6] },
      { x: 14, y: 0, text: ">", size: 1, prev: textTokens[5], next: box.tokens[0] },
      /* eslint-enable */
    ]);
    expect(box).toMatchObject({
      meta: {
        tagName: "span",
        attributes: [["class", "a"]],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [
        /* eslint-disable */
        { x: 16, y: 0, text: "{", size: 1, next: box.tokens[1], prev: textTokens[6] },
        { x: 2, y: 1, text: "return", size: 6, next: box.tokens[2], prev: box.tokens[0] },
        { x: 9, y: 1, text: "42", size: 2, next: box.tokens[3], prev: box.tokens[1] },
        { x: 11, y: 1, text: ";", size: 1, next: box.tokens[4], prev: box.tokens[2] },
        { x: 0, y: 2, text: "}", size: 1, next: expect.any(Object), prev: box.tokens[3] },
        /* eslint-enable */
      ],
    });
    expect(highlights).toEqual([]);
  });

  test("it handles boxes inside boxes", () => {
    container.innerHTML = "const <span foo='bar'>a = <b>()</b> => 42</span>";
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    const firstToken = tokens[0] as TextToken;
    const outerBox = tokens[1] as BoxToken;
    const innerBox = outerBox.tokens[2] as BoxToken;
    expect(firstToken).toEqual({
      x: 0,
      y: 0,
      text: "const",
      size: 5,
      prev: undefined,
      next: outerBox.tokens[0],
    });
    expect(outerBox).toEqual({
      meta: {
        tagName: "span",
        attributes: [["foo", "bar"]],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [
        /* eslint-disable */
        { x: 6, y: 0, text: "a", size: 1, prev: firstToken, next: outerBox.tokens[1] },
        { x: 8, y: 0, text: "=", size: 1, prev: outerBox.tokens[0], next: innerBox.tokens[0] },
        innerBox,
        { x: 13, y: 0, text: "=", size: 1, prev: innerBox.tokens[1], next: outerBox.tokens[4] },
        { x: 14, y: 0, text: ">", size: 1, prev: outerBox.tokens[3], next: outerBox.tokens[5] },
        { x: 16, y: 0, text: "42", size: 2, prev: outerBox.tokens[4], next: undefined },
        /* eslint-enable */
      ],
    });
    expect(innerBox).toEqual({
      meta: {
        tagName: "b",
        attributes: [],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [
        /* eslint-disable */
        { x: 10, y: 0, text: "(", size: 1, prev: outerBox.tokens[1], next: innerBox.tokens[1] },
        { x: 11, y: 0, text: ")", size: 1, prev: innerBox.tokens[0], next: outerBox.tokens[3] },
        /* eslint-enable */
      ],
    });
    expect(highlights).toEqual([]);
  });

  test("it handles multi-line boxes inside multi-line boxes", () => {
    container.innerHTML = `const <span foo='bar'>a = <b>(
  x
)</b> => [
  x
]</span>;`;
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    const firstToken = tokens[0] as TextToken;
    const outerBox = tokens[1] as BoxToken;
    const innerBox = outerBox.tokens[2] as BoxToken;
    const lastToken = tokens[2] as TextToken;
    expect(firstToken).toEqual({
      x: 0,
      y: 0,
      text: "const",
      size: 5,
      prev: undefined,
      next: outerBox.tokens[0],
    });
    expect(outerBox).toEqual({
      meta: {
        tagName: "span",
        attributes: [["foo", "bar"]],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [
        /* eslint-disable */
        { x: 6, y: 0, text: "a", size: 1, prev: firstToken, next: outerBox.tokens[1] },
        { x: 8, y: 0, text: "=", size: 1, prev: outerBox.tokens[0], next: innerBox.tokens[0] },
        innerBox,
        { x: 2, y: 2, text: "=", size: 1, prev: innerBox.tokens[2], next: outerBox.tokens[4] },
        { x: 3, y: 2, text: ">", size: 1, prev: outerBox.tokens[3], next: outerBox.tokens[5] },
        { x: 5, y: 2, text: "[", size: 1, prev: outerBox.tokens[4], next: outerBox.tokens[6] },
        { x: 2, y: 3, text: "x", size: 1, prev: outerBox.tokens[5], next: outerBox.tokens[7] },
        { x: 0, y: 4, text: "]", size: 1, prev: outerBox.tokens[6], next: lastToken },
        /* eslint-enable */
      ],
    });
    expect(innerBox).toEqual({
      meta: {
        tagName: "b",
        attributes: [],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [
        /* eslint-disable */
        { x: 10, y: 0, text: "(", size: 1, prev: outerBox.tokens[1], next: innerBox.tokens[1] },
        { x: 2, y: 1, text: "x", size: 1, prev: innerBox.tokens[0], next: innerBox.tokens[2] },
        { x: 0, y: 2, text: ")", size: 1, prev: innerBox.tokens[1], next: outerBox.tokens[3] },
        /* eslint-enable */
      ],
    });
    expect(lastToken).toEqual({
      x: 1,
      y: 4,
      text: ";",
      size: 1,
      prev: outerBox.tokens[7],
      next: undefined,
    });
    expect(highlights).toEqual([]);
  });

  test("it handles highlights", () => {
    container.innerHTML = "const a = () => <mark>42</mark>";
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", size: 5, prev: undefined, next: tokens[1] },
      { x: 6, y: 0, text: "a", size: 1, prev: tokens[0], next: tokens[2] },
      { x: 8, y: 0, text: "=", size: 1, prev: tokens[1], next: tokens[3] },
      { x: 10, y: 0, text: "(", size: 1, prev: tokens[2], next: tokens[4] },
      { x: 11, y: 0, text: ")", size: 1, prev: tokens[3], next: tokens[5] },
      { x: 13, y: 0, text: "=", size: 1, prev: tokens[4], next: tokens[6] },
      { x: 14, y: 0, text: ">", size: 1, prev: tokens[5], next: tokens[7] },
      { x: 16, y: 0, text: "42", size: 2, prev: tokens[6], next: undefined },
    ]);
    expect(highlights).toEqual([
      {
        meta: {
          tagName: "mark",
          attributes: [],
          isHighlight: true,
        },
        hash: expect.any(String),
        start: [16, 0],
        end: [18, 0],
      },
    ]);
  });

  test("it handles multiple highlights", () => {
    container.innerHTML =
      "const <mark class='a'>a</mark> = () => <mark class='b'>42</mark>";
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", size: 5, prev: undefined, next: tokens[1] },
      { x: 6, y: 0, text: "a", size: 1, prev: tokens[0], next: tokens[2] },
      { x: 8, y: 0, text: "=", size: 1, prev: tokens[1], next: tokens[3] },
      { x: 10, y: 0, text: "(", size: 1, prev: tokens[2], next: tokens[4] },
      { x: 11, y: 0, text: ")", size: 1, prev: tokens[3], next: tokens[5] },
      { x: 13, y: 0, text: "=", size: 1, prev: tokens[4], next: tokens[6] },
      { x: 14, y: 0, text: ">", size: 1, prev: tokens[5], next: tokens[7] },
      { x: 16, y: 0, text: "42", size: 2, prev: tokens[6], next: undefined },
    ]);
    expect(highlights).toEqual([
      {
        meta: {
          tagName: "mark",
          attributes: [["class", "a"]],
          isHighlight: true,
        },
        hash: expect.any(String),
        start: [6, 0],
        end: [7, 0],
      },
      {
        meta: {
          tagName: "mark",
          attributes: [["class", "b"]],
          isHighlight: true,
        },
        hash: expect.any(String),
        start: [16, 0],
        end: [18, 0],
      },
    ]);
  });

  test("it handles multi-line highlights", () => {
    container.innerHTML = `const a = () => <mark>{
  return 42;
}</mark>`;
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const", size: 5, prev: undefined, next: tokens[1] },
      { x: 6, y: 0, text: "a", size: 1, prev: tokens[0], next: tokens[2] },
      { x: 8, y: 0, text: "=", size: 1, prev: tokens[1], next: tokens[3] },
      { x: 10, y: 0, text: "(", size: 1, prev: tokens[2], next: tokens[4] },
      { x: 11, y: 0, text: ")", size: 1, prev: tokens[3], next: tokens[5] },
      { x: 13, y: 0, text: "=", size: 1, prev: tokens[4], next: tokens[6] },
      { x: 14, y: 0, text: ">", size: 1, prev: tokens[5], next: tokens[7] },
      { x: 16, y: 0, text: "{", size: 1, prev: tokens[6], next: tokens[8] },
      { x: 2, y: 1, text: "return", size: 6, prev: tokens[7], next: tokens[9] },
      { x: 9, y: 1, text: "42", size: 2, prev: tokens[8], next: tokens[10] },
      { x: 11, y: 1, text: ";", size: 1, prev: tokens[9], next: tokens[11] },
      { x: 0, y: 2, text: "}", size: 1, prev: tokens[10], next: undefined },
    ]);
    expect(highlights).toEqual([
      {
        meta: {
          tagName: "mark",
          attributes: [],
          isHighlight: true,
        },
        hash: expect.any(String),
        start: [16, 0],
        end: [1, 2],
      },
    ]);
  });

  test("it handles highlights in boxes inside boxes", () => {
    container.innerHTML =
      "const <span foo='bar'>a = <b><mark>()</mark></b> => 42</span>";
    const {
      root: { tokens },
      highlights,
    } = processCode(container);
    const firstToken = tokens[0] as TextToken;
    const outerBox = tokens[1] as BoxToken;
    const innerBox = outerBox.tokens[2] as BoxToken;
    expect(firstToken).toEqual({
      x: 0,
      y: 0,
      text: "const",
      size: 5,
      prev: undefined,
      next: outerBox.tokens[0],
    });
    expect(outerBox).toEqual({
      meta: {
        tagName: "span",
        attributes: [["foo", "bar"]],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [
        /* eslint-disable */
        { x: 6, y: 0, text: "a", size: 1, prev: firstToken, next: outerBox.tokens[1] },
        { x: 8, y: 0, text: "=", size: 1, prev: outerBox.tokens[0], next: innerBox.tokens[0] },
        innerBox,
        { x: 13, y: 0, text: "=", size: 1, prev: innerBox.tokens[1], next: outerBox.tokens[4] },
        { x: 14, y: 0, text: ">", size: 1, prev: outerBox.tokens[3], next: outerBox.tokens[5] },
        { x: 16, y: 0, text: "42", size: 2, prev: outerBox.tokens[4], next: undefined },
        /* eslint-enable */
      ],
    });
    expect(innerBox).toEqual({
      meta: {
        tagName: "b",
        attributes: [],
        isHighlight: false,
      },
      hash: expect.any(String),
      tokens: [
        /* eslint-disable */
        { x: 10, y: 0, text: "(", size: 1, prev: outerBox.tokens[1], next: innerBox.tokens[1] },
        { x: 11, y: 0, text: ")", size: 1, prev: innerBox.tokens[0], next: outerBox.tokens[3] },
        /* eslint-enable */
      ],
    });
    expect(highlights).toEqual([
      {
        meta: {
          tagName: "mark",
          attributes: [],
          isHighlight: true,
        },
        hash: expect.any(String),
        start: [10, 0],
        end: [12, 0],
      },
    ]);
  });
});
