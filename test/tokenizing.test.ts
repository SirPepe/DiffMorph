import { processCode } from "../src/dom";

describe("processing code", () => {
  const container = document.createElement("pre");

  test("it splits code", () => {
    container.innerHTML = "const a = () => 42";
    const { x, y, content } = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(content).toEqual([
      { x: 0, y: 0, text: "const" },
      { x: 6, y: 0, text: "a" },
      { x: 8, y: 0, text: "=" },
      { x: 10, y: 0, text: "(" },
      { x: 11, y: 0, text: ")" },
      { x: 13, y: 0, text: "=" },
      { x: 14, y: 0, text: ">" },
      { x: 16, y: 0, text: "42" },
    ]);
  });

  test("it splits multi-line code", () => {
    container.innerHTML = `const a = () => {
  return 42;
};`;
    const { x, y, content } = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(content).toEqual([
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
  });

  test("it handles boxes", () => {
    container.innerHTML = "const <span foo='bar'>a = () => 42</span>";
    const { x, y, content } = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(content).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        tagName: "span",
        attributes: [["foo", "bar"]],
        content: [
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
  });

  test("it handles multi-line boxes", () => {
    container.innerHTML = `const a = () => <span class="a">{
  return 42;
}</span>;`;
    const { x, y, content } = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(content).toEqual([
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
        content: [
          { x: 0, y: 0, text: "{" },
          { x: 2, y: 1, text: "return" },
          { x: 9, y: 1, text: "42" },
          { x: 11, y: 1, text: ";" },
          { x: 0, y: 2, text: "}" },
        ],
      },
      { x: 1, y: 2, text: ";" },
    ]);
  });

  test("it handles boxes inside boxes", () => {
    container.innerHTML =
      "const <span foo='bar'>a = <span>()</span> => 42</span>";
    const { x, y, content } = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(content).toEqual([
      { x: 0, y: 0, text: "const" },
      {
        x: 6,
        y: 0,
        tagName: "span",
        attributes: [["foo", "bar"]],
        content: [
          { x: 0, y: 0, text: "a" },
          { x: 2, y: 0, text: "=" },
          {
            x: 4,
            y: 0,
            tagName: "span",
            attributes: [],
            content: [
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
  });

  /*test.skip("it handles highlights", () => {
    container.innerHTML = "const a = () => <mark>42</mark>";
    const { x, y, content } = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(content).toEqual([
      { x: 0, y: 0, text: "const" },
      { x: 6, y: 0, text: "a" },
      { x: 8, y: 0, text: "=" },
      { x: 10, y: 0, text: "(" },
      { x: 11, y: 0, text: ")" },
      { x: 13, y: 0, text: "=" },
      { x: 14, y: 0, text: ">" },
      { x: 16, y: 0, text: "42" },
    ]);
  });

  test.skip("it splits multi-line highlights", () => {
    container.innerHTML = `const a = () => <mark>{
  return 42;
}</mark>`;
    const { x, y, content } = processCode(container);
    expect(x).toBe(0);
    expect(y).toBe(0);
    expect(content).toEqual([
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
  });*/
});
