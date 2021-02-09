import { processCode } from "../src/dom";

describe("processing code", () => {
  const container = document.createElement("pre");

  test("it splits code", () => {
    container.innerHTML = "const a = () => 42";
    const [{ x, y, tokens }, highlights] = processCode(container);
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
    container.innerHTML = `const a = () => {
  return 42;
};`;
    const [{ x, y, tokens }, highlights] = processCode(container);
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
    container.innerHTML = "const <span foo='bar'>a = () => 42</span>";
    const [{ x, y, tokens }, highlights] = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        tagName: "span",
        attributes: [["foo", "bar"]],
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

  test("it handles boxes in the middle of code", () => {
    container.innerHTML = "const <span foo='bar'>a</span> = () => 42";
    const [{ x, y, tokens }, highlights] = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        tagName: "span",
        attributes: [["foo", "bar"]],
        hash: expect.any(String),
        tokens: [{ x: 0, y: 0, text: "a" }],
      },
      { x: 8, y: 0, text: "=" },
      { x: 10, y: 0, text: "(" },
      { x: 11, y: 0, text: ")" },
      { x: 13, y: 0, text: "=" },
      { x: 14, y: 0, text: ">" },
      { x: 16, y: 0, text: "42" },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles multi-line boxes", () => {
    container.innerHTML = `const a = () => <span class="a">{
  return 42;
}</span>;`;
    const [{ x, y, tokens }, highlights] = processCode(container);
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
      {
        x: 16,
        y: 0,
        tagName: "span",
        attributes: [["class", "a"]],
        hash: expect.any(String),
        tokens: [
          { x: 0, y: 0, text: "{" },
          { x: -14, y: 1, text: "return" },
          { x: -7, y: 1, text: "42" },
          { x: -5, y: 1, text: ";" },
          { x: -16, y: 2, text: "}" },
        ],
      },
      { x: 1, y: 2, text: ";" },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles boxes inside boxes", () => {
    container.innerHTML = "const <span foo='bar'>a = <b>()</b> => 42</span>";
    const [{ x, y, tokens }, highlights] = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        tagName: "span",
        attributes: [["foo", "bar"]],
        hash: expect.any(String),
        tokens: [
          { x: 0, y: 0, text: "a" },
          { x: 2, y: 0, text: "=" },
          {
            x: 4,
            y: 0,
            tagName: "b",
            attributes: [],
            hash: expect.any(String),
            tokens: [
              { x: 0, y: 0, text: "(" },
              { x: 1, y: 0, text: ")" },
            ],
          },
          { x: 7, y: 0, text: "=" },
          { x: 8, y: 0, text: ">" },
          { x: 10, y: 0, text: "42" },
        ],
      },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles multi-line boxes inside multi-line boxes", () => {
    container.innerHTML = `const <span foo='bar'>a = <b>(
  x
)</b> => [
  x
]</span>;`;
    const [{ x, y, tokens }, highlights] = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        tagName: "span",
        attributes: [["foo", "bar"]],
        hash: expect.any(String),
        tokens: [
          { x: 0, y: 0, text: "a" },
          { x: 2, y: 0, text: "=" },
          {
            x: 4,
            y: 0,
            tagName: "b",
            attributes: [],
            hash: expect.any(String),
            tokens: [
              { x: 0, y: 0, text: "(" },
              { x: -8, y: 1, text: "x" },
              { x: -10, y: 2, text: ")" },
            ],
          },
          { x: 2, y: 2, text: "=" },
          { x: 3, y: 2, text: ">" },
          { x: 5, y: 2, text: "[" },
          { x: -4, y: 3, text: "x" },
          { x: -6, y: 4, text: "]" },
        ],
      },
      { text: ";", x: 1, y: 4 },
    ]);
    expect(highlights).toEqual([]);
  });

  test("creates correct box offsets", () => {
    container.innerHTML = `let <a>x
  =
    <b>42</b></a>`;
    const [{ x, y, tokens }, highlights] = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "let" },
      {
        x: 4,
        y: 0,
        tagName: "a",
        attributes: [],
        hash: expect.any(String),
        tokens: [
          { x: 0, y: 0, text: "x" },
          { x: -2, y: 1, text: "=" },
          {
            x: 4,
            y: 2,
            tagName: "b",
            attributes: [],
            hash: expect.any(String),
            tokens: [{ x: 0, y: 0, text: "42" }],
          },
        ],
      },
    ]);
    expect(highlights).toEqual([]);
  });

  test("it handles highlights", () => {
    container.innerHTML = "const a = () => <mark>42</mark>";
    const [{ x, y, tokens }, highlights] = processCode(container);
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
        tagName: "mark",
        attributes: [],
        hash: expect.any(String),
        start: [16, 0],
        end: [18, 0],
      },
    ]);
  });

  test("it handles multiple highlights", () => {
    container.innerHTML =
      "const <mark class='a'>a</mark> = () => <mark class='b'>42</mark>";
    const [{ x, y, tokens }, highlights] = processCode(container);
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
        tagName: "mark",
        attributes: [["class", "a"]],
        hash: expect.any(String),
        start: [6, 0],
        end: [7, 0],
      },
      {
        tagName: "mark",
        attributes: [["class", "b"]],
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
    const [{ x, y, tokens }, highlights] = processCode(container);
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
    ]);
    expect(highlights).toEqual([
      {
        tagName: "mark",
        attributes: [],
        hash: expect.any(String),
        start: [16, 0],
        end: [1, 2],
      },
    ]);
  });

  test("it handles highlights in boxes inside boxes", () => {
    container.innerHTML =
      "const <span foo='bar'>a = <b><mark>()</mark></b> => 42</span>";
    const [{ x, y, tokens }, highlights] = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(tokens).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        tagName: "span",
        attributes: [["foo", "bar"]],
        hash: expect.any(String),
        tokens: [
          { x: 0, y: 0, text: "a" },
          { x: 2, y: 0, text: "=" },
          {
            x: 4,
            y: 0,
            tagName: "b",
            attributes: [],
            hash: expect.any(String),
            tokens: [
              { x: 0, y: 0, text: "(" },
              { x: 1, y: 0, text: ")" },
            ],
          },
          { x: 7, y: 0, text: "=" },
          { x: 8, y: 0, text: ">" },
          { x: 10, y: 0, text: "42" },
        ],
      },
    ]);
    expect(highlights).toEqual([
      {
        tagName: "mark",
        attributes: [],
        hash: expect.any(String),
        start: [10, 0],
        end: [12, 0],
      },
    ]);
  });
});
