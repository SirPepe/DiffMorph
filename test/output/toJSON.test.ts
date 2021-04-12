import { diff } from "../../src/lib/diff";
import { languageDefinition } from "../../src/languages/json";
import { toRenderData } from "../../src/lib/render";
import { toJSON } from "../../src/output/toJSON";
import { lang } from "../helpers";
const json = lang(languageDefinition);

describe("toJSON", () => {
  test("turns render data into JSON", () => {
    const renderData = toRenderData(
      diff([json("{}"), json("  {}"), json("    {\n}")])
    );
    const text = toJSON(renderData);
    expect(typeof text).toBe("string");
  });
});
