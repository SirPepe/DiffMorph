import { registerLanguage } from "../../src/languages";
import { applyLanguage } from "../../src/language/language";
import { tokenize } from "../../src/input/tokenizer";
import { Box } from "../../src/types";
import { lang, type } from "../helpers";

// Test language types tokens "a", "b" as "a" and "b" IF they are directly
// adjacent. This can be used to test the continuous coordinate system.
registerLanguage({
  name: "test",
  theme: {},
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

describe("Basic input", () => {
  test("Basic JSON object", () => {
    const parent = lang("json")(`{}`);
    expect(parent.content).toEqual([
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        text: "{",
        type: "punctuation object-start-0",
        parent,
        next: parent.content[1],
        prev: undefined,
      },
      {
        x: 1,
        y: 0,
        width: 1,
        height: 1,
        text: "}",
        type: "punctuation object-end-0",
        parent,
        next: undefined,
        prev: parent.content[0],
      },
    ]);
  });

  test("Basic JSON box", () => {
    const parent = lang("json")(
      "[",
      {
        data: {},
        content: ["null"],
        isDecoration: false,
        language: undefined,
      },
      "]"
    );
    expect(parent.content).toEqual([
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        text: "[",
        type: "punctuation array-start-0",
        parent,
        next: (parent.content[1] as any).content[0],
        prev: undefined,
      },
      {
        x: 1,
        y: 0,
        height: 1,
        width: 4,
        language: "json",
        data: {},
        content: [
          {
            x: 1,
            y: 0,
            width: 4,
            height: 1,
            text: "null",
            type: "keyword",
            parent: parent.content[1],
            next: parent.content[2],
            prev: parent.content[0],
          },
        ],
        decorations: [],
        parent,
      },
      {
        x: 5,
        y: 0,
        width: 1,
        height: 1,
        text: "]",
        type: "punctuation array-end-0",
        parent,
        next: undefined,
        prev: (parent.content[1] as any).content[0],
      },
    ]);
  });

  test("JSON box between theoretically joinable tokens", () => {
    const types = type("json")(
      '{"foo',
      {
        data: {
          tagName: "span",
          attributes: [],
        },
        content: ['bar"'],
        isDecoration: false,
        language: undefined,
      },
      ": 42}"
    );
    expect(types).toEqual([
      "punctuation object-start-0", // {
      "string", // "foo
      "string", // bar" (inside box, must not be joined with rest)
      "punctuation", // :
      "number", // 42
      "punctuation object-end-0", // }
    ]);
  });
});

describe("Unexpected input", () => {
  test("No input", () => {
    const types = type("test")();
    expect(types).toEqual([]);
  });
  test("Whitespace-only input", () => {
    const types = type("test")("  ");
    expect(types).toEqual([]);
  });
});

describe("Continuous coordinate system", () => {
  test("continuous coordinate system without boxes", () => {
    const types = type("test")("a", "b");
    expect(types).toEqual(["a", "b"]);
  });

  test("continuous coordinate system with boxes", () => {
    const types = type("test")("a", {
      language: undefined,
      data: {},
      isDecoration: false,
      content: ["b"], // has x = 0 as the first member of a box
    });
    expect(types).toEqual(["a", "b"]);
  });
});

describe("In-place modifications", () => {
  test("It modifies the tokens in-place", () => {
    const subject = tokenize(
      {
        content: ['"Hello World"'],
        isDecoration: false,
        language: "json",
        data: {},
      },
      2
    );
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output).toEqual({
      x: 0,
      y: 0,
      width: 13,
      height: 1,
      data: {},
      language: "json",
      parent: undefined,
      content: [
        {
          x: 0,
          y: 0,
          width: 13,
          height: 1,
          prev: undefined,
          next: undefined,
          text: '"Hello World"',
          type: "string",
          parent: subject,
        },
      ],
      decorations: [],
    });
  });

  test("applying a language leaves boxes untouched", () => {
    const subject = tokenize(
      {
        content: [
          '"Hello',
          {
            content: [" 42 "],
            isDecoration: false,
            language: undefined,
            data: {},
          },
          'World"',
        ],
        isDecoration: false,
        language: "json",
        data: {},
      },
      2
    );
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    const nested = output.content[1] as Box<any, any>;
    expect(output).toEqual({
      x: 0,
      y: 0,
      width: 16,
      height: 1,
      data: {},
      language: "json",
      parent: undefined,
      content: [
        {
          x: 0,
          y: 0,
          width: 6,
          height: 1,
          prev: undefined,
          next: nested.content[0],
          text: '"Hello',
          type: "string",
          parent: output,
        },
        {
          x: 6,
          y: 0,
          width: 4,
          height: 1,
          data: {},
          language: "json",
          parent: output,
          content: [
            {
              x: 7,
              y: 0,
              width: 2,
              height: 1,
              prev: output.content[0],
              next: output.content[2],
              text: "42",
              parent: nested,
              type: "string",
            },
          ],
          decorations: [],
        },
        {
          x: 10,
          y: 0,
          width: 6,
          height: 1,
          prev: nested.content[0],
          next: undefined,
          text: 'World"',
          type: "string",
          parent: output,
        },
      ],
      decorations: [],
    });
  });

  test("applying a language leaves decorations untouched", () => {
    const subject = tokenize(
      {
        content: [
          '"Hello',
          {
            content: [" 42 "],
            isDecoration: true,
            language: undefined,
            data: {},
          },
          'World"',
        ],
        isDecoration: false,
        language: "json",
        data: {},
      },
      2
    );
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output).toEqual({
      x: 0,
      y: 0,
      width: 16,
      height: 1,
      data: {},
      language: "json",
      parent: undefined,
      content: [
        {
          x: 0,
          y: 0,
          width: 16,
          height: 1,
          prev: undefined,
          next: undefined,
          text: '"Hello 42 World"',
          type: "string",
          parent: output,
        },
      ],
      decorations: [
        {
          x: 6,
          y: 0,
          width: 4,
          height: 1,
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
          language: undefined, // should turn into "json"
          isDecoration: false,
          data: {},
          content: ["null"],
        },
      ],
      isDecoration: false,
      language: "json",
      data: {},
    };
    const subject = tokenize(input, 2);
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output.content[0]).toHaveProperty("language", "json");
  });

  test("does not overwrite nested boxes languages", () => {
    const input = {
      content: [
        {
          language: "html", // should remain as it is
          isDecoration: false,
          data: {},
          content: ["null"],
        },
      ],
      isDecoration: false,
      language: "json",
      data: {},
    };
    const subject = tokenize(input, 2);
    const output = applyLanguage(subject);
    expect(output).toBe(subject);
    expect(output.content[0]).toHaveProperty("language", "html");
  });
});
