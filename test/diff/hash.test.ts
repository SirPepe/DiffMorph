import { hash, offsetHashChain } from "../../src/diff/hash";

describe("hash()", () => {
  test("hashing values", () => {
    expect(hash(["a"])).toBe(3826002220);
    expect(hash(["b"])).toBe(3876335077);
    expect(hash(["ab"])).toBe(1294271946);
    expect(hash(["a", "b"])).toBe(606870085);
    expect(hash(["a", 1])).toBe(4046178812);
  });
});

describe("offsetHashChain()", () => {
  test("chaining equivalent objects with equal offsets", () => {
    const input1 = [
      { hash: "a", x: 0, y: 0 },
      { hash: "b", x: 2, y: 0 },
    ];
    const input2 = [
      { hash: "a", x: 0, y: 0 },
      { hash: "b", x: 2, y: 0 },
    ];
    expect(offsetHashChain(input1)).toBe(offsetHashChain(input2));
  });

  test("chaining equivalent objects with non-equal offsets", () => {
    const input1 = [
      { hash: "a", x: 0, y: 0 },
      { hash: "b", x: 2, y: 0 },
    ];
    const input2 = [
      { hash: "a", x: 0, y: 0 },
      { hash: "b", x: 2, y: 1 },
    ];
    expect(offsetHashChain(input1)).not.toBe(offsetHashChain(input2));
  });

  test("chaining non-equivalent objects with equal offsets", () => {
    const input1 = [
      { hash: "a", x: 0, y: 0 },
      { hash: "b", x: 2, y: 0 },
    ];
    const input2 = [
      { hash: "a", x: 0, y: 0 },
      { hash: "c", x: 2, y: 0 },
    ];
    expect(offsetHashChain(input1)).not.toBe(offsetHashChain(input2));
  });

  test("chaining equivalent objects with equivalent offsets", () => {
    const input1 = [
      { hash: "a", x: 0, y: 0 },
      { hash: "b", x: 2, y: 0 },
    ];
    const input2 = [
      { hash: "a", x: 0, y: 1 },
      { hash: "b", x: 2, y: 1 },
    ];
    expect(offsetHashChain(input1)).toBe(offsetHashChain(input2));
  });
});
