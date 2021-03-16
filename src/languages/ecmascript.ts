// Implements support for both plain JavaScript and TypeScript with JSX syntax.
// TS features are controlled by a flag, which the TypeScript language
// definition binds to true.

import { isNewLine, lookaheadText, prev } from "../lib/util";
import {
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  RawToken,
} from "../types";
import { languageDefinition as HTML } from "./html";

type Flags = {
  types: boolean;
};

type State = {
  lineCommentState: boolean;
  blockCommentState: boolean;
  regexState: boolean;
  stringState: false | string; // string indicates the type of quotes used
};

function defaultState(): State {
  return {
    lineCommentState: false,
    blockCommentState: false,
    regexState: false,
    stringState: false,
  };
}

// Wrap the actual ES definition function with something that, after each
// token, checks if the next token signifies a return to HTML.
function exitDecorator(language: LanguageFunction): LanguageFunction {
  return function (token: RawToken): LanguageFunctionResult {
    const res = language(token);
    const steps = Array.isArray(res) ? res.length : 1;
    const base = prev(token, steps);
    if (base) {
      if (lookaheadText(token, 4, ["<", "/", "script", ">"])) {
        const result = Array.isArray(res) ? res : [res];
        return [
          ...result,
          {
            definitionFactory: () => HTML.definitionFactory({ xml: false }),
            postprocessor: HTML.postprocessor,
          },
        ];
      }
    }
    return res;
  };
}

function defineECMAScript(flags: Flags = { types: false }): LanguageFunction {
  const { types } = flags;
  const state = defaultState();

  return exitDecorator(function ecmaScript(
    token: RawToken
  ): LanguageFunctionResult {
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
  });
}

function postprocessECMAScript(): boolean {
  return false;
}

export const languageDefinition: LanguageDefinition<Flags> = {
  definitionFactory: defineECMAScript,
  postprocessor: postprocessECMAScript,
};
