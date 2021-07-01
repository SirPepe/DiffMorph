import { diff } from "../src/diff/diff";
import { applyLanguage } from "../src/language/language";
import { toLifecycle } from "../src/render/lifecycle";
import { optimizeDiffs } from "../src/diff/optimize";
import { tokenize } from "../src/input/tokenizer";
import { flattenTokens, getFirstTextToken } from "../src/lib/token";
import { Box, Code, Decoration, LinkedListOf, TypedTokens } from "../src/types";

type DecorationArgs = Omit<Decoration<any>, "parent">;

type BoxArgs<T, D extends DecorationArgs = Decoration<T>> = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  content?: (T | BoxArgs<T, D>)[];
  decorations?: D[];
  language?: string;
  data?: Record<string, any>;
  parent?: any;
};

function isBoxArgs<T, D extends DecorationArgs>(
  x: any | BoxArgs<T, D>
): x is BoxArgs<T, D> {
  return typeof x.x === "undefined" && typeof x.y === "undefined";
}

export function stubBox<T, D extends DecorationArgs>(
  args: BoxArgs<T, D>,
  nested = 0,
  parent?: Box<T, Decoration<T>>
): Box<T, Decoration<T>> {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    language = "none",
    data = {},
    content = [],
    decorations = [],
  } = args;
  const result: Box<T, Decoration<T>> = {
    x,
    y,
    width,
    height,
    language,
    data,
    content: [],
    decorations: [],
    parent,
  };
  result.content = content.map((token) => {
    if (isBoxArgs(token)) {
      return stubBox(token, nested + 1, result);
    } else {
      return token;
    }
  });
  result.decorations = decorations.map((item: any) => {
    item.parent = result;
    return item as Decoration<any>;
  });
  return result;
}

export function link<T, P = any>(items: T[], parent?: P): LinkedListOf<T>[] {
  for (let i = 0; i < items.length; i++) {
    (items[i] as any).next = items[i + 1];
    (items[i] as any).prev = items[i - 1];
    (items[i] as any).parent = parent;
  }
  return items as LinkedListOf<T>[];
}

/* eslint-disable */
export const lang =
  (lang: string) =>
  (...input: Code[]): Box<TypedTokens, Decoration<TypedTokens>> => {
    return applyLanguage(
      tokenize(
        {
          content: input,
          language: lang,
          isDecoration: false,
          data: {},
        },
        2
      )
    );
  };

export const type =
  (language: string) =>
  (...input: Code[]): string[] => {
    return flattenTokens(getFirstTextToken([lang(language)(...input)]))
      .map(({ type }) => type);
  };

export const process =
  (language: string) =>
  (...input: Code[][]) =>
    toLifecycle(
      optimizeDiffs(
        diff(input.map((code) => lang(language)(...code)))
      ),
      true
    );
/* eslint-enable */
