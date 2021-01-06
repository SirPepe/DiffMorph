import { toLanguageTokens } from "../src/language";

describe("language", () => {
  test("turns tokens into a doubly-linked list", () => {
    const input = {
      x: 0,
      y: 0,
      tagName: "span",
      attributes: [],
      tokens: [
        { x: 0, y: 0, text: "let" },
        { x: 4, y: 0, text: "x" },
        { x: 6, y: 0, text: "=" },
        { x: 8, y: 0, text: "42" },
      ],
    };
    const e1: any = {
      x: 0,
      y: 0,
      text: "let",
      parent: input,
      source: input.tokens[0],
      next: undefined,
      prev: undefined,
    };
    const e2: any = {
      x: 4,
      y: 0,
      text: "x",
      parent: input,
      source: input.tokens[1],
      next: undefined,
      prev: e1,
    };
    const e3: any = {
      x: 6,
      y: 0,
      text: "=",
      parent: input,
      source: input.tokens[2],
      next: undefined,
      prev: e2,
    };
    const e4: any = {
      x: 8,
      y: 0,
      text: "42",
      parent: input,
      source: input.tokens[3],
      next: undefined,
      prev: e3,
    };
    e1.next = e2;
    e2.next = e3;
    e3.next = e4;
    expect(toLanguageTokens(input)).toEqual(e1);
  });

  test("adjusts for box offsets", () => {
    /* Code for input: `<a>let <b>x
  =
    <c>42</c></b></a>` */
    const input = {
      x: 0,
      y: 0,
      tagName: "a",
      attributes: [],
      tokens: [
        { x: 0, y: 0, text: "let" },
        {
          x: 4,
          y: 0,
          tagName: "b",
          attributes: [],
          tokens: [
            { x: 0, y: 0, text: "x" },
            { x: -2, y: 1, text: "=" },
            {
              x: 4,
              y: 2,
              tagName: "c",
              attributes: [],
              tokens: [{ x: 0, y: 0, text: "42" }],
            },
          ],
        },
      ],
    };
    const e1: any = {
      x: 0,
      y: 0,
      text: "let",
      parent: input,
      source: input.tokens[0],
      next: undefined,
      prev: undefined,
    };
    const e2: any = {
      x: 4,
      y: 0,
      text: "x",
      parent: input.tokens[1],
      source: input.tokens?.[1]?.tokens?.[0],
      next: undefined,
      prev: e1,
    };
    const e3: any = {
      x: 2,
      y: 1,
      text: "=",
      parent: input.tokens[1],
      source: input.tokens?.[1]?.tokens?.[1],
      next: undefined,
      prev: e2,
    };
    const e4: any = {
      x: 4,
      y: 2,
      text: "42",
      parent: input.tokens?.[1]?.tokens?.[2],
      source: input.tokens?.[1]?.tokens?.[2]?.tokens?.[0],
      next: undefined,
      prev: e3,
    };
    e1.next = e2;
    e2.next = e3;
    e3.next = e4;
    expect(toLanguageTokens(input)).toEqual(e1);
  });
});
