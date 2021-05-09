export const themeColors = {
  foreground: "foreground",
  background: "background",
  string: "string",
  number: "number",
  comment: "comment",
  global: "global",
  type: "type",
  tag: "tag",
  value: "value",
  literal: "literal",
  punctuation: "punctuation",
};

export type ThemeProperties = {
  "color"?: typeof themeColors[keyof typeof themeColors];
  "font-weight"?: string;
  "font-style"?: string;
};

export type Theme = Record<string, ThemeProperties>;

// These should be six-character hexadecimal values for compatibility with
// color input elements
export const DEFAULT_COLORS = {
  foreground: "#000000",
  background: "#ffffff",
  string: "#bd0542",
  number: "#00806a",
  comment: "#808080",
  global: "#0055cc",
  type: "#104570",
  tag: "#004f57",
  value: "#008f24",
  literal: "#9d26d9",
  punctuation: "#404040",
};
