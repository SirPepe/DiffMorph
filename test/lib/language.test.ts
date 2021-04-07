import { languageDefinition } from "../../src/languages/json";
import { applyLanguage } from "../../src/lib/language";
import { tokenize } from "../../src/lib/tokenizer";
import { Box } from "../../src/types";

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
              x: 1,
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
