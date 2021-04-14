import { registerLanguage } from "../../src/languages";
import { applyLanguage } from "../../src/lib/language";
import { tokenize } from "../../src/lib/tokenizer";
import { Box } from "../../src/types";
import { type } from "../helpers";

// Test language types tokens "a", "b" as "a" and "b" IF they are directly
// adjacent. This can be used to test the continuous coordinate system.
registerLanguage({
  name: "test",
  definitionFactory: () => (token) => {
    if (
      token.text === "a" &&
      token.next?.text === "b" &&
      token.x + token.width === token.next.x
    ) {
      return "a";
    }
    if (
      token.text === "b" &&
      token.prev?.text === "a" &&
      token.x === token.prev?.x + token.prev?.width
    ) {
      return "b";
    }
    return "f";
  },
  postprocessor: (): boolean => false,
});

describe("Unexpected input", () => {
  test("No input", () => {
    const tokens = type("test")();
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([]);
  });
  test("Whitespace-only input", () => {
    const tokens = type("test")("  ");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([]);
  });
});

describe("Continuous coordinate system", () => {
  test("continuous coordinate system without boxes", () => {
    const tokens = type("test")("a", "b");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["a", "b"]);
  });

  test("continuous coordinate system with boxes", () => {
    const tokens = type("test")("a", {
      id: "box",
      hash: "box",
      language: undefined,
      data: {},
      isDecoration: false,
      content: ["b"], // has x = 0 as the first member of a box
    });
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["a", "b"]);
  });
});

describe("In-place modifications", () => {
  test("It modifies the tokens in-place", () => {
    const subject = tokenize({
      content: ['"Hello World"'],
      hash: "root",
      id: "root",
      isDecoration: false,
      language: "json",
      data: {},
    });
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output).toEqual({
      kind: "BOX",
      x: 0,
      y: 0,
      width: 13,
      height: 1,
      id: "root",
      hash: "root",
      data: {},
      language: "json",
      parent: undefined,
      content: [
        {
          kind: "TEXT",
          x: 0,
          y: 0,
          width: 13,
          height: 1,
          prev: undefined,
          next: undefined,
          text: '"Hello World"',
          type: "string",
          hash: expect.any(String),
          parent: subject,
        },
      ],
      decorations: [],
    });
  });

  test("applying a language leaves boxes untouched", () => {
    const subject = tokenize({
      content: [
        '"Hello',
        {
          content: [" 42 "],
          hash: "nested",
          id: "nested",
          isDecoration: false,
          language: undefined,
          data: {},
        },
        'World"',
      ],
      hash: "root",
      id: "root",
      isDecoration: false,
      language: "json",
      data: {},
    });
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    const nested = output.content[1] as Box<any, any>;
    expect(output).toEqual({
      kind: "BOX",
      x: 0,
      y: 0,
      width: 16,
      height: 1,
      id: "root",
      hash: "root",
      data: {},
      language: "json",
      parent: undefined,
      content: [
        {
          kind: "TEXT",
          x: 0,
          y: 0,
          width: 6,
          height: 1,
          prev: undefined,
          next: nested.content[0],
          text: '"Hello',
          type: "string",
          hash: expect.any(String),
          parent: output,
        },
        {
          kind: "BOX",
          x: 6,
          y: 0,
          width: 4,
          height: 1,
          id: "nested",
          hash: "nested",
          data: {},
          language: "json",
          parent: output,
          content: [
            {
              kind: "TEXT",
              x: 7,
              y: 0,
              width: 2,
              height: 1,
              prev: output.content[0],
              next: output.content[2],
              text: "42",
              parent: nested,
              type: "string",
              hash: expect.any(String),
            },
          ],
          decorations: [],
        },
        {
          kind: "TEXT",
          x: 10,
          y: 0,
          width: 6,
          height: 1,
          prev: nested.content[0],
          next: undefined,
          text: 'World"',
          type: "string",
          hash: expect.any(String),
          parent: output,
        },
      ],
      decorations: [],
    });
  });

  test("applying a language leaves decorations untouched", () => {
    const subject = tokenize({
      content: [
        '"Hello',
        {
          content: [" 42 "],
          hash: "highlight",
          id: "highlight",
          isDecoration: true,
          language: undefined,
          data: {},
        },
        'World"',
      ],
      hash: "root",
      id: "root",
      isDecoration: false,
      language: "json",
      data: {},
    });
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output).toEqual({
      kind: "BOX",
      x: 0,
      y: 0,
      width: 16,
      height: 1,
      id: "root",
      hash: "root",
      data: {},
      language: "json",
      parent: undefined,
      content: [
        {
          kind: "TEXT",
          x: 0,
          y: 0,
          width: 16,
          height: 1,
          prev: undefined,
          next: undefined,
          text: '"Hello 42 World"',
          type: "string",
          hash: expect.any(String),
          parent: output,
        },
      ],
      decorations: [
        {
          kind: "DECO",
          x: 6,
          y: 0,
          width: 4,
          height: 1,
          hash: "highlight",
          data: {},
          parent: output,
        },
      ],
    });
  });

  test("inherits the language to nested boxes where undefined", () => {
    const input = {
      content: [
        {
          id: "level1",
          hash: "level1",
          language: undefined, // should turn into "json"
          isDecoration: false,
          data: {},
          content: ["null"],
        },
      ],
      hash: "root",
      id: "root",
      isDecoration: false,
      language: "json",
      data: {},
    };
    const subject = tokenize(input);
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output.content[0]).toHaveProperty("language", "json");
  });

  test("does not overwrite nested boxes languages", () => {
    const input = {
      content: [
        {
          id: "level1",
          hash: "level1",
          language: "html", // should remain as it is
          isDecoration: false,
          data: {},
          content: ["null"],
        },
      ],
      hash: "root",
      id: "root",
      isDecoration: false,
      language: "json",
      data: {},
    };
    const subject = tokenize(input);
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output.content[0]).toHaveProperty("language", "html");
  });
});
