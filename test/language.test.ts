import { toRawTokens } from "../src/language";

describe("language", () => {
  test("turns tokens into a doubly-linked list", () => {
    const input = {
      x: 0,
      y: 0,
      meta: {
        tagName: "span",
        attributes: [],
      },
      hash: "foo",
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
      size: 3,
      parent: input,
      source: input.tokens[0],
      next: undefined,
      prev: undefined,
    };
    const e2: any = {
      x: 4,
      y: 0,
      text: "x",
      size: 1,
      parent: input,
      source: input.tokens[1],
      next: undefined,
      prev: e1,
    };
    const e3: any = {
      x: 6,
      y: 0,
      text: "=",
      size: 1,
      parent: input,
      source: input.tokens[2],
      next: undefined,
      prev: e2,
    };
    const e4: any = {
      x: 8,
      y: 0,
      text: "42",
      size: 2,
      parent: input,
      source: input.tokens[3],
      next: undefined,
      prev: e3,
    };
    e1.next = e2;
    e2.next = e3;
    e3.next = e4;
    expect(toRawTokens(input)).toEqual(e1);
  });

  test("adjusts for box offsets", () => {
    /* Code for input: `<a>let <b>x
  =
    <c>42</c></b></a>` */
    const input = {
      x: 0,
      y: 0,
      meta: {
        tagName: "a",
        attributes: [],
      },
      hash: "foo",
      tokens: [
        { x: 0, y: 0, text: "let" },
        {
          x: 4,
          y: 0,
          meta: {
            tagName: "b",
            attributes: [],
          },
          hash: "bar",
          tokens: [
            { x: 0, y: 0, text: "x" },
            { x: -2, y: 1, text: "=" },
            {
              x: 4,
              y: 2,
              meta: {
                tagName: "c",
                attributes: [],
              },
              hash: "baz",
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
      size: 3,
      parent: input,
      source: input.tokens[0],
      next: undefined,
      prev: undefined,
    };
    const e2: any = {
      x: 4,
      y: 0,
      text: "x",
      size: 1,
      parent: input.tokens[1],
      source: input.tokens?.[1]?.tokens?.[0],
      next: undefined,
      prev: e1,
    };
    const e3: any = {
      x: 2,
      y: 1,
      text: "=",
      size: 1,
      parent: input.tokens[1],
      source: input.tokens?.[1]?.tokens?.[1],
      next: undefined,
      prev: e2,
    };
    const e4: any = {
      x: 4,
      y: 2,
      text: "42",
      size: 2,
      parent: input.tokens?.[1]?.tokens?.[2],
      source: input.tokens?.[1]?.tokens?.[2]?.tokens?.[0],
      next: undefined,
      prev: e3,
    };
    e1.next = e2;
    e2.next = e3;
    e3.next = e4;
    expect(toRawTokens(input)).toEqual(e1);
  });
});
