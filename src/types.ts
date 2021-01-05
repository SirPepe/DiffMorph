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

// Represents a typed text token
export type TypedToken = {
  x: number;
  y: number;
  text: string;
  type: string;
};
