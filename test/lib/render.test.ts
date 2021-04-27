import { toRenderData } from "../../src/lib/render";
import { process } from "../helpers";

describe("rendering", () => {
  test("It turns some JSON into render data", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")(
        ["{}"],
        ["  {}"],
        ["    {\n}"],
      ),
    );
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["q6cs7w0", { id: "q6cs7w0", text: "{", type: expect.any(String) }],
          ["ij1r2g0", { id: "ij1r2g0", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.size).toBe(3);
    expect(frames.get(0)).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
      id: "root",
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
      id: "root",
      x: 0,
      y: 0,
      width: 5,
      height: 2,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 4,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
      process("json")(
        ["{}"],
        ["{}"],
        ["  {}"],
      )
    );
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["q6cs7w0", { id: "q6cs7w0", text: "{", type: expect.any(String) }],
          ["ij1r2g0", { id: "ij1r2g0", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.size).toBe(3);
    expect(frames.get(0)).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
      id: "root",
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 2,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
            id: "box",
            hash: "asdf",
            language: undefined,
            data: {},
            isDecoration: false,
            content: ["null"],
          },
          "}",
        ],
        ["{}"],
      )
    );
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["q6cs7w0", { id: "q6cs7w0", text: "{", type: expect.any(String) }],
          ["ij1r2g0", { id: "ij1r2g0", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map([
          [
            "box", {
              id: "box",
              data: {},
              language: "json",
              content: {
                text: new Map([
                  [
                    "j5gb800",
                    { id: "j5gb800", text: "null", type: "keyword" },
                  ],
                ]),
                decorations: new Map(),
                boxes: new Map(),
              }
            }
          ]
        ]),
      },
    });
    expect(frames.size).toBe(3);
    expect(frames.get(0)).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
            "box",
            {
              height: 1,
              id: "box",
              alpha: 0,
              width: 4,
              x: 1,
              y: 0,
              frame: {
                boxes: new Map(),
                decorations: new Map(),
                text: new Map([
                  [
                    "j5gb800",
                    {
                      height: 1,
                      id: "j5gb800",
                      alpha: 0,
                      width: 4,
                      x: 1,
                      y: 0,
                    }
                  ],
                ]),
              },
             },
          ]
        ]),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(frames.get(1)).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 6,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
            "box",
            {
              height: 1,
              id: "box",
              alpha: 1,
              width: 4,
              x: 1,
              y: 0,
              frame: {
                boxes: new Map(),
                decorations: new Map(),
                text: new Map([
                  [
                    "j5gb800",
                    {
                      height: 1,
                      id: "j5gb800",
                      alpha: 1,
                      width: 4,
                      x: 1,
                      y: 0,
                    }
                  ],
                ]),
              },
             },
          ]
        ]),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(frames.get(2)).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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
            "box",
            {
              height: 1,
              id: "box",
              alpha: 0,
              width: 4,
              x: 1,
              y: 0,
              frame: {
                boxes: new Map(),
                decorations: new Map(),
                text: new Map([
                  [
                    "j5gb800",
                    {
                      height: 1,
                      id: "j5gb800",
                      alpha: 0,
                      width: 4,
                      x: 1,
                      y: 0,
                    }
                  ],
                ]),
              },
             },
          ]
        ]),
        decorations: new Map(),
      },
      alpha: 1,
    });
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(6);
  });

  test("handles multiple objects of the same hash", () => {
    const { objects } = toRenderData(
      process("json")(["null, null"])
    );
    expect(objects.content.text.size).toBe(3)
  });

  test("deals with a single frame", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")(["{}"])
    );
    expect(objects).toEqual({
      id: "root",
      data: {},
      language: "json",
      content: {
        text: new Map([
          ["q6cs7w0", { id: "q6cs7w0", text: "{", type: expect.any(String) }],
          ["ij1r2g0", { id: "ij1r2g0", text: "}", type: expect.any(String) }],
        ]),
        decorations: new Map(),
        boxes: new Map(),
      },
    });
    expect(frames.size).toBe(1);
    expect(frames.get(0)).toEqual({
      id: "root",
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      frame: {
        text: new Map([
          [
            "q6cs7w0",
            {
              id: "q6cs7w0",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              alpha: 1,
            },
          ],
          [
            "ij1r2g0",
            {
              id: "ij1r2g0",
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

  test("deals with a single empty frame frame", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")([""])
    );
    expect(objects).toEqual({
      id: "root",
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
            id: "root",
            alpha: 1,
            width: 0,
            x: 0,
            y: 0,
          },
        ]
      ]
    ));
    expect(maxHeight).toBe(1);
    expect(maxWidth).toBe(0);
  });

  test("deals with zero frames", () => {
    const { objects, frames, maxWidth, maxHeight } = toRenderData(
      process("json")()
    );
    expect(objects).toEqual({
      id: "",
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
