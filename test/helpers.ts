import { applyLanguage } from "../src/lib/language";
import { tokenize } from "../src/lib/tokenizer";
import { flattenTokens } from "../src/lib/util";
import { Code, LanguageDefinition, TypedToken } from "../src/types";

export const type = (lang: LanguageDefinition<any>) => (
  ...input: Code[]
): TypedToken[] => {
  return flattenTokens(
    applyLanguage(
      lang,
      tokenize({
        content: input,
        hash: "root",
        id: "root",
        meta: { isHighlight: false },
      }).root
    )
  );
};
