import { diff } from "../../src/lib/diff";
import { toLifecycle } from "../../src/lib/lifecycle";
import { optimizeDiffs } from "../../src/lib/optimize";
import { Box, Decoration } from "../../src/types";
import { lang } from "../helpers";
const tokenize = lang("none");

describe("asdf", () => {
  test("tets", () => {
    const res = toLifecycle(optimizeDiffs(diff([tokenize(".."), tokenize(". .")])));
    console.log(res);
  });
});
