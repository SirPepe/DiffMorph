import { diff } from "../../src/lib/diff";
import { languageDefinition } from "../../src/languages/json";
import { toRenderData } from "../../src/lib/render";
import { lang } from "../helpers";
const json = lang(languageDefinition);

describe("rendering", () => {
  test("It turns some JSON into keyframes", () => {
    const diffs = diff([json("{}"), json("  {}"), json("    {\n}")]);
    const keyframes = toRenderData(diffs);
    expect(keyframes.length).toBe(3);
    // All keyframe token ids should be equal
    const aids = Array.from(keyframes[0].tokens.keys());
    const bids = Array.from(keyframes[1].tokens.keys());
    const cids = Array.from(keyframes[2].tokens.keys());
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
    const diffs = diff([json("{}"), json("{}"), json("{\n}")]);
    const keyframes = toRenderData(diffs);
    expect(keyframes.length).toBe(3);
  });
});
