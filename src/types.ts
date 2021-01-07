// Represents a bit of code
export type Code = string | CodeContainer;

// Represents some kind of HTML element that contains bits of code
export type CodeContainer = {
  tagName: string;
  attributes: [string, string][];
  content: Code[];
};

// Represents a highlight
export type HighlightToken = {
  tagName: string;
  attributes: [string, string][];
  start: [number, number];
  end: [number, number];
};

// Represents a text token
export type TextToken = {
  x: number;
  y: number;
  text: string;
};

// Represents an element containing a bunch of text tokens
export type BoxToken = {
  x: number;
  y: number;
  tagName: string;
  attributes: [string, string][];
  tokens: (TextToken | BoxToken)[];
};

export const isTextToken = (
  x: TextToken | BoxToken | HighlightToken
): x is TextToken => "text" in x && typeof x.text === "string";

// Represents a text token that gets passed into a language function
export type LanguageToken = {
  x: number;
  y: number;
  text: string;
  prev: LanguageToken | undefined;
  next: LanguageToken | undefined;
  source: TextToken;
  parent: BoxToken;
};

// Represents a text token that was passed through a language function
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

// Represents text tokens that were passed through language and a glue functions
export type TypedToken = {
  x: number;
  y: number;
  text: string;
  type: string;
  hash: string;
  parent: BoxToken;
};
