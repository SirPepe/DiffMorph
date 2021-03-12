import { diffAll } from "../../src/diff";
import * as language from "../../src/languages/json";
import { toKeyframes } from "../../src/render/keyframes";
import { type } from "../helpers";
const json = type(language);

describe("Keyframes", () => {
  test("It turns some JSON into keyframes", () => {
    const diffs = diffAll([json("{}"), json("  {}"), json("    {\n}")]);
    const keyframes = toKeyframes(diffs);
    expect(keyframes.length).toBe(3);
    // All keyframe token ids should be equal
    const aids = Array.from(keyframes[0].data.keys());
    const bids = Array.from(keyframes[1].data.keys());
    const cids = Array.from(keyframes[2].data.keys());
    expect(aids).toEqual(bids);
    expect(bids).toEqual(cids);
    expect(keyframes[0].width).toBe(2);
    expect(keyframes[1].width).toBe(4);
    expect(keyframes[2].width).toBe(5);
    expect(keyframes[0].height).toBe(1);
    expect(keyframes[1].height).toBe(1);
    expect(keyframes[2].height).toBe(2);
  });

  test("does not explode when a line break gets inserted after two identical frames", () => {
    const diffs = diffAll([json("{}"), json("{}"), json("{\n}")]);
    const keyframes = toKeyframes(diffs);
    expect(keyframes.length).toBe(3);
  });
});
