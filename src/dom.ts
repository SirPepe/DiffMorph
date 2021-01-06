import { BoxToken, Code, HighlightToken } from "./types";
import { tokenize } from "./tokenizer";

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

const extractCode = (source: Element): Code[] => {
  const children = Array.from(source.childNodes).filter(isDomContent);
  const extracted: Code[] = [];
  for (const child of children) {
    if (isText(child) && child.textContent) {
      extracted.push(child.textContent);
    } else if (isHTMLElement(child)) {
      const tagName = child.tagName.toLowerCase();
      const content = extractCode(child);
      const attributes = getAttributes(child);
      extracted.push({
        tagName,
        content,
        attributes,
      });
    }
  }
  return extracted;
};

export const processCode = (source: Element): [BoxToken, HighlightToken[]] => {
  const tagName = source.tagName.toLowerCase();
  const attributes = getAttributes(source);
  const { tokens, highlights } = tokenize(extractCode(source));
  return [{ x: 0, y: 0, tagName, attributes, tokens }, highlights];
};
