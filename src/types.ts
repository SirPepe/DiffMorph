// Represents a bit of code
export type Code = string | CodeContainer;

// Represents some kind of container object with bits of code inside. May be a
// highlight container, in which case it gets turned into a Highlight instance,
// otherwise it becomes a box.
export type CodeContainer = {
  id: string; // hash plus count
  hash: string; // built from "meta"
  language: string | undefined; // must be defined on the top-level container
  meta: Record<string, any>; // tag name and attributes for DOM sources
  isHighlight: boolean;
  content: Code[];
};

// Represents a highlight token that takes up no space but has set dimensions
// over a number of lines
export type Highlight = {
  hash: string; // built from "meta"
  id: string; // hash plus count for unique identification
  meta: Record<string, any>; // tag name and attributes for DOM sources
  start: [X: number, Y: number];
  end: [X: number, Y: number];
};

// Represents an element containing a bunch of other text tokens or other boxes.
// The source element can be reconstructed from metadata, which together with
// the language attribute serves as the input to the box hash.
export type Box<Content> = {
  readonly type: "BOX";
  id: string; // hash plus count for unique identification
  hash: string; // built from "meta"
  language: string | undefined;
  meta: Record<string, any>; // tag name and attributes for DOM sources
  tokens: (Content | Box<Content>)[];
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
  name: string;
  definitionFactory: LanguageFunctionFactory<Flags>;
  postprocessor: LanguagePostprocessor;
};
