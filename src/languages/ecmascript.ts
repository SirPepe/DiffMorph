// Implements support for both plain JavaScript and TypeScript with JSX syntax.
// TS features are controlled by a flag, which the TypeScript language
// definition binds to true.

import { isNewLine } from "../lib/util";
import { RawToken } from "../types";

type Flags = {
  types: boolean;
};

type State = {
  lineCommentState: boolean;
  blockCommentState: boolean;
  regexState: boolean;
  stringState: false | string; // string indicates the type of quotes used
};

const defaultState = (): State => ({
  lineCommentState: false,
  blockCommentState: false,
  regexState: false,
  stringState: false,
});

export const languageDefinition = (
  flags: Flags = { types: false }
): ((token: RawToken) => string | string[]) => {
  const { types } = flags;
  const state = defaultState();
  return (token: RawToken): string | string[] => {
    // exit line comment state (on new line)
    if (state.lineCommentState && isNewLine(token)) {
      state.lineCommentState = false;
    }

    // exit regex state (on new line)
    if (state.regexState && isNewLine(token)) {
      state.regexState = false;
    }

    // exit block comment state
    if (
      state.blockCommentState === true &&
      state.stringState === false &&
      token.text === "/" &&
      token?.prev?.text === "*"
    ) {
      state.blockCommentState = false;
      return "comment-block";
    }
    // enter block comment state
    if (
      state.blockCommentState === false &&
      state.stringState === false &&
      token.text === "/" &&
      token?.next?.text === "*"
    ) {
      state.blockCommentState = true;
      return "comment-block";
    }
    // are we in block comment state?
    if (state.blockCommentState) {
      return "comment-block";
    }

    // enter line comment state
    if (
      state.lineCommentState === false &&
      state.stringState === false &&
      token.text === "/" &&
      token?.next?.text === "/"
    ) {
      state.lineCommentState = true;
      return "comment-line";
    }
    // are we in line comment state?
    if (state.lineCommentState) {
      return "comment-line";
    }

    return "token";
  };
};

export const gluePredicate = (): boolean => false;
