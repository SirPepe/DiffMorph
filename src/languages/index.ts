import { LanguageDefinition } from "../types";
import { languageDefinition as css } from "./css";
import { languageDefinition as html } from "./html";
import { languageDefinition as javascript } from "./javascript";
import { languageDefinition as json } from "./json";
import { languageDefinition as jsonc } from "./jsonc";
import { languageDefinition as none } from "./none";
import { languageDefinition as typescript } from "./typescript";
import { languageDefinition as xml } from "./xml";

export const languages: Record<string, LanguageDefinition<any>> = {
  css,
  html,
  javascript,
  json,
  jsonc,
  none,
  typescript,
  xml,
};

export function registerLanguage(lang: LanguageDefinition<any>): void {
  languages[lang.name] = lang;
}
