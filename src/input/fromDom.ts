// This module is a DOM frontend for the tokenizer. Its fromDom() function takes
// elements as input and turns their text content into optimized keyframes.

import {
  Box,
  Code,
  CodeContainer,
  HighlightToken,
  LanguageDefinition,
  TextToken,
} from "../types";
import { tokenize } from "../lib/tokenizer";
import { createIdGenerator, flattenTokens, hash } from "../lib/util";
import { toKeyframes, Keyframe } from "../lib/keyframes";
import { optimize } from "../lib/optimize";
import { diffAll } from "../lib/diff";
import { applyLanguage } from "../lib/language";

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

function isText (arg: any): arg is Text {
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
};

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
  const isHighlight = tagName === "mark";
  const meta = { tagName, attributes };
  return { content, hash, id, meta, isHighlight };
}

// Only exported for unit tests
export function processCode(
  source: Element
): { root: Box<TextToken>; highlights: HighlightToken[] } {
  return tokenize(extractCode(source));
};

export function fromDom(
  sourceElements: Element[],
  language: LanguageDefinition<Record<string, any>>
): Keyframe[] {
  const heads = [];
  const highlights = [];
  for (const sourceElement of sourceElements) {
    const processed = processCode(sourceElement);
    heads.push(applyLanguage(language, processed.root));
    highlights.push(processed.highlights);
  }
  const tokens = heads.map(flattenTokens);
  return toKeyframes(optimize(diffAll(tokens)), highlights);
}
