// Represents a bit of code
export type Code = string | CodeContainer;

// Represents some kind of container with bits of code inside. May be a
// highlight container, in which case it gets a very special treatment (not as
// a box, but as a kind of metadata)
export type CodeContainer = {
  content: Code[];
  hash: string; // built from "meta"
  id: string; // hash plus count
  isHighlight: boolean;
  meta: Record<string, any>; // tag name and attributes for DOM sources
};

// Represents a highlight token that takes up no space but has set dimensions
export type HighlightToken = {
  hash: string; // built from "meta"
  id: string; // hash plus count for unique identification
  meta: Record<string, any>; // tag name and attributes for DOM sources
  start: [X: number, Y: number];
  end: [X: number, Y: number];
};

// Represents an abstract token that the diffing functions can work with.
export type TokenLike = {
  x: number;
  y: number;
  hash: string;
  next: TokenLike | undefined;
  prev: TokenLike | undefined;
  parent: {
    hash: any;
  };
};

// Represents an element containing a bunch of other text tokens or other box
// tokens. The source element can be reconstructed from metadata, which also
// serve as the input to the box hash.
export type Box<Content> = {
  id: string; // hash plus count for unique identification
  hash: string; // built from "meta"
  meta: Record<string, any>; // tag name and attributes for DOM sources
  tokens: (Content | Box<Content>)[];
  parent: Box<Content> | undefined; // distinguishes the root box from the rest
};

// Represents a text token. Returned by the tokenizer and devoid of any semantic
// information.
export type TextToken = {
  x: number;
  y: number;
  text: string;
  size: number;
  next: TextToken | undefined;
  prev: TextToken | undefined;
  parent: Box<TextToken>;
};

// Represents a text token that has been linked up to its siblings and parent
// box. Gets passed into a language function in this format. Note that the type
// of "prev" type is an already-typed token (as it has been passed through the
// language function before the current token)
export type RawToken = {
  x: number;
  y: number;
  text: string;
  size: number;
  prev: TypedToken | undefined;
  next: RawToken | undefined;
  parent: Box<RawToken>;
};

// Represents a text token that has been passed through a language function and
// has thus been assigned a type.
export type TypedToken = {
  x: number;
  y: number;
  text: string;
  size: number;
  type: string;
  hash: string;
  prev: TypedToken | undefined;
  next: TypedToken | undefined;
  parent: Box<TypedToken>;
};

// Represents a concrete token in the output
export type RenderToken = {
  x: number;
  y: number;
  text: string;
  size: number;
  type: string;
  hash: string;
  id: string;
  visible: boolean;
  parent: Box<TypedToken>;
};

export type LanguageFunction = (token: RawToken) => LanguageFunctionResult;
export type LanguagePostprocessor = (token: TypedToken) => boolean;
export type LanguageFunctionResult = string | string[];

type LanguageFunctionFactory<Flags extends Record<string, any>> = (
  flags?: Flags
) => LanguageFunction;

export type LanguageDefinition<Flags extends Record<string, any>> = {
  definitionFactory: LanguageFunctionFactory<Flags>;
  postprocessor: LanguagePostprocessor;
};
