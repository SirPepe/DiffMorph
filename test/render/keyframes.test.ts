import { diffAll } from "../../src/diff";
import language from "../../src/languages/json";
import { toKeyframes } from "../../src/render/keyframes";
import { type } from "../helpers";
const json = type(language);

describe.only("asdf", () => {
  test("asdf", () => {
    const diffs = diffAll([json("{}"), json("  {}"), json("    {}")]);
    const keyframes = toKeyframes(diffs);
    console.log(keyframes);
  });
});
