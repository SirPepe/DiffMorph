// Represents a bit of code
export type Code = string | CodeContainer;

// Represents some kind of HTML element that contains bits of code
export type CodeContainer = {
  tagName: string;
  attributes: [string, string][];
  content: Code[];
};

// Represents a text token
export type TextToken = {
  x: number;
  y: number;
  text: string;
};

// Represents an element containing a bunch of text tokens
export type TextBox = {
  x: number;
  y: number;
  tagName: string;
  attributes: [string, string][];
  content: (TextToken | TextBox)[];
};
