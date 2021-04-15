import { diff } from "../../src/lib/diff";
import { extendDiffs } from "../../src/lib/extend";
import { optimizeDiffs } from "../../src/lib/optimize";
import { toRenderData } from "../../src/lib/render";
import { lang } from "../helpers";
const json = lang("json");

describe("rendering", () => {
  test("It turns some JSON into render data", () => {
    const diffs = diff([json("{}"), json("  {}"), json("    {\n}")]);
    const { objects, frames, maxWidth, maxHeight } = toRenderData(diffs);
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["10igw9m0", { id: "10igw9m0", text: "{", type: expect.any(String) }],
          ["1mj04u80", { id: "1mj04u80", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.length).toBe(3);
    expect(frames[0]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(frames[1]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 3,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(frames[2]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 5,
      height: 2,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 4,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 0,
              y: 1,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(maxHeight).toBe(2);
    expect(maxWidth).toBe(5);
  });

  test("It turns optimized diffs into render data", () => {
    const diffs = optimizeDiffs(
      diff([json("{}"), json("  {}"), json("    {\n}")])
    );
    const { objects, frames, maxWidth, maxHeight } = toRenderData(diffs);
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["10igw9m0", { id: "10igw9m0", text: "{", type: expect.any(String) }],
          ["1mj04u80", { id: "1mj04u80", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.length).toBe(3);
    expect(frames[0]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(frames[1]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 3,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(frames[2]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 5,
      height: 2,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 4,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 0,
              y: 1,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(maxHeight).toBe(2);
    expect(maxWidth).toBe(5);
  });

  test("It turns optimized and extended diffs into render data", () => {
    const diffs = extendDiffs(
      optimizeDiffs(diff([json("[]"), json("[null]"), json("[]")]))
    );
    const { objects, frames, maxWidth, maxHeight } = toRenderData(diffs);
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          [
            "1q1s17w0",
            { id: "1q1s17w0", text: "null", type: expect.any(String) },
          ],
          ["170gm040", { id: "170gm040", text: "[", type: expect.any(String) }],
          ["uiulmp0", { id: "uiulmp0", text: "]", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.length).toBe(3);
    /* eslint-disable */
    expect(frames[0].frame.text).toEqual(new Map([
      ["170gm040", { id: '170gm040', x: 0, y: 0, width: 1, height: 1, isVisible: true }],
      ["uiulmp0", { id: 'uiulmp0', x: 1, y: 0, width: 1, height: 1, isVisible: true }],
      ["1q1s17w0", { id: '1q1s17w0', x: 1, y: 0, width: 4, height: 1, isVisible: false }],
    ]));
    expect(frames[1].frame.text).toEqual(new Map([
      ["170gm040", { id: '170gm040', x: 0, y: 0, width: 1, height: 1, isVisible: true }],
      ["uiulmp0", { id: 'uiulmp0', x: 5, y: 0, width: 1, height: 1, isVisible: true }],
      ["1q1s17w0", { id: '1q1s17w0', x: 1, y: 0, width: 4, height: 1, isVisible: true }],
    ]));
    expect(frames[2].frame.text).toEqual(new Map([
      ["170gm040", { id: "170gm040", x: 0, y: 0, width: 1, height: 1, isVisible: true }],
      ["uiulmp0", { id: "uiulmp0", x: 1, y: 0, width: 1, height: 1, isVisible: true }],
    ]));
    /* eslint-enable */
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(6);
  });

  test("It works with non-changing frames", () => {
    const diffs = diff([json("{}"), json("{}"), json("  {}")]);
    const { objects, frames, maxWidth, maxHeight } = toRenderData(diffs);
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["10igw9m0", { id: "10igw9m0", text: "{", type: expect.any(String) }],
          ["1mj04u80", { id: "1mj04u80", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.length).toBe(3);
    expect(frames[0]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(frames[0]).toEqual(frames[1]);
    expect(frames[2]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 3,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(4);
  });

  test("deals with a single frame", () => {
    const diffs = diff([json("{}")]);
    const { objects, frames, maxWidth, maxHeight } = toRenderData(diffs);
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["10igw9m0", { id: "10igw9m0", text: "{", type: expect.any(String) }],
          ["1mj04u80", { id: "1mj04u80", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.length).toBe(1);
    expect(frames[0]).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "10igw9m0",
            {
              id: "10igw9m0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "1mj04u80",
            {
              id: "1mj04u80",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      isVisible: true,
    });
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(2);
  });

  test("deals with zero frames", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData([]);
    expect(objects).toEqual({
      id: "",
      data: {},
      language: "none",
      content: {
        text: new Map(),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.length).toBe(0);
    expect(maxHeight).toBe(0);
    expect(maxWidth).toBe(0);
  });
});
