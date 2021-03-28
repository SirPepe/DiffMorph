import { languageDefinition } from "../../src/languages/json";
import { applyLanguage } from "../../src/lib/language";
import { tokenize } from "../../src/lib/tokenizer";
import { Box, TextToken } from "../../src/types";

const applyJSON = (input: Box<TextToken>) => applyLanguage(
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
      isHighlight: false,
      language: "json",
      meta: {},
    }).root;
    const output = applyJSON(subject);
    expect(output).toBe(subject);
    expect(output).toEqual({
      id: "root",
      hash: "root",
      language: "json",
      meta: {},
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
      parent: undefined,
    });
  });

  test("inherits the language to nested boxes where undefined", () => {
    const input = {
      content: [
        {
          id: "level1",
          hash: "level1",
          language: undefined, // should turn into "json"
          isHighlight: false,
          meta: {},
          content: [
            "null"
          ],
        }
      ],
      hash: "root",
      id: "root",
      isHighlight: false,
      language: "json",
      meta: {},
    };
    const subject = tokenize(input).root;
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
          isHighlight: false,
          meta: {},
          content: [
            "null"
          ],
        }
      ],
      hash: "root",
      id: "root",
      isHighlight: false,
      language: "json",
      meta: {},
    };
    const subject = tokenize(input).root;
    const output = applyJSON(subject);
    expect(output).toBe(subject);
    expect(output.tokens[0]).toHaveProperty("language", "html");
  });
});
