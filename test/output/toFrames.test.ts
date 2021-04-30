import { toRenderData } from "../../src/lib/render";
import { tweenFrames } from "../../src/output/toFrames";
import { process } from "../helpers";

describe("toFrames", () => {
  test("interpolate frames", () => {
    const renderData = toRenderData(
      process("json")(
        ["{}"],
        ["  {}"],
        ["{}"],
      )
    );
    const frames = tweenFrames(renderData.frames, 3);
    expect(frames.size).toBe(9); // 3 * 3
  });
});
