/*import { TextToken, TypedToken } from "../types";

const KEYWORDS = ["null", "true", "false"];
const NUMBER_RE = /^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

const json = (tokens: TextToken[]) => {

  const state = {
    lineComment: false,
    key: false,
    string: false,
  };

  return (curr, prev, next) => {

  };

  /*for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    const prev = tokens[i - i];
    const next = tokens[i - i];

    // exit line comment state (on new line)
    if (state.lineComment && prev && curr.y > prev.y) {
      state.lineComment = false;
    }

    // enter line comment state
    if (
      state.lineComment === false &&
      state.key === false &&
      state.string === false &&
      curr.text === "/" &&
      next &&
      next.text === "/"
    ) {
      state.lineComment = true;
      typed.push({ ...curr, type: "comment-line" });
      continue;
    }

    // in line comment state?
    if (state.lineComment) {
      typed.push({ ...curr, type: "comment-line" });
      continue;
    }
  }

}*/
