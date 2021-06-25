import { LanguageDefinition } from "../../types";
import { cdata } from "./cdata";
import { cStyleBlockComment } from "./cStyleBlockComment";
import { cStyleLineComment } from "./cStyleLineComment";
import { htmlStyleComment } from "./htmlStyleComment";

export const microsyntax: Record<string, LanguageDefinition<any>> = {
  [cdata.syntax.name]: cdata.syntax,
  [cStyleLineComment.syntax.name]: cStyleLineComment.syntax,
  [cStyleBlockComment.syntax.name]: cStyleBlockComment.syntax,
  [htmlStyleComment.syntax.name]: htmlStyleComment.syntax,
};
