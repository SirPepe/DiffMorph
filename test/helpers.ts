import { diff } from "../src/lib/diff";
import { applyLanguage } from "../src/lib/language";
import { toLifecycle } from "../src/lib/lifecycle";
import { optimizeDiffs } from "../src/lib/optimize";
import { tokenize } from "../src/lib/tokenizer";
import { flattenTokens, getFirstTextToken } from "../src/lib/util";
import { Box, Code, Decoration, TypedToken } from "../src/types";

type BoxArgs<T, D> = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  content?: (T | BoxArgs<T, D>)[];
  decorations?: D[];
  id?: string;
  hash?: string;
  language?: string;
  data?: Record<string, any>;
  parent?: any;
};

function isBoxArgs<T, D>(x: any | BoxArgs<T, D>): x is BoxArgs<T, D> {
  return typeof x.x === "undefined" && typeof x.y === "undefined";
}

export function stubBox<T, D>(
  args: BoxArgs<T, D>,
  nested = 0,
  parent?: Box<T, D>
): Box<T, D> {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    id = nested ? `nested-${nested}` : "root",
    hash = nested ? `nested-${nested}` : "root",
    language = "none",
    data = {},
    content = [],
    decorations = [],
  } = args;
  const result: Box<T, D> = {
    kind: "BOX",
    x,
    y,
    id,
    hash,
    width,
    height,
    language,
    data,
    content: [],
    decorations,
    parent,
  };
  result.content = content.map((token) => {
    if (isBoxArgs(token)) {
      return stubBox(token, nested + 1, result);
    } else {
      return token;
    }
  });
  return result;
}

export const lang = (language: string) => (
  ...input: Code[]
): Box<TypedToken, Decoration<TypedToken>> => {
  return applyLanguage(
    tokenize(
      {
        content: input,
        hash: "root",
        id: "root",
        language,
        isDecoration: false,
        data: {},
      },
      2
    )
  );
};

export const type = (language: string) => (...input: Code[]): TypedToken[] => {
  return flattenTokens(getFirstTextToken([lang(language)(...input)]));
};

export const process = (language: string) => (...input: Code[][]) =>
  toLifecycle(
    optimizeDiffs(diff(input.map((code) => lang(language)(...code)))),
    true
  );
