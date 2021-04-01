import { languageDefinition } from "../../src/languages/json";
import { applyLanguage } from "../../src/lib/language";
import { tokenize } from "../../src/lib/tokenizer";
import { Box } from "../../src/types";

const applyJSON = (input: Box<any>) => applyLanguage(
  {
    name: languageDefinition.name,
    definitionFactory: () =>
      languageDefinition.definitionFactory({ comments: false }),
    postprocessor: languageDefinition.postprocessor,
  },
  input
);

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
      type: "BOX",
      id: "root",
      hash: "root",
      language: "json",
      data: {},
      tokens: [
        {
          x: 0,
          y: 0,
          prev: undefined,
          next: undefined,
          text: '"Hello World"',
          size: 13,
          parent: subject,
          type: "string",
          hash: expect.any(String),
        },
      ],
    });
  });

  test("It leaves boxes untouched", () => {
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
      type: "BOX",
      id: "root",
      hash: "root",
      language: "json",
      data: {},
      tokens: [
        {
          x: 0,
          y: 0,
          prev: undefined,
          next: nested.tokens[0],
          text: '"Hello',
          size: 6,
          parent: output,
          type: "string",
          hash: expect.any(String),
        },
        {
          type: "BOX",
          id: "nested",
          hash: "nested",
          data: {},
          language: "json",
          tokens: [{
            x: 7,
            y: 0,
            prev: output.tokens[0],
            next: output.tokens[2],
            text: '42',
            size: 2,
            parent: nested,
            type: "string",
            hash: expect.any(String),
          }]
        },
        {
          x: 0,
          y: 0,
          prev: nested.tokens[0],
          next: undefined,
          text: 'World"',
          size: 6,
          parent: output,
          type: "string",
          hash: expect.any(String),
        },
      ],
    });
  });

  test("It leaves highlights untouched", () => {
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
      type: "BOX",
      id: "root",
      hash: "root",
      language: "json",
      data: {},
      tokens: [
        {
          x: 0,
          y: 0,
          prev: undefined,
          next: undefined,
          text: '"Hello 42 World"',
          size: 16,
          parent: expect.any(Object),
          type: "string",
          hash: expect.any(String),
        },
        {
          type: "HIGHLIGHT",
          id: "highlight",
          hash: "highlight",
          data: {},
          start: [6, 0],
          end: [10, 0],
        }
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
          content: [
            "null"
          ],
        }
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
          content: [
            "null"
          ],
        }
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
