import { findStructures } from "../../src/lib/struct";
import { link } from "../helpers";

describe("finding structures", () => {
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
    const actual = findStructures(input, []);
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

  test("string sequence by text", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "'", type: "string" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: "h", type: "string" },
      { x: 6, y: 0, width: 1, height: 1, hash: 4, text: "i", type: "string" },
      { x: 7, y: 0, width: 1, height: 1, hash: 5, text: "'", type: "string" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input, []);
    expect(actual).toEqual([
      {
        x: 4,
        y: 0,
        width: 4,
        height: 1,
        type: "string",
        hash: expect.any(Number),
        items: [input[2], input[3], input[4], input[5]],
        structures: [],
      },
    ]);
  });

  test("string sequence by text (escape in text token)", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "'", type: "string" },
      { x: 5, y: 0, width: 2, height: 1, hash: 3, text: "\\'", type: "string" },
      { x: 7, y: 0, width: 1, height: 1, hash: 5, text: "'", type: "string" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input, []);
    expect(actual).toEqual([
      {
        x: 4,
        y: 0,
        width: 4,
        height: 1,
        type: "string",
        hash: expect.any(Number),
        items: [input[2], input[3], input[4]],
        structures: [],
      },
    ]);
  });

  test("string sequence by text (escape in prev token)", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "'", type: "string" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: "\\", type: "string" },
      { x: 6, y: 0, width: 1, height: 1, hash: 4, text: "'", type: "string" },
      { x: 7, y: 0, width: 1, height: 1, hash: 5, text: "'", type: "string" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input, []);
    expect(actual).toEqual([
      {
        x: 4,
        y: 0,
        width: 4,
        height: 1,
        type: "string",
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
    const actual = findStructures(input, []);
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
    const actual = findStructures(input, []);
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
    const input = link([
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "a", type: "" },
      { x: 3, y: 0, width: 1, height: 1, hash: 2, text: "g", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 3, text: "b", type: "" },
    ]);
    const actual = findStructures(input, []);
    expect(actual).toEqual([]);
  });
});

describe("finding hints", () => {
  test("implicit operator hints", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 2, height: 1, hash: 0, text: "<a", type: "tag" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: ":", type: "operator-namespace" },
      { x: 3, y: 0, width: 1, height: 1, hash: 2, text: "b", type: "tag" },
      { x: 4, y: 0, width: 1, height: 1, hash: 3, text: ">", type: "tag" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input, []);
    expect(actual).toEqual([
      {
        x: 0,
        y: 0,
        width: 4,
        height: 1,
        type: "hint",
        hash: expect.any(Number),
        items: [input[0], input[1], input[2]],
        structures: [],
      },
    ]);
  });

  test("multiple implicit operator hints", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 2, height: 1, hash: 0, text: "<a", type: "tag" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: ":", type: "operator-namespace" },
      { x: 3, y: 0, width: 1, height: 1, hash: 2, text: "b", type: "tag" },
      { x: 4, y: 0, width: 1, height: 1, hash: 3, text: ">", type: "tag" },
      { x: 5, y: 0, width: 2, height: 1, hash: 0, text: "<c", type: "tag" },
      { x: 7, y: 0, width: 1, height: 1, hash: 1, text: ":", type: "operator-namespace" },
      { x: 8, y: 0, width: 1, height: 1, hash: 2, text: "d", type: "tag" },
      { x: 9, y: 0, width: 1, height: 1, hash: 3, text: ">", type: "tag" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input, []);
    expect(actual).toEqual([
      {
        x: 0,
        y: 0,
        width: 4,
        height: 1,
        type: "hint",
        hash: expect.any(Number),
        items: [input[0], input[1], input[2]],
        structures: [],
      },
      {
        x: 5,
        y: 0,
        width: 4,
        height: 1,
        type: "hint",
        hash: expect.any(Number),
        items: [input[4], input[5], input[6]],
        structures: [],
      },
    ]);
  });

  test("string hints in pseudo-xml", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 2, height: 1, hash: 0, text: "<a", type: "tag" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: ":", type: "namespace" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "b", type: "tag" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: ">", type: "tag" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input, [["tag", "namespace", "tag"]]);
    expect(actual).toEqual([
      {
        x: 0,
        y: 0,
        width: 5,
        height: 1,
        type: "hint",
        hash: expect.any(Number),
        items: [input[0], input[1], input[2]],
        structures: [],
      },
    ]);
  });

  test("regex hints in pseudo-xml", () => {
    const input = link([
      /* eslint-disable */
      { x: 0, y: 0, width: 2, height: 1, hash: 0, text: "<a", type: "tag" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: ":", type: "x-namespace-y" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "b", type: "tag" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: ">", type: "tag" },
      /* eslint-enable */
    ]);
    const actual = findStructures(input, [["tag", /namespace/, "tag"]]);
    expect(actual).toEqual([
      {
        x: 0,
        y: 0,
        width: 5,
        height: 1,
        type: "hint",
        hash: expect.any(Number),
        items: [input[0], input[1], input[2]],
        structures: [],
      },
    ]);
  });
});
