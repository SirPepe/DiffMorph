import { findStructures } from "../../src/lib/struct";
import { Box } from "../../src/types";
import { link } from "../helpers";

describe("finding structures", () => {
  const rootBox: Box<any, any> = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    data: {},
    language: "none",
    content: [],
    decorations: [],
    parent: undefined,
  };

  test("string sequence by type", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "'", type: "string string-start-0" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: "h", type: "string" },
      { x: 6, y: 0, width: 1, height: 1, hash: 4, text: "i", type: "string" },
      { x: 7, y: 0, width: 1, height: 1, hash: 5, text: "'", type: "string string-end-0" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input);
    expect(actual).toEqual([
      {
        x: 4,
        y: 0,
        width: 4,
        height: 1,
        type: "string string",
        hash: expect.any(Number),
        items: [input[2], input[3], input[4], input[5]],
        structures: [],
      },
    ]);
  });

  test("nested array sequence", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "[", type: "punctuation array-start-0" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: "[", type: "punctuation array-start-1" },
      { x: 6, y: 0, width: 1, height: 1, hash: 4, text: "42", type: "number" },
      { x: 8, y: 0, width: 1, height: 1, hash: 4, text: "]", type: "punctuation array-end-1" },
      { x: 9, y: 0, width: 1, height: 1, hash: 5, text: "]", type: "punctuation array-end-0" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input);
    expect(actual).toEqual([
      {
        x: 4,
        y: 0,
        width: 6,
        height: 1,
        type: "punctuation array",
        hash: expect.any(Number),
        items: [input[2], input[3], input[4], input[5], input[6]],
        structures: [
          {
            x: 5,
            y: 0,
            width: 4,
            height: 1,
            type: "punctuation array",
            hash: expect.any(Number),
            items: [input[3], input[4], input[5]],
            structures: [],
          },
        ],
      },
    ]);
  });

  test("multiple array sequences", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "[", type: "punctuation array-start-0" },
      { x: 5, y: 0, width: 1, height: 1, hash: 5, text: "]", type: "punctuation array-end-0" },
      { x: 6, y: 0, width: 1, height: 1, hash: 1, text: ",", type: "" },
      { x: 8, y: 0, width: 1, height: 1, hash: 3, text: "[", type: "punctuation array-start-0" },
      { x: 9, y: 0, width: 1, height: 1, hash: 4, text: "42", type: "number" },
      { x: 11, y: 0, width: 1, height: 1, hash: 4, text: "]", type: "punctuation array-end-0" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input);
    expect(actual).toEqual([
      {
        x: 4,
        y: 0,
        width: 2,
        height: 1,
        type: "punctuation array",
        hash: expect.any(Number),
        items: [input[2], input[3]],
        structures: [],
      },
      {
        x: 8,
        y: 0,
        width: 4,
        height: 1,
        type: "punctuation array",
        hash: expect.any(Number),
        items: [input[5], input[6], input[7]],
        structures: [],
      },
    ]);
  });

  test("no structures", () => {
    const input = link(
      [
        { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
        { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "a", type: "" },
        { x: 3, y: 0, width: 1, height: 1, hash: 2, text: "g", type: "" },
        { x: 4, y: 0, width: 1, height: 1, hash: 3, text: "b", type: "" },
      ],
      rootBox
    );
    const actual = findStructures(input);
    expect(actual).toEqual([]);
  });
});
