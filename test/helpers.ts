import { applyLanguage } from "../src/lib/language";
import { tokenize } from "../src/lib/tokenizer";
import { flattenTokens, getFirstTextToken } from "../src/lib/util";
import { Box, Code, Decoration, LanguageDefinition, TypedToken } from "../src/types";

type BoxArgs <T> = {
  x: number;
  y: number;
  tokens?: (T | BoxArgs<T>)[];
  id?: string;
  hash?: string;
  language?: string;
  data?: Record<string, any>;
  parent?: any;
};

function isBoxArgs<T>(x: any | BoxArgs<T>): x is BoxArgs<T> {
  return typeof x.x === "undefined" && typeof x.y === "undefined";
}

export function stubBox<T>(
  args: BoxArgs<T>,
  nested = 0,
  parent?: Box<T>
): Box<T> {
  const {
    x = 0,
    y = 0,
    id = nested ? `nested-${nested}` : "root",
    hash = nested ? `nested-${nested}` : "root",
    language = "none",
    data = {},
    tokens = [],
  } = args;
  const result: Box<T> = {
    kind: "BOX",
    x,
    y,
    id,
    hash,
    width: 0,
    height: 0,
    language,
    data,
    tokens: [],
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
): Box<TypedToken | Decoration> => {
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
