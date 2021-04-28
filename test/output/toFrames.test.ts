import { toRenderData } from "../../src/lib/render";
import { toFrames } from "../../src/output/toFrames";
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
    const {frames, maxWidth, maxHeight} = toFrames(renderData, 3);
    expect(maxWidth).toBe(4);
    expect(maxHeight).toBe(1);
    console.log(frames.get(0)?.frame?.text);
    console.log(frames.get(1)?.frame?.text);
    console.log(frames.get(2)?.frame?.text);
    console.log(frames.get(3)?.frame?.text);
    console.log(frames.get(4)?.frame?.text);
    console.log(frames.get(5)?.frame?.text);
    console.log(frames.get(6)?.frame?.text);
  });
});
