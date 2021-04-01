// The general input to DiffMorph is code. Code can be either stings or
// container objects, which in turn can contain strings and container objects.
// Container objects can be constructed from DOM nodes, JSON data or frankly
// anything else. They carry a bit of metadata, most important of all a flag
// on whether the container is a regular container or a highlight. Regular
// containers constrain the diffing algorithm to their content, which highlights
// do not; highlights are intended to be rendered in the final output to create
// squiggly lines or other text decorations.

// Represents a bit of code
export type Code = string | CodeContainer;

// Represents some kind of container object, either a regular container or a
// highlight container. Two container with the same hash are considered
// exchangeable, containers with the same ID are considered identical. Because
// container content can change between frames, the hash (and by proxy the ID as
// well) is build from the container's data and language
export type CodeContainer = {
  id: string; // hash plus count for unique identification
  hash: string; // built from "meta"
  language: string | undefined; // must be defined on the top-level container
  data: Record<string, any>; // tag name and attributes for DOM sources
  isDecoration: boolean; // whether to turn this into a Box or Decoration
  content: Code[];
};

// The main data structures that DiffMorph operates on are Tokens, Boxes and
// Decorations. Tokens represent bits of text, Decorations represent annotations
// such as highlights and squiggly lines, and Boxes contain Tokens, Decorations
// and other Boxes. A whole frame of code is thus represented as a nested
// structure with a Box at the root. In addition, Tokens also form a linked list
// among themselves. The linked list allows certain functions (primarily
// language definitions) to view a frame as just a linked list of text chunks,
// while the recursive structure makes operations on the entire frame (like
// diffing) possible. Note that every Box can contain code for a different
// language, to enable embedding eg. CSS in HTML. In this case the linked list
// inside the box in question is not part of the linked list that the tokens in
// the parent frame are part of.

// Fields common to Boxes, Decorations and all subtypes of tokens. Almost all of
// the above types also have a readonly "kind" discriminant and a string id.
// Both fields are left out of this type because most functions don't need them
// and said functions are best served by defining a type argument constrained by
// this type as it is.
export type Token = {
  hash: string;
  x: number;
  y: number;
};

// The source element or object can be reconstructed from the "data" field,
// which together with the language attribute serves as the input to the box
// hash.
export type Box<Content> = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "BOX";
  data: Record<string, any>; // tag name and attributes for DOM sources
  width: number;
  height: number;
  language: string | undefined;
  tokens: (Content | Box<Content>)[];
  parent: Box<Content> | undefined; // required for traversing
};

// Represents a marker token that takes up no space and contains no other
// elements, but has set dimensions over a number of lines.
export type Decoration = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "META";
  data: Record<string, any>; // tag name and attributes for DOM sources
  lines: [Y: number, XStart: number, XEnd: number][];
};

// Represents a text token. Returned by the tokenizer and devoid of any semantic
// information, and thus missing both a hash and an ID.
export type TextToken = Omit<Token, "hash"> & {
  readonly kind: "TEXT";
  text: string;
  size: number; // number of characters on the x axis
  next: TextToken | undefined;
  prev: TextToken | undefined;
  parent: Box<TextToken | Decoration>;
};

// Represents a text token that has been linked up to its siblings and parent
// box. Gets passed into a language function in this format. Note that the type
// of "prev" type is an already-typed token (as it has been passed through the
// language function before the current token)
export type RawToken = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "RAW";
  text: string;
  size: number;
  prev: TypedToken | undefined;
  next: RawToken | undefined;
  parent: Box<RawToken | Decoration>;
};

// Represents a text token that has been passed through a language function and
// has thus been assigned a type.
export type TypedToken = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "TYPED";
  text: string;
  size: number;
  type: string;
  hash: string;
  prev: TypedToken | undefined;
  next: TypedToken | undefined;
  parent: Box<TypedToken | Decoration>;
};

// Represents a concrete token in the output, derived from (but not identical
// to) a TypedToken
export type RenderToken = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "RENDER";
  text: string;
  size: number;
  type: string;
  hash: string;
  isVisible: boolean;
  parent: Box<TypedToken | Decoration>;
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
