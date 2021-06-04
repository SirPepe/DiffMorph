import {
  createUniqueHashGenerator,
  hash,
  naiveHashChain,
  offsetHashChain,
} from "../../src/diff/hash";

describe("hash()", () => {
  test("hashing values", () => {
    expect(hash(["a"])).toBe(3826002220);
    expect(hash(["b"])).toBe(3876335077);
    expect(hash(["ab"])).toBe(1294271946);
    expect(hash(["a", "b"])).toBe(606870085);
    expect(hash(["a", 1])).toBe(4046178812);
  });
});

describe("naiveHashChain()", () => {
  test("chaining hashes", () => {
    expect(naiveHashChain([{ hash: hash(["a"]) }])).toBe(1854020216);
    expect(naiveHashChain([{ hash: hash(["a", "b"]) }])).toBe(2165335541);
  });
  test("distinct results from just hashes over values", () => {
    const a = naiveHashChain([{ hash: hash(["a"]) }, { hash: hash(["b"]) }]);
    const b = naiveHashChain([{ hash: hash(["a", "b"]) }]);
    expect(a).not.toBe(b);
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

describe("createUniqueHashGenerator()", () => {
  test("unique hash generation", () => {
    const generator = createUniqueHashGenerator();
    const a = generator(["a"]);
    const b = generator(["a"]);
    const c = generator(["a"]);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });

  test("unique hash generation can't be guessed", () => {
    const generator = createUniqueHashGenerator();
    const a = generator(["a"]);
    const b = generator(["a", 0]);
    const c = generator(["a", 1]);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });
});
