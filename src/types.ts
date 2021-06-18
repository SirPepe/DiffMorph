// Input to DiffMorph is code. Code can be either stings or container objects,
// which in turn can contain strings and other container objects. Container
// objects can be constructed from DOM nodes, JSON data or really anything else.
// They carry a bit of metadata, most important of all a flag on whether the
// container is a regular container or a decoration wrapper. Regular containers
// constrain the diffing algorithm to the container's content, which decorations
// do not; decorations are intended to be rendered in the final output to create
// squiggly lines, highlights or other text decorations.

import { LanguageTheme } from "./language/theme";

// Represents a bit of code as defined above
export type Code = string | CodeContainer;

// tag name and attributes for DOM sources
type ContainerData = Record<string, string | string[] | string[][]>;

// Represents some kind of container object, either a regular container or a
// decoration wrapper container. Two container with the same hash are considered
// exchangeable, containers with the same ID are considered identical. Because
// container content can change between frames, the hash (and by proxy the ID as
// well) is build from the container's data and language. Identifying a
// container with a "key" prop like in React is totally possible!
export type CodeContainer = {
  language: string | undefined; // must be defined on the top-level container
  data: ContainerData;
  isDecoration: boolean; // whether to turn this into a Box or Decoration
  content: Code[];
};

// The main data structures that DiffMorph operates on are Tokens, Boxes and
// Decorations. Tokens represent bits of text, Decorations represent annotations
// such as highlights and squiggly lines, and Boxes contain Tokens, Decorations
// and other Boxes. A whole frame of code is thus represented as a nested
// structure with a Box at the root. In addition, Tokens *can* also form a
// linked list among themselves. The linked list allows certain functions
// (primarily language definitions) to view a frame as just a linked list of
// text chunks, while the recursive structure makes operations on the entire
// frame (like diffing) possible. Note that every Box can contain code for a
// different language than its parent box, to enable embedding eg. CSS in HTML.
// In this case the linked list inside the box in question is not part of the
// linked list that the tokens in the parent frame are part of.

// Linked list functionality to wrap all possible types of tokens. The
// linked-list-ness is not part of the token's types because only certain parts
// of DiffMorph depend on this functionality and making it an addon type makes
// writing some code (and some tests) way simpler.
export type LinkedListOf<T, Prev = T, Next = T> = T & {
  prev: LinkedListOf<Prev> | undefined;
  next: LinkedListOf<Next> | undefined;
  parent: Box<T | Prev | Next, Decoration<LinkedListOf<T | Prev | Next>>>;
};

// This type defined fields common to Boxes, Decorations and all subtypes of
// Tokens. The height is strictly speaking irrelevant for text tokens, but for
// simplicity's sake it's always there and always 1. All coordinates are
// absolute, even those for tokens nested in boxes.
export type Token = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// A container that contains other tokens, containers and decorations (or
// anything, really). The container's source object can be reconstructed from
// the "data" field, which together with the language attribute serves as the
// input to the box hash.
export type Box<Content, Deco> = Token & {
  data: ContainerData;
  language: string | undefined;
  content: (Content | Box<Content, Deco>)[];
  decorations: Deco[];
  parent: Box<Content, Deco> | undefined;
};

// Represents a marker token that takes up no space and contains no other
// elements, but has set dimensions over a number of lines.
export type Decoration<Content> = Token & {
  data: ContainerData;
  parent: Box<Content, Decoration<Content>>;
};

// Represents a text token. Returned by the tokenizer and devoid of any semantic
// information, and thus missing both a hash and an ID.
export type TextToken = Token & { text: string };

// The tokenizer links up all text tokens into a linked list
export type TextTokens = LinkedListOf<TextToken>;

// Represents a text token list that is being processed by a language function.
// Note that the type of "prev" type is an already-typed token (as it has been
// passed through the language function before the current token)
// The tokenizer links up all text tokens into a linked list
export type LanguageTokens = LinkedListOf<TextToken, TypedToken, TextToken>;

// Represents a text token that has been passed through a language function and
// has thus been assigned a type and a hash.
export type TypedToken = TextToken & { type: string };

// Important for language postprocessors
export type TypedTokens = LinkedListOf<TypedToken>;

// Typed tokens with a hash over their text and type
export type DiffTokens = LinkedListOf<TypedToken & { hash: number }>;

// Decoration's hashes at the diff stage are built from their data field.
export type DiffDecoration = Decoration<DiffTokens> & { hash: number };

// Boxes' hashes at the diff stage are built from their data field and that
// "external" information is what definitely identifies a box.
export type DiffBox = Box<DiffTokens, DiffDecoration> & { hash: number };

// The diffing algorithm turns tokens into all sorts of diff ops that can be
// optimized and then turned into token lifecycles for rendering.

// ADD does not need a "from" field because it is by definition an initial
// addition. It may get translated to a BAD + MOV pair, but there then BAD is
// the initial addition and MOV has a "from" field anyway.
export type ADD<T> = {
  readonly kind: "ADD";
  item: T;
};

// DEL does not need a "from" field because "item" in this case IS the "from"
export type DEL<T> = {
  readonly kind: "DEL";
  item: T;
};

// MOV is also responsible for changes in box or decoration dimensions. In many
// cases MOV operations are created in the optimizer by compensating for ADD
// operations with DEL operations for equivalent tokens.
export type MOV<T> = {
  readonly kind: "MOV";
  item: T;
  from: T; // reference to the item on it's previous position
};

// All regular operations that the diff and optimizer module deal with
export type DiffOp<T> = ADD<T> | DEL<T> | MOV<T>;

// BAD = "before add", essentially an invisible "add". Inserted into diff trees
// by the lifecycle extension mechanism. Does not need a "from" field because it
// is always an initial addition.
export type BAD<T> = {
  readonly kind: "BAD";
  item: T;
};

// BDE = "before del", essentially an invisible "mov". Inserted into diff trees
// by the lifecycle extension mechanism.
export type BDE<T> = {
  readonly kind: "BDE";
  item: T; // position when fading out ends
  from: T; // reference to the item when fading out starts
};

// Regular plus extra ops that only become relevant once (extended) lifecycles
// come into play
export type ExtendedDiffOp<T> = ADD<T> | DEL<T> | MOV<T> | BAD<T> | BDE<T>;

// This no-op is only useful for boxes that did not change themselves, but that
// may have changed contents or decorations. Tokens or decorations without
// changes simply don't get an op at all.
export type NOP<T> = {
  readonly kind: "NOP";
  item: T; // reference to the previous box
};

// Models a box in the diff result. A box can have changes to itself ("root")
// and/or to its content ("content" and "decorations")
export type DiffRoot = {
  readonly kind: "ROOT";
  root: DiffOp<DiffBox> | NOP<DiffBox>;
  content: (DiffOp<DiffTokens> | DiffRoot)[];
  decorations: DiffOp<DiffDecoration>[];
};

// The rendering steps takes diff ops and turns them first into lifecycles (an
// internal type of the rendering module) and then into object graphs that can
// be transformed into frames, DOM nodes or any other form of animated end
// result.

// Describes how to render the token with the given id.
export type BasePosition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
};

export type TextPosition = BasePosition;
export type DecorationPosition = BasePosition;

// Box render positions have their own frame to render as well
export type RenderPositions = BasePosition & { frame: Frame };

export type RenderBox = { id: string };
export type RenderText = { id: string; text: string; type: string };
export type RenderDecoration = { id: string; data: ContainerData };
export type RenderRoot<T, D> = {
  id: string;
  data: ContainerData;
  language: string | undefined;
  content: {
    text: Map<string, T>;
    decorations: Map<string, D>;
    boxes: Map<string, RenderRoot<T, D>>;
  };
};

export type Frame = {
  text: Map<string, TextPosition>;
  decorations: Map<string, DecorationPosition>;
  boxes: Map<string, RenderPositions>;
};

// Object graph that describes the items to render (content) and when and
// where to render them (frame)
export type RenderData<T, D> = {
  objects: RenderRoot<T, D>;
  frames: Map<number, RenderPositions>; // root frames
  maxWidth: number;
  maxHeight: number;
};

export type LanguageFunction = (
  token: LanguageTokens
) => LanguageFunctionResult;
export type LanguagePostprocessor = (token: TypedTokens) => boolean;

export type TokenReplacementResult = {
  replacements: { text: string; type: string }[];
};

export type EmbeddedLanguageFunctionResult = {
  language: string;
  types: (string | EmbeddedLanguageFunctionResult | TokenReplacementResult)[];
};

export type LanguageFunctionResult =
  | string
  | EmbeddedLanguageFunctionResult
  | TokenReplacementResult
  | (string | EmbeddedLanguageFunctionResult | TokenReplacementResult)[];

type LanguageFunctionFactory<Flags extends Record<string, any>> = (
  flags?: Flags
) => LanguageFunction;

export type LanguageDefinition<Flags extends Record<string, any>> = {
  name: string;
  theme: LanguageTheme;
  definitionFactory: LanguageFunctionFactory<Flags>;
  postprocessor: LanguagePostprocessor;
};
