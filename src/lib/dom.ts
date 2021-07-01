import { LanguageTheme } from "../language/theme";

// Extract the language part of an HTML5-compliant language-identifying class
// name like "language-javascript" or "foo language-c bar"
export function getLanguage(source: string): string {
  const match = /language-([a-zA-Z0-9-_]+)/.exec(source);
  if (!match) {
    return "none";
  }
  return match[1] || "none";
}

export function themeToCss(prefix: string, theme: LanguageTheme): string {
  return Object.entries(theme)
    .map(([type, props]) => {
      let selector = "." + type.split(/\s+/).join(".");
      if (prefix) {
        selector = prefix + " " + selector;
      }
      const declarations = Object.entries(props)
        .map(([property, value]) => {
          if (value) {
            if (property === "color") {
              value = `var(--${value})`;
            }
            return `${property}:${value}`;
          }
        })
        .join(";");
      return `${selector}{${declarations}}`;
    })
    .join("\n");
}
