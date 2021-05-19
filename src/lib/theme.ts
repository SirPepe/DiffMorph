// Essentially an enum for language theme colors. Not real enum because we need
// to perform a few operations on the resulting type
export const themeColors = {
  foreground: "foreground",
  background: "background",
  highlight: "highlight", // not available for use in languages
  string: "string",
  number: "number",
  comment: "comment",
  global: "global",
  type: "type",
  tag: "tag",
  value: "value",
  literal: "literal",
  punctuation: "punctuation",
} as const;

// Excludes theme colors that must not be used by languages because they are
// reserved for decorations and thus must be visually distinct.
type LanguageThemeColors = Exclude<keyof typeof themeColors, "highlight">;

// Colors are mandatory because, while CSS just inherits from the root element's
// foreground color, canvas rendering needs explicit colors.
export type LanguageThemeProperties = {
  color: typeof themeColors[LanguageThemeColors];
  "font-weight"?: string;
  "font-style"?: string;
};

export type LanguageTheme = Record<string, LanguageThemeProperties>;
export type ColorPalette = { [K in keyof typeof themeColors]: string };

// These should be six-character hexadecimal values for compatibility with
// color input elements
export const DEFAULT_COLOR_PALETTE = {
  foreground: "#000000",
  background: "#ffffff",
  highlight: "#ffff00",
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
