// This module is a DOM frontend for the tokenizer. Its fromDom() function takes
// elements as input and turns their text content into optimized keyframes.

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
import { tokenize } from "../lib/tokenizer";
import { getLanguage, isNot } from "../lib/util";
import { toRenderData } from "../lib/render";
import { optimizeDiffs } from "../lib/optimize";
import { diff } from "../lib/diff";
import { applyLanguage } from "../lib/language";
import { toLifecycle } from "../lib/lifecycle";
import { InputOptions, withDefaults } from "./options";

function isHTMLElement(arg: any): arg is HTMLElement {
  if (!arg) {
    return false;
  }
  return (
    arg instanceof Node &&
    arg.nodeType === Node.ELEMENT_NODE &&
    arg instanceof HTMLElement
  );
}

function isText(arg: any): arg is Text {
  if (!arg) {
    return false;
  }
  return arg instanceof Node && arg.nodeType === Node.TEXT_NODE;
}

function isDomContent(arg: any): arg is HTMLElement | Text {
  if (!arg) {
    return false;
  }
  return isHTMLElement(arg) || isText(arg);
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
  const children = Array.from(source.childNodes).filter(isDomContent);
  const content: Code[] = [];
  for (const child of children) {
    if (isText(child) && child.textContent) {
      content.push(child.textContent);
    } else if (isHTMLElement(child)) {
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
