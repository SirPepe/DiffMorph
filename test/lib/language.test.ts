import { languageDefinition } from "../../src/languages/json";
import { applyLanguage } from "../../src/lib/language";
import { tokenize } from "../../src/lib/tokenizer";
import { Box, LanguageDefinition } from "../../src/types";
import { type } from "../helpers";

const applyJSON = (input: Box<any>) =>
  applyLanguage(
    {
      name: languageDefinition.name,
      definitionFactory: () =>
        languageDefinition.definitionFactory({ comments: false }),
      postprocessor: languageDefinition.postprocessor,
    },
    input
  );

// Test language types tokens "a", "b" as "a" and "b" IF they are directly
// adjacent. This can be used to test the token proxies, which simulate a
// continuous coordinate system.
const testLanguage: LanguageDefinition<Record<string, any>> = {
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
};

describe("Continuous coordinate system", () => {
  test("continuous coordinate system without boxes", () => {
    const tokens = type(testLanguage)("a", "b");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["a", "b"]);
  });

  test("continuous coordinate system with boxes", () => {
    const tokens = type(testLanguage)("a", {
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
    const output = applyJSON(subject);
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
      tokens: [
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
    const output = applyJSON(subject);
    expect(output).toBe(subject);
    const nested = output.tokens[1] as Box<any>;
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
      tokens: [
        {
          kind: "TEXT",
          x: 0,
          y: 0,
          width: 6,
          height: 1,
          prev: undefined,
          next: nested.tokens[0],
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
          tokens: [
            {
              kind: "TEXT",
              x: 7,
              y: 0,
              width: 2,
              height: 1,
              prev: output.tokens[0],
              next: output.tokens[2],
              text: "42",
              parent: nested,
              type: "string",
              hash: expect.any(String),
            },
          ],
        },
        {
          kind: "TEXT",
          x: 10,
          y: 0,
          width: 6,
          height: 1,
          prev: nested.tokens[0],
          next: undefined,
          text: 'World"',
          type: "string",
          hash: expect.any(String),
          parent: output,
        },
      ],
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
    const output = applyJSON(subject);
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
      tokens: [
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
    const output = applyJSON(subject);
    expect(output).toBe(subject);
    expect(output.tokens[0]).toHaveProperty("language", "json");
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
    const output = applyJSON(subject);
    expect(output).toBe(subject);
    expect(output.tokens[0]).toHaveProperty("language", "html");
  });
});
