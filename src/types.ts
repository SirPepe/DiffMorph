// The general input to DiffMorph is code. Code can be either stings or
// container objects, which in turn can contain strings and container objects.
// Container objects can be constructed from DOM nodes, JSON data or really
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
// well) is build from the container's data and language. Identifying a
// container with a "key" prop like in React is totally possible!
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

// Fields common to Boxes, Decorations and all subtypes of tokens. All of those
// the above types also have a readonly "kind" discriminant and a string id.
// The height is irrelevant for text tokens, but for simplicity's sake it's
// always there and always 1. All coordinates are absolute, even those for
// tokens nested in boxes.
export type Token = {
  x: number;
  y: number;
  hash: string;
  width: number;
  height: number;
};

// A container that contains other tokens, containers and decorations (or
// anything, really). The container's source object can be reconstructed from
// the "data" field, which together with the language attribute serves as the
// input to the box hash.
export type Box<Content, Deco> = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "BOX";
  data: Record<string, any>; // tag name and attributes for DOM sources
  language: string | undefined;
  content: (Content | Box<Content, Deco>)[];
  decorations: Deco[];
  parent: Box<Content, Deco> | undefined;
};

// Represents a marker token that takes up no space and contains no other
// elements, but has set dimensions over a number of lines.
export type Decoration<Content> = Token & {
  readonly kind: "DECO";
  data: Record<string, any>; // tag name and attributes for DOM sources
  parent: Box<Content, Decoration<Content>>;
};

// Represents a text token. Returned by the tokenizer and devoid of any semantic
// information, and thus missing both a hash and an ID.
export type TextToken = Omit<Token, "hash"> & {
  readonly kind: "TEXT";
  text: string;
  next: TextToken | undefined;
  prev: TextToken | undefined;
  parent: Box<TextToken, Decoration<TextToken>>;
};

// Represents a text token that has been linked up to its siblings and parent
// box. Gets passed into a language function in this format. Note that the type
// of "prev" type is an already-typed token (as it has been passed through the
// language function before the current token)
export type RawToken = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "RAW";
  text: string;
  prev: TypedToken | undefined;
  next: RawToken | undefined;
  parent: Box<RawToken, Decoration<RawToken>>;
};

// Represents a text token that has been passed through a language function and
// has thus been assigned a type.
export type TypedToken = Token & {
  id: string; // hash plus count for unique identification
  readonly kind: "TYPED";
  text: string;
  type: string;
  hash: string;
  prev: TypedToken | undefined;
  next: TypedToken | undefined;
  parent: Box<TypedToken, Decoration<TypedToken>>;
};

// Describes how to render the token with the given id.
type BasePosition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
};

export type TextPosition = BasePosition;
export type DecorationPosition = BasePosition;

// Box render positions have their own frame to render as well
export type RenderPositions = BasePosition & { frame: Frame };

export type RenderText = { id: string; text: string; type: string };
export type RenderDecoration = { id: string; data: Record<string, any> };
export type RenderRoot = {
  id: string;
  data: Record<string, any>;
  language: string | undefined;
  content: {
    text: Map<string, RenderText>;
    decorations: Map<string, RenderDecoration>;
    boxes: Map<string, RenderRoot>;
  };
};

export type Frame = {
  text: Map<string, TextPosition>;
  decorations: Map<string, DecorationPosition>;
  boxes: Map<string, RenderPositions>;
};

// Object graph that describes the items to render (content) and when and
// where to render them (frame)
export type RenderData = {
  objects: RenderRoot;
  frames: RenderPositions[]; // root boxes
  maxWidth: number;
  maxHeight: number;
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
