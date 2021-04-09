import { diff } from "../../src/lib/diff";
import { languageDefinition } from "../../src/languages/json";
import { toRenderData } from "../../src/lib/render";
import { toData } from "../../src/output/toData";
import { lang } from "../helpers";
const json = lang(languageDefinition);

describe("toDom", () => {
  test("renders tokens to data", () => {
    const keyframes = toRenderData(
      diff([json("{}"), json("  {}"), json("    {\n}")])
    );
    const data = toData(keyframes);
  });
});
