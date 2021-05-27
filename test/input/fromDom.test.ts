import { processCode } from "../../src/input/fromDom";
import { Box, Decoration, TextToken } from "../../src/types";

describe("processing code from a DOM source", () => {
  const container = document.createElement("pre");

  test("copying attributes from the source element", () => {
    container.setAttribute("foo", "bar");
    const root = processCode(container, 2);
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
    const root = processCode(container, 2);
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
      content: expect.any(Array),
      decorations: [],
      parent: undefined,
    });
    const content = root.content;
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
  });

  test("splitting multi-line code", () => {
    container.innerHTML = `const a = () => {
  return 42;
};`;
    const root = processCode(container, 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 17,
      height: 3,
      decorations: [],
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, next: content[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, next: content[2], prev: content[0], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: content[3], prev: content[1], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: content[4], prev: content[2], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: content[5], prev: content[3], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: content[6], prev: content[4], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: content[7], prev: content[5], parent: root },
      { x: 16, y: 0, text: "{", height: 1, width: 1, next: content[8], prev: content[6], parent: root },
      { x: 2, y: 1, text: "return", height: 1, width: 6, next: content[9], prev: content[7], parent: root },
      { x: 9, y: 1, text: "42", height: 1, width: 2, next: content[10], prev: content[8], parent: root },
      { x: 11, y: 1, text: ";", height: 1, width: 1, next: content[11], prev: content[9], parent: root },
      { x: 0, y: 2, text: "}", height: 1, width: 1, next: content[12], prev: content[10], parent: root },
      { x: 1, y: 2, text: ";", height: 1, width: 1, next: content[13], prev: content[11], parent: root },
      /* eslint-enable */
    ]);
  });

  test("splitting multi-line code with tabs", () => {
    container.innerHTML = `const a = () => {
\treturn 42;
};`;
    const root = processCode(container, 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 17,
      height: 3,
      decorations: [],
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, next: content[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, next: content[2], prev: content[0], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: content[3], prev: content[1], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: content[4], prev: content[2], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: content[5], prev: content[3], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: content[6], prev: content[4], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: content[7], prev: content[5], parent: root },
      { x: 16, y: 0, text: "{", height: 1, width: 1, next: content[8], prev: content[6], parent: root },
      { x: 2, y: 1, text: "return", height: 1, width: 6, next: content[9], prev: content[7], parent: root },
      { x: 9, y: 1, text: "42", height: 1, width: 2, next: content[10], prev: content[8], parent: root },
      { x: 11, y: 1, text: ";", height: 1, width: 1, next: content[11], prev: content[9], parent: root },
      { x: 0, y: 2, text: "}", height: 1, width: 1, next: content[12], prev: content[10], parent: root },
      { x: 1, y: 2, text: ";", height: 1, width: 1, next: content[13], prev: content[11], parent: root },
      /* eslint-enable */
    ]);
  });

  test("splitting multi-line code with tabs and a custom size", () => {
    container.innerHTML = `const a = () => {
\treturn 42;
};`;
    const root = processCode(container, 4);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 17,
      height: 3,
      decorations: [],
    });
    const content = root.content;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, next: content[1], prev: undefined, parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, next: content[2], prev: content[0], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: content[3], prev: content[1], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: content[4], prev: content[2], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: content[5], prev: content[3], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: content[6], prev: content[4], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: content[7], prev: content[5], parent: root },
      { x: 16, y: 0, text: "{", height: 1, width: 1, next: content[8], prev: content[6], parent: root },
      { x: 4, y: 1, text: "return", height: 1, width: 6, next: content[9], prev: content[7], parent: root },
      { x: 11, y: 1, text: "42", height: 1, width: 2, next: content[10], prev: content[8], parent: root },
      { x: 13, y: 1, text: ";", height: 1, width: 1, next: content[11], prev: content[9], parent: root },
      { x: 0, y: 2, text: "}", height: 1, width: 1, next: content[12], prev: content[10], parent: root },
      { x: 1, y: 2, text: ";", height: 1, width: 1, next: content[13], prev: content[11], parent: root },
      /* eslint-enable */
    ]);
  });

  test("boxes", () => {
    container.innerHTML = "const <span foo='bar'>a</span> = () => 42";
    const root = processCode(container, 2);
    expect(root).toMatchObject({
      x: 0,
      y: 0,
      width: 18,
      height: 1,
    });
    const [txt, box, ...rest] = root.content as [
      TextToken,
      Box<TextToken, never>,
      ...TextToken[]
    ];
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
      content: [
        {
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
      decorations: [],
      parent: root,
    });
    expect(rest).toEqual([
      /* eslint-disable */
      { x: 8, y: 0, text: "=", height: 1, width: 1, next: rest[1], prev: box.content[0], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, next: rest[2], prev: rest[0], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, next: rest[3], prev: rest[1], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, next: rest[4], prev: rest[2], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, next: rest[5], prev: rest[3], parent: root },
      { x: 16, y: 0, text: "42", height: 1, width: 2, next: undefined, prev: rest[4], parent: root },
      /* eslint-enable */
    ]);
  });

  test("it handles multi-line boxes", () => {
    container.innerHTML = `const a = () => <span class="a">{
  return 42;
}</span>;`;
    const root = processCode(container, 2);
    const textTokens = root.content.slice(0, 7);
    const box = root.content[7] as Box<TextToken, never>;
    expect(textTokens).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: textTokens[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: textTokens[0], next: textTokens[2], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: textTokens[1], next: textTokens[3], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, prev: textTokens[2], next: textTokens[4], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, prev: textTokens[3], next: textTokens[5], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, prev: textTokens[4], next: textTokens[6], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, prev: textTokens[5], next: box.content[0], parent: root },
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
      content: [
        /* eslint-disable */
        { x: 16, y: 0, text: "{", height: 1, width: 1, next: box.content[1], prev: textTokens[6], parent: box },
        { x: 2, y: 1, text: "return", height: 1, width: 6, next: box.content[2], prev: box.content[0], parent: box },
        { x: 9, y: 1, text: "42", height: 1, width: 2, next: box.content[3], prev: box.content[1], parent: box },
        { x: 11, y: 1, text: ";", height: 1, width: 1, next: box.content[4], prev: box.content[2], parent: box },
        { x: 0, y: 2, text: "}", height: 1, width: 1, next: expect.any(Object), prev: box.content[3], parent: box },
        /* eslint-enable */
      ],
      decorations: [],
      parent: root,
    });
  });

  test("it handles boxes inside boxes", () => {
    container.innerHTML = "const <span foo='bar'>a = <b>()</b> => 42</span>";
    const root = processCode(container, 2);
    const content = root.content;
    const firstToken = content[0] as TextToken;
    const outerBox = content[1] as Box<TextToken, never>;
    const innerBox = outerBox.content[2] as Box<TextToken, never>;
    expect(firstToken).toEqual({
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: outerBox.content[0],
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
      content: [
        /* eslint-disable */
        { x: 6, y: 0, text: "a", height: 1, width: 1, prev: firstToken, next: outerBox.content[1], parent: outerBox },
        { x: 8, y: 0, text: "=", height: 1, width: 1, prev: outerBox.content[0], next: innerBox.content[0], parent: outerBox },
        innerBox,
        { x: 13, y: 0, text: "=", height: 1, width: 1, prev: innerBox.content[1], next: outerBox.content[4], parent: outerBox },
        { x: 14, y: 0, text: ">", height: 1, width: 1, prev: outerBox.content[3], next: outerBox.content[5], parent: outerBox },
        { x: 16, y: 0, text: "42", height: 1, width: 2, prev: outerBox.content[4], next: undefined, parent: outerBox },
        /* eslint-enable */
      ],
      decorations: [],
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
      content: [
        /* eslint-disable */
        { x: 10, y: 0, text: "(", height: 1, width: 1, prev: outerBox.content[1], next: innerBox.content[1], parent: innerBox },
        { x: 11, y: 0, text: ")", height: 1, width: 1, prev: innerBox.content[0], next: outerBox.content[3], parent: innerBox },
        /* eslint-enable */
      ],
      decorations: [],
      parent: outerBox,
    });
  });

  test("it handles multi-line boxes inside multi-line boxes", () => {
    container.innerHTML = `const <span foo='bar'>a = <b>(
  x
)</b> => [
  x
]</span>;`;
    const root = processCode(container, 2);
    const firstToken = root.content[0] as TextToken;
    const outerBox = root.content[1] as Box<TextToken, never>;
    const innerBox = outerBox.content[2] as Box<TextToken, never>;
    const lastToken = root.content[2] as TextToken;
    expect(firstToken).toEqual({
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: outerBox.content[0],
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
      content: [
        /* eslint-disable */
        { x: 6, y: 0, text: "a", height: 1, width: 1, prev: firstToken, next: outerBox.content[1], parent: outerBox },
        { x: 8, y: 0, text: "=", height: 1, width: 1, prev: outerBox.content[0], next: innerBox.content[0], parent: outerBox },
        innerBox,
        { x: 2, y: 2, text: "=", height: 1, width: 1, prev: innerBox.content[2], next: outerBox.content[4], parent: outerBox },
        { x: 3, y: 2, text: ">", height: 1, width: 1, prev: outerBox.content[3], next: outerBox.content[5], parent: outerBox },
        { x: 5, y: 2, text: "[", height: 1, width: 1, prev: outerBox.content[4], next: outerBox.content[6], parent: outerBox },
        { x: 2, y: 3, text: "x", height: 1, width: 1, prev: outerBox.content[5], next: outerBox.content[7], parent: outerBox },
        { x: 0, y: 4, text: "]", height: 1, width: 1, prev: outerBox.content[6], next: lastToken, parent: outerBox },
        /* eslint-enable */
      ],
      decorations: [],
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
      content: [
        /* eslint-disable */
        { x: 10, y: 0, text: "(", height: 1, width: 1, prev: outerBox.content[1], next: innerBox.content[1], parent: innerBox },
        { x: 2, y: 1, text: "x", height: 1, width: 1, prev: innerBox.content[0], next: innerBox.content[2], parent: innerBox },
        { x: 0, y: 2, text: ")", height: 1, width: 1, prev: innerBox.content[1], next: outerBox.content[3], parent: innerBox },
        /* eslint-enable */
      ],
      decorations: [],
      parent: outerBox,
    });
    expect(lastToken).toEqual({
      x: 1,
      y: 4,
      text: ";",
      width: 1,
      height: 1,
      prev: outerBox.content[7],
      next: undefined,
      parent: root,
    });
  });

  test("it handles decorations", () => {
    container.innerHTML = "const a = () => <mark>42</mark>";
    const root = processCode(container, 2);
    const { content, decorations } = root;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, prev: content[2], next: content[4], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, prev: content[3], next: content[5], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, prev: content[4], next: content[6], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, prev: content[5], next: content[7], parent: root },
      { x: 16, y: 0, text: "42", height: 1, width: 2, prev: content[6], next: undefined, parent: root },
      /* eslint-enable */
    ]);
    expect(decorations).toEqual([
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
    ]);
  });

  test("it handles external decorations", () => {
    container.innerHTML = `const a = () => 42<data class='dm-decoration' value='{"x": 16,"y": 0,"width": 2,"height": 1,"data":{}}'>Ignore me</data>`;
    const root = processCode(container, 2);
    const { content, decorations } = root;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, prev: content[2], next: content[4], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, prev: content[3], next: content[5], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, prev: content[4], next: content[6], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, prev: content[5], next: content[7], parent: root },
      { x: 16, y: 0, text: "42", height: 1, width: 2, prev: content[6], next: undefined, parent: root },
      /* eslint-enable */
    ]);
    expect(decorations).toEqual([
      {
        kind: "DECO",
        x: 16,
        y: 0,
        width: 2,
        height: 1,
        data: {},
        hash: "",
        parent: root,
      },
    ]);
  });

  test("it handles multiple decorations", () => {
    container.innerHTML =
      "const <mark class='a'>a</mark> = () => <mark class='b'>42</mark>";
    const root = processCode(container, 2);
    const { content, decorations } = root;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, prev: content[2], next: content[4], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, prev: content[3], next: content[5], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, prev: content[4], next: content[6], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, prev: content[5], next: content[7], parent: root },
      { x: 16, y: 0, text: "42", height: 1, width: 2, prev: content[6], next: undefined, parent: root },
      /* eslint-enable */
    ]);
    expect(decorations).toEqual([
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
    ]);
  });

  test("it handles multi-line decorations", () => {
    container.innerHTML = `const a = () => <mark>{
  return 42;
}</mark>`;
    const root = processCode(container, 2);
    const { content, decorations } = root;
    expect(content).toEqual([
      /* eslint-disable */
      { x: 0, y: 0, text: "const", height: 1, width: 5, prev: undefined, next: content[1], parent: root },
      { x: 6, y: 0, text: "a", height: 1, width: 1, prev: content[0], next: content[2], parent: root },
      { x: 8, y: 0, text: "=", height: 1, width: 1, prev: content[1], next: content[3], parent: root },
      { x: 10, y: 0, text: "(", height: 1, width: 1, prev: content[2], next: content[4], parent: root },
      { x: 11, y: 0, text: ")", height: 1, width: 1, prev: content[3], next: content[5], parent: root },
      { x: 13, y: 0, text: "=", height: 1, width: 1, prev: content[4], next: content[6], parent: root },
      { x: 14, y: 0, text: ">", height: 1, width: 1, prev: content[5], next: content[7], parent: root },
      { x: 16, y: 0, text: "{", height: 1, width: 1, prev: content[6], next: content[8], parent: root },
      { x: 2, y: 1, text: "return", height: 1, width: 6, prev: content[7], next: content[9], parent: root },
      { x: 9, y: 1, text: "42", height: 1, width: 2, prev: content[8], next: content[10], parent: root },
      { x: 11, y: 1, text: ";", height: 1, width: 1, prev: content[9], next: content[11], parent: root },
      { x: 0, y: 2, text: "}", height: 1, width: 1, prev: content[10], next: undefined, parent: root },
      /* eslint-enable */
    ]);
    expect(decorations).toEqual([
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
    ]);
  });

  test("it handles decorations in boxes inside boxes", () => {
    container.innerHTML =
      "const <span foo='bar'>a = <b><mark>()</mark></b> => 42</span>";
    const root = processCode(container, 2);
    const firstToken = root.content[0] as TextToken;
    const outerBox = root.content[1] as Box<TextToken, Decoration<any>>;
    const innerBox = outerBox.content[2] as Box<TextToken, Decoration<any>>;
    expect(firstToken).toEqual({
      x: 0,
      y: 0,
      text: "const",
      width: 5,
      height: 1,
      prev: undefined,
      next: outerBox.content[0],
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
      content: [
        /* eslint-disable */
        { x: 6, y: 0, text: "a", height: 1, width: 1, prev: firstToken, next: outerBox.content[1], parent: outerBox },
        { x: 8, y: 0, text: "=", height: 1, width: 1, prev: outerBox.content[0], next: innerBox.content[0], parent: outerBox },
        innerBox,
        { x: 13, y: 0, text: "=", height: 1, width: 1, prev: innerBox.content[1], next: outerBox.content[4], parent: outerBox },
        { x: 14, y: 0, text: ">", height: 1, width: 1, prev: outerBox.content[3], next: outerBox.content[5], parent: outerBox },
        { x: 16, y: 0, text: "42", height: 1, width: 2, prev: outerBox.content[4], next: undefined, parent: outerBox },
        /* eslint-enable */
      ],
      decorations: [],
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
      content: [
        /* eslint-disable */
        { x: 10, y: 0, text: "(", height: 1, width: 1, prev: outerBox.content[1], next: innerBox.content[1], parent: innerBox },
        { x: 11, y: 0, text: ")", height: 1, width: 1, prev: innerBox.content[0], next: outerBox.content[3], parent: innerBox },
        /* eslint-enable */
      ],
      decorations: [
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
      ],
      parent: outerBox,
    });
  });
});
