// This module is a DOM frontend for the tokenizer. Its fromDom() function takes
// elements as input and turns their text content into ready-to-use render data.

import { isNot } from "@sirpepe/shed";
import {
  Box,
  Code,
  CodeContainer,
  Decoration,
  RenderData,
  RenderDecoration,
  RenderText,
  TextTokens,
} from "../types";
import { tokenize } from "./tokenizer";
import { toRenderData } from "../render/render";
import { optimizeDiffs } from "../diff/optimize";
import { diff } from "../diff/diff";
import { applyLanguage } from "../language/language";
import { toLifecycle } from "../render/lifecycle";
import { InputOptions, withDefaults } from "./options";

function getLanguage(element: Element): string | undefined {
  const { 1: match } = /(?:.*)language-(\S+)/.exec(element.className) ?? [];
  return match;
}

function getAttributes(element: Element): [string, string][] {
  return Array.from(element.attributes, (attr): [string, string] => [
    attr.name,
    attr.value,
  ]);
}

function decorationFromData(
  source: HTMLDataElement,
  parent: Box<TextTokens, Decoration<TextTokens>>
): Decoration<TextTokens> | null {
  if (source.classList.contains("dm-decoration")) {
    const { x, y, width, height, data } = JSON.parse(source.value);
    if ([x, y, width, height, data].some(isNot)) {
      return null;
    }
    return {
      parent,
      data,
      x: Number(x),
      y: Number(y),
      width: Number(width),
      height: Number(height),
    };
  }
  return null;
}

function extractCode(source: Element): CodeContainer {
  const content: Code[] = [];
  for (const child of source.childNodes) {
    if (child instanceof Text && child.textContent) {
      content.push(child.textContent);
    } else if (child instanceof HTMLElement) {
      // <data> serves as a way to inject external decorations, nothing more
      if (child.tagName === "DATA") {
        continue;
      }
      content.push(extractCode(child));
    }
  }
  const tagName = source.tagName.toLowerCase();
  const attributes = getAttributes(source);
  return {
    content,
    data: { tagName, attributes },
    isDecoration: tagName === "mark",
    language: getLanguage(source),
  };
}

// Only exported for unit testing code extraction
export function processCode(
  source: Element,
  tabSize: number
): Box<TextTokens, Decoration<TextTokens>> {
  const result = tokenize(extractCode(source), tabSize);
  const externalDecorations =
    source.querySelectorAll<HTMLDataElement>("data.dm-decoration");
  for (const externalDecoration of externalDecorations) {
    const decoration = decorationFromData(externalDecoration, result);
    if (decoration) {
      result.decorations.push(decoration);
    }
  }
  return result;
}

// Actual facade for dom content extraction
export function fromDom(
  inputs: Element[],
  options: InputOptions = {}
): RenderData<RenderText, RenderDecoration> {
  const inputConfig = withDefaults(options);
  const typed = inputs.map((input) => {
    const tokenized = processCode(input, inputConfig.tabSize);
    if (inputConfig.languageOverride) {
      tokenized.language = inputConfig.languageOverride;
    }
    return applyLanguage(tokenized);
  });
  const diffs = optimizeDiffs(diff(typed));
  return toRenderData(toLifecycle(diffs, true));
}
