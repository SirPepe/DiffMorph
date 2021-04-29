export const themeColors = {
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

export const DEFAULT_COLORS = {
  background: "#FFF",
  string: "hsl(340, 95%, 38%)",
  number: "hsl(170, 100%, 25%)",
  comment: "hsl(0, 0%, 50%)",
  global: "hsl(215, 100%, 40%)",
  type: "hsl(207, 75%, 25%)",
  tag: "hsl(185, 100%, 17.5%)",
  value: "hsl(135, 100%, 28%)",
  literal: "hsl(280, 70%, 50%)",
  punctuation: "hsl(0, 0%, 25%)",
};
