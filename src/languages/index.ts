import { LanguageDefinition } from "../types";
import { languageDefinition as c } from "./c";
import { languageDefinition as css } from "./css";
import { languageDefinition as html } from "./html";
import { languageDefinition as javascript } from "./javascript";
import { languageDefinition as json } from "./json";
import { languageDefinition as jsonc } from "./jsonc";
import { languageDefinition as none } from "./none";
import { languageDefinition as toml } from "./toml";
import { languageDefinition as typescript } from "./typescript";
import { languageDefinition as xml } from "./xml";

export const languages: Record<string, LanguageDefinition<any>> = {
  [c.name]: c,
  [css.name]: css,
  [html.name]: html,
  [javascript.name]: javascript,
  [json.name]: json,
  [jsonc.name]: jsonc,
  [none.name]: none,
  [toml.name]: toml,
  [typescript.name]: typescript,
  [xml.name]: xml,
};

export function registerLanguage(lang: LanguageDefinition<any>): void {
  languages[lang.name] = lang;
}
