import { applyLanguage } from "../src/lib/language";
import { tokenize } from "../src/lib/tokenizer";
import { flattenTokens, getFirstTextToken } from "../src/lib/util";
import {
  Box,
  Code,
  Decoration,
  LanguageDefinition,
  TypedToken,
} from "../src/types";

type BoxArgs<T, D> = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tokens?: (T | BoxArgs<T, D>)[];
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
    tokens = [],
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
    tokens: [],
    decorations,
    parent,
  };
  result.tokens = tokens.map((token) => {
    if (isBoxArgs(token)) {
      return stubBox(token, nested + 1, result);
    } else {
      return token;
    }
  });
  return result;
}

export const lang = (language: LanguageDefinition<any>) => (
  ...input: Code[]
): Box<TypedToken, Decoration<TypedToken>> => {
  return applyLanguage(
    language,
    tokenize({
      content: input,
      hash: "root",
      id: "root",
      language: lang.name,
      isDecoration: false,
      data: {},
    })
  );
};

export const type = (language: LanguageDefinition<any>) => (
  ...input: Code[]
): TypedToken[] => {
  return flattenTokens(getFirstTextToken([lang(language)(...input)]));
};
