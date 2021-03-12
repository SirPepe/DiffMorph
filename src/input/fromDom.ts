// This module is a DOM frontend for the tokenizer. Its fromDom() function takes
// elements as input and turns their text content into optimized keyframes.

import { BoxToken, Code, HighlightToken, RawToken, TypedToken } from "../types";
import { tokenize } from "../lib/tokenizer";
import { hash } from "../lib/util";
import { toKeyframes, Keyframe } from "../lib/keyframes";
import { optimize } from "../lib/optimize";
import { diffAll } from "../lib/diff";
import { applyLanguage } from "../lib/language";

const isHTMLElement = (arg: any): arg is HTMLElement => {
  if (!arg) {
    return false;
  }
  return (
    arg instanceof Node &&
    arg.nodeType === Node.ELEMENT_NODE &&
    arg instanceof HTMLElement
  );
};

const isText = (arg: any): arg is Text => {
  if (!arg) {
    return false;
  }
  return arg instanceof Node && arg.nodeType === Node.TEXT_NODE;
};

const isDomContent = (arg: any): arg is HTMLElement | Text => {
  if (!arg) {
    return false;
  }
  return isHTMLElement(arg) || isText(arg);
};

const getAttributes = (element: Element): [string, string][] => {
  return Array.from(element.attributes, (attr): [string, string] => [
    attr.name,
    attr.value,
  ]);
};

const hashDOMBox = (tagName: string, attributes: [string, string][]): string =>
  hash(tagName + "|" + attributes.map((pair) => pair.join("=")).join("|"));

const extractCode = (source: Element): Code[] => {
  const children = Array.from(source.childNodes).filter(isDomContent);
  const extracted: Code[] = [];
  for (const child of children) {
    if (isText(child) && child.textContent) {
      extracted.push(child.textContent);
    } else if (isHTMLElement(child)) {
      const content = extractCode(child);
      const tagName = child.tagName.toLowerCase();
      const attributes = getAttributes(child);
      const hash = hashDOMBox(tagName, attributes);
      const meta = { tagName, attributes, isHighlight: tagName === "mark" };
      extracted.push({ content, hash, meta });
    }
  }
  return extracted;
};

export const processCode = (source: Element): [BoxToken, HighlightToken[]] => {
  const tagName = source.tagName.toLowerCase();
  const attributes = getAttributes(source);
  const hash = hashDOMBox(tagName, attributes);
  const meta = { tagName, attributes, isHighlight: false };
  const { tokens, highlights } = tokenize(extractCode(source));
  return [{ x: 0, y: 0, hash, meta, tokens }, highlights];
};

export function fromDom(
  sourceElements: Element[],
  languageDefinition: () => (token: RawToken) => string | string[],
  gluePredicate: (token: TypedToken) => boolean
): Keyframe[] {
  const tokens = [];
  const highlights = [];
  for (const sourceElement of sourceElements) {
    const [rootBox, highlightTokens] = processCode(sourceElement);
    tokens.push(applyLanguage(languageDefinition, gluePredicate, [rootBox]));
    highlights.push(highlightTokens);
  }
  return toKeyframes(optimize(diffAll(tokens)), highlights);
}
