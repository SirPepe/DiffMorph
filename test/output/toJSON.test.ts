import { toRenderData } from "../../src/lib/render";
import { toJSON } from "../../src/output/toJSON";
import { process } from "../helpers";

describe("toJSON", () => {
  test("turns render data into JSON", () => {
    const renderData = toRenderData(
      process("json")(
        ["{}"],
        ["  {}"],
        ["    {\n}"],
      )
    );
    const text = toJSON(renderData);
    expect(typeof text).toBe("string");
  });
});
