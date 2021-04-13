import { diff } from "../../src/lib/diff";
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
          ["emolrh0", { id: "emolrh0", text: "{", type: expect.any(String) }],
          ["4ie1970", { id: "4ie1970", text: "}", type: expect.any(String) }],
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
            "emolrh0",
            {
              id: "emolrh0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "4ie1970",
            {
              id: "4ie1970",
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
            "emolrh0",
            {
              id: "emolrh0",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "4ie1970",
            {
              id: "4ie1970",
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
            "emolrh0",
            {
              id: "emolrh0",
              x: 4,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "4ie1970",
            {
              id: "4ie1970",
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

  test("It works with static frames", () => {
    const diffs = diff([json("{}"), json("{}"), json("  {}")]);
    const { objects, frames, maxWidth, maxHeight } = toRenderData(diffs);
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["emolrh0", { id: "emolrh0", text: "{", type: expect.any(String) }],
          ["4ie1970", { id: "4ie1970", text: "}", type: expect.any(String) }],
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
            "emolrh0",
            {
              id: "emolrh0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "4ie1970",
            {
              id: "4ie1970",
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
            "emolrh0",
            {
              id: "emolrh0",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              isVisible: true,
            },
          ],
          [
            "4ie1970",
            {
              id: "4ie1970",
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

  /*test.skip("does not explode when a line break gets inserted after two identical frames", () => {
    const diffs = diff([json("{}"), json("{}"), json("{\n}")]);
    const keyframes = toRenderData(diffs);
  });*/
});
