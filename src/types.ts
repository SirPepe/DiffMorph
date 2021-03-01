// Represents a bit of code
export type Code = string | CodeContainer;

// Represents some kind of container with bits of code inside. May be a highlight
// container, in which case it gets a very special treatment (not as a box, but
// as a kind of metadata)
export type CodeContainer = {
  content: Code[];
  hash: string;
  meta: {
    isHighlight: boolean;
  } & Record<string, any>; // tag name and attributes for DOM sources
};

// Represents a highlight token that takes up no space but has set dimensions
export type HighlightToken = {
  hash: string;
  meta: Record<string, any>; // tag name and attributes for DOM sources
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
  hash: string;
  meta: Record<string, any>; // tag name and attributes for DOM sources
  tokens: (TextToken | BoxToken)[];
};

export const isTextToken = (
  x: TextToken | BoxToken | HighlightToken
): x is TextToken => "text" in x && typeof x.text === "string";

// Represents an abstract token that the diffing functions can work with.
export type TokenLike = {
  x: number;
  y: number;
  hash: string;
  parent: {
    hash: any;
  };
};

// Represents a text token that has been linked up to its siblings and parent
// box. Gets passed into a language function in this format. Note that the type
// of "prev" type is an already-typed token (as it has been passed through the
// language function before the current token)
export type LanguageToken = {
  x: number;
  y: number;
  text: string;
  prev: TypedLanguageToken | undefined;
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
  hash: string;
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

// Represents a concrete token in the output
export type RenderToken = {
  x: number;
  y: number;
  text: string;
  type: string;
  hash: string;
  id: string;
  visible: boolean;
  parent: BoxToken;
};
