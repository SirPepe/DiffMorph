import json from "./json";

export default {
  languageDefinition: () => json.languageDefinition({ comments: true }),
  gluePredicate: json.gluePredicate,
};
