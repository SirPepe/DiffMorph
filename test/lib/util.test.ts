import { createIdGenerator } from "../../src/lib/util";

describe("createIdGenerator()", () => {
  test("unique id generation", () => {
    const generator = createIdGenerator();
    const a = generator(null, "a");
    const b = generator(null, "a");
    const c = generator(null, "a");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });
});
