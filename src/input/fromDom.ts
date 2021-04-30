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
  TextToken,
} from "../types";
import { tokenize } from "../lib/tokenizer";
import { createIdGenerator, getLanguage, hash } from "../lib/util";
import { toRenderData } from "../lib/render";
import { optimizeDiffs } from "../lib/optimize";
import { diff } from "../lib/diff";
import { applyLanguage } from "../lib/language";
import { toLifecycle } from "../lib/lifecycle";

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

function hashDOMBox(tagName: string, attributes: [string, string][]): string {
  return hash(
    tagName + "|" + attributes.map((pair) => pair.join("=")).join("|")
  );
}

function extractCode(source: Element): CodeContainer {
  const idGenerator = createIdGenerator();
  const children = Array.from(source.childNodes).filter(isDomContent);
  const content: Code[] = [];
  for (const child of children) {
    if (isText(child) && child.textContent) {
      content.push(child.textContent);
    } else if (isHTMLElement(child)) {
      content.push(extractCode(child));
    }
  }
  const tagName = source.tagName.toLowerCase();
  const attributes = getAttributes(source);
  const hash = hashDOMBox(tagName, attributes);
  const id = idGenerator(null, hash);
  return {
    content,
    hash,
    id,
    data: { tagName, attributes },
    isDecoration: tagName === "mark",
    language: getLanguage(source),
  };
}

// Only exported for unit testing code extraction
export function processCode(
  source: Element
): Box<TextToken, Decoration<TextToken>> {
  return tokenize(extractCode(source));
}

// Actual facade for dom content extraction
export function fromDom(
  inputs: Element[],
  languageOverride?: string
): RenderData<RenderText, RenderDecoration> {
  const typed = inputs.map((input) => {
    const tokenized = processCode(input);
    if (languageOverride) {
      tokenized.language = languageOverride;
    }
    return applyLanguage(tokenized);
  });
  const diffs = optimizeDiffs(diff(typed));
  return toRenderData(toLifecycle(diffs, true));
}
