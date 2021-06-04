import { diff } from "../../src/lib/diff";
import { stubBox } from "../helpers";

describe("diffing decorations", () => {
  test("no decorations", () => {
    const [, actual] = diff([stubBox({}), stubBox({})]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [],
    });
  });

  test("no changes to existing decorations", () => {
    const [, actual] = diff([
      stubBox({
        decorations: [
          {
            x: 0,
            y: 0,
            width: 2,
            height: 2,
            data: {},
          },
        ],
      }),
      stubBox({
        decorations: [
          {
            x: 0,
            y: 0,
            width: 2,
            height: 2,
            data: {},
          },
        ],
      }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [],
    });
  });

  test("single addition", () => {
    const added = {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [] }),
      stubBox({ decorations: [added] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "ADD", item: added }],
    });
  });

  test("single removal", () => {
    const removed = {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [removed] }),
      stubBox({ decorations: [] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "DEL", item: removed }],
    });
  });

  test("single translation", () => {
    const before = {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      data: {},
    };
    const after = {
      x: 0,
      y: 1,
      width: 2,
      height: 2,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [before] }),
      stubBox({ decorations: [after] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "MOV", item: after, from: before }],
    });
  });

  test("single size change", () => {
    const before = {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      data: {},
    };
    const after = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [before] }),
      stubBox({ decorations: [after] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "MOV", item: after, from: before }],
    });
  });
});
