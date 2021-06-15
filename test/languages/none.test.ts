import { type } from "../helpers";

describe("None", () => {
  test("Basic smoke test", () => {
    const types = type("none")(".:.");
    expect(types).toEqual([ "token", "token", "token" ]);
  });
});
