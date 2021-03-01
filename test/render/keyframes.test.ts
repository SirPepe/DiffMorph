import { diffAll } from "../../src/diff";
import language from "../../src/languages/json";
import { toKeyframes } from "../../src/render/keyframes";
import { type } from "../helpers";
const json = type(language);

describe("Keyframes", () => {
  test("It turns some JSON into keyframes", () => {
    const diffs = diffAll([json("{}"), json("  {}"), json("    {}")]);
    const keyframes = toKeyframes(diffs);
    expect(keyframes.length).toBe(3);
    // All keyframe token ids should be equal
    const aids = Array.from(keyframes[0].keys());
    const bids = Array.from(keyframes[1].keys());
    const cids = Array.from(keyframes[2].keys());
    expect(aids).toEqual(bids);
    expect(bids).toEqual(cids);
  });
});
