export type InputOptions = {
  tabSize?: number;
  languageOverride?: string | undefined;
};

export type InputConfig = {
  tabSize: number;
  languageOverride: string | undefined;
};

export function withDefaults(input: InputOptions): InputConfig {
  return {
    tabSize: input.tabSize ?? 2,
    languageOverride: input.languageOverride,
  }
}
