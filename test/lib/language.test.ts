import { languageDefinition } from "../../src/languages/json";
import { applyLanguage } from "../../src/lib/language";
import { tokenize } from "../../src/lib/tokenizer";

describe("In-place modifications", () => {
  test("It modifies the tokens and boxes in-place", () => {
    const subject = tokenize({
      content: ['"Hello World"'],
      hash: "root",
      id: "root",
      meta: { isHighlight: false },
    }).root;
    applyLanguage(
      {
        definitionFactory: () =>
          languageDefinition.definitionFactory({ comments: false }),
        postprocessor: languageDefinition.postprocessor,
      },
      subject
    );
    expect(subject).toEqual({
      id: "root",
      hash: "root",
      meta: { isHighlight: false },
      tokens: [
        {
          x: 0,
          y: 0,
          prev: undefined,
          next: undefined,
          text: '"Hello World"',
          size: 13,
          parent: subject,
          type: expect.any(String),
          hash: expect.any(String),
        },
      ],
    });
  });
});
