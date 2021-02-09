// Represents a bit of code
export type Code = string | CodeContainer;

// Represents some kind of element that contains bits of code
export type CodeContainer = {
  tagName: string;
  attributes: [string, string][];
  content: Code[];
};

// Represents a highlight token that takes up no space but has set dimensions
export type HighlightToken = {
  tagName: string;
  attributes: [string, string][];
  hash: string;
  start: [number, number];
  end: [number, number];
};

// Represents a text token. Returned by the tokenizer and devoid of any semantic
// information.
export type TextToken = {
  x: number;
  y: number;
  text: string;
};

// Represents an element containing a bunch of other text or box tokens. The
// source element can be reconstructed from tagName and attributes, which also
// serve as the input to the box token's hash.
export type BoxToken = {
  x: number;
  y: number;
  tagName: string;
  attributes: [string, string][];
  hash: string;
  tokens: (TextToken | BoxToken)[];
};

export const isTextToken = (
  x: TextToken | BoxToken | HighlightToken
): x is TextToken => "text" in x && typeof x.text === "string";

// Represents a text token that has been linked up to its siblings and parent
// box. Gets passed into a language function in this format.
export type LanguageToken = {
  x: number;
  y: number;
  text: string;
  prev: LanguageToken | undefined;
  next: LanguageToken | undefined;
  source: TextToken;
  parent: BoxToken;
};

// Represents a text token that has been passed through a language function and
// has thus been assigned a type.
export type TypedLanguageToken = {
  x: number;
  y: number;
  text: string;
  type: string;
  prev: TypedLanguageToken | undefined;
  next: TypedLanguageToken | undefined;
  source: TextToken;
  parent: BoxToken;
};

// Represents text tokens that were first passed through a language function and
// then a glue function.
export type TypedToken = {
  x: number;
  y: number;
  text: string;
  type: string;
  hash: string;
  parent: BoxToken;
};
