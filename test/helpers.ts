import { applyLanguage } from "../src/lib/language";
import { tokenize } from "../src/lib/tokenizer";
import { flattenTokens, unwrapFirst } from "../src/lib/util";
import { Code, LanguageDefinition, TypedToken } from "../src/types";

export const type = (lang: LanguageDefinition<any>) => (
  ...input: Code[]
): TypedToken[] => {
  return flattenTokens(
    unwrapFirst(
      applyLanguage(
        lang,
        tokenize({
          content: input,
          hash: "root",
          id: "root",
          language: lang.name,
          isHighlight: false,
          meta: { isHighlight: false },
        }).root
      )
    )
  );
};
