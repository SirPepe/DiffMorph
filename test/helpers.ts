import { applyLanguage } from "../src/lib/language";
import { tokenize } from "../src/lib/tokenizer";
import { flattenTokens, getFirstTextToken } from "../src/lib/util";
import { Box, Code, Highlight, LanguageDefinition, TypedToken } from "../src/types";

type BoxArgs <T> = {
  tokens: (T | BoxArgs<T>)[];
  id?: string;
  hash?: string;
  language?: string;
  meta?: Record<string, any>;
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
    id = nested ? `nested-${nested}` : "root",
    hash = nested ? `nested-${nested}` : "root",
    language = "none",
    meta = {},
    tokens = [],
  } = args;
  const result: Box<T> = {
    type: "BOX",
    id,
    hash,
    language,
    meta,
    tokens: [],
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
): Box<TypedToken | Highlight> => {
  return applyLanguage(
    language,
    tokenize({
      content: input,
      hash: "root",
      id: "root",
      language: lang.name,
      isHighlight: false,
      meta: { isHighlight: false },
    })
  );
};

export const type = (language: LanguageDefinition<any>) => (
  ...input: Code[]
): TypedToken[] => {
  return flattenTokens(getFirstTextToken([lang(language)(...input)]));
};
