import html from "./html";

export default {
  languageDefinition: () => html.languageDefinition({ xml: true }),
  gluePredicate: html.gluePredicate,
};
