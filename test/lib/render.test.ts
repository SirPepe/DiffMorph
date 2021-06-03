import { toRenderData } from "../../src/lib/render";
import { process } from "../helpers";

describe("rendering", () => {
  test("It turns some JSON into render data", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")(["{}"], ["  {}"], ["    {\n}"])
    );
    expect(objects).toEqual({
      id: "2mASZD",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["4oyLa8", { id: "4oyLa8", text: "{", type: expect.any(String) }],
          ["7gBFP", { id: "7gBFP", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.size).toBe(3);
    expect(frames.get(0)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(frames.get(1)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 3,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(frames.get(2)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 5,
      height: 2,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 4,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 0,
              y: 1,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(maxHeight).toBe(2);
    expect(maxWidth).toBe(5);
  });

  test("It works with non-changing frames", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")(["{}"], ["{}"], ["  {}"])
    );
    expect(objects).toEqual({
      id: "2mASZD",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["4oyLa8", { id: "4oyLa8", text: "{", type: expect.any(String) }],
          ["7gBFP", { id: "7gBFP", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.size).toBe(3);
    expect(frames.get(0)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(frames.get(0)).toEqual(frames.get(1));
    expect(frames.get(2)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 3,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(4);
  });

  test("It works with boxes", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")(
        ["{}"],
        [
          "{",
          {
            language: undefined,
            data: {},
            isDecoration: false,
            content: ["null"],
          },
          "}",
        ],
        ["{}"]
      )
    );
    expect(objects).toEqual({
      id: "2mASZD",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["4oyLa8", { id: "4oyLa8", text: "{", type: expect.any(String) }],
          ["7gBFP", { id: "7gBFP", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map([
          [
            "2mASZD",
            {
              id: "2mASZD",
              data: {},
              language: "json",
              content: {
                text: new Map([
                  ["2p3620", { id: "2p3620", text: "null", type: "keyword" }],
                ]),
                decorations: new Map(),
                boxes: new Map(),
              },
            },
          ],
        ]),
      },
    });
    expect(frames.size).toBe(3);
    expect(frames.get(0)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map([
          [
            "2mASZD",
            {
              height: 1,
              id: "2mASZD",
              alpha: 0,
              width: 4,
              x: 1,
              y: 0,
              frame: {
                boxes: new Map(),
                decorations: new Map(),
                text: new Map([
                  [
                    "2p3620",
                    {
                      height: 1,
                      id: "2p3620",
                      alpha: 0,
                      width: 4,
                      x: 1,
                      y: 0,
                    },
                  ],
                ]),
              },
            },
          ],
        ]),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(frames.get(1)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 6,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 5,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map([
          [
            "2mASZD",
            {
              height: 1,
              id: "2mASZD",
              alpha: 1,
              width: 4,
              x: 1,
              y: 0,
              frame: {
                boxes: new Map(),
                decorations: new Map(),
                text: new Map([
                  [
                    "2p3620",
                    {
                      height: 1,
                      id: "2p3620",
                      alpha: 1,
                      width: 4,
                      x: 1,
                      y: 0,
                    },
                  ],
                ]),
              },
            },
          ],
        ]),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(frames.get(2)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map([
          [
            "2mASZD",
            {
              height: 1,
              id: "2mASZD",
              alpha: 0,
              width: 4,
              x: 1,
              y: 0,
              frame: {
                boxes: new Map(),
                decorations: new Map(),
                text: new Map([
                  [
                    "2p3620",
                    {
                      height: 1,
                      id: "2p3620",
                      alpha: 0,
                      width: 4,
                      x: 1,
                      y: 0,
                    },
                  ],
                ]),
              },
            },
          ],
        ]),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(6);
  });

  test("handles multiple objects of the same hash", () => {
    const { objects } = toRenderData(process("json")(["null, null"]));
    expect(objects.content.text.size).toBe(3);
  });

  test("deals with a single frame", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")(["{}"])
    );
    expect(objects).toEqual({
      id: "2mASZD",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["4oyLa8", { id: "4oyLa8", text: "{", type: expect.any(String) }],
          ["7gBFP", { id: "7gBFP", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.size).toBe(1);
    expect(frames.get(0)).toEqual({
      id: "2mASZD",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "4oyLa8",
            {
              id: "4oyLa8",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "7gBFP",
            {
              id: "7gBFP",
              x: 1,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
        ]),
        boxes: new Map(),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(2);
  });

  test("deals with a single empty frame", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")([""])
    );
    expect(objects).toEqual({
      id: "2mASZD",
      data: {},
      language: "json",
      content: {
        text: new Map(),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames).toEqual(
      new Map([
        [
          0,
          {
            frame: {
              boxes: new Map(),
              decorations: new Map(),
              text: new Map(),
            },
            height: 1,
            id: "2mASZD",
            alpha: 1,
            width: 0,
            x: 0,
            y: 0,
          },
        ],
      ])
    );
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(0);
  });

  test("deals with zero frames", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")()
    );
    expect(objects).toEqual({
      id: expect.any(String),
      data: {},
      language: undefined,
      content: {
        text: new Map(),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.size).toBe(0);
    expect(maxHeight).toBe(0);
    expect(maxWidth).toBe(0);
  });
});
