import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import license from "rollup-plugin-license";
import commonjs from "@rollup/plugin-commonjs";

const banner = {
  content:
    "DiffMorph | Copyright (C) 2021 Peter Kröner | peter@peterkroener.de | Dual license GPL-3.0-only/commercial",
  commentStyle: "ignored",
};

const extensions = [".ts", ".js"];

const esmConfig = {
  external: [/@babel\/runtime/, /core-js/],
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    babel({
      extensions,
      babelHelpers: "runtime",
      exclude: "node_modules/**",
      presets: [
        [
          "@babel/preset-env",
          {
            targets: "defaults,not ie 11",
            useBuiltIns: "usage",
            corejs: "3.8",
          },
        ],
        "@babel/preset-typescript",
      ],
      plugins: ["@babel/plugin-transform-runtime"],
    }),
  ],
};

const minConfig = {
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    babel({
      extensions,
      babelHelpers: "inline",
      exclude: "node_modules/**",
      presets: [
        [
          "@babel/preset-env",
          {
            targets: "defaults,not ie 11",
            useBuiltIns: "usage",
            corejs: "3.8",
          },
        ],
        "@babel/preset-typescript",
      ],
    }),
  ],
};

function esm(input, file) {
  return {
    input,
    output: {
      sourcemap: true,
      file,
      format: "esm",
      plugins: [license({ banner })],
    },
    ...esmConfig,
  };
}

function min(input, file, name) {
  return {
    input,
    output: {
      sourcemap: true,
      file,
      format: "umd",
      name,
      plugins: [terser(), license({ banner })],
    },
    ...minConfig,
  };
}

export default [
  esm("src/index.ts", "dist/esm/index.js"),
  esm("src/element/element.ts", "dist/esm/element.js"),
  esm("src/element/highlight.ts", "dist/esm/highlight.js"),
  min("src/index.ts", "dist/min/index.js", "DiffMorph"),
  min("src/element/element.ts", "dist/min/element.js", "DiffMorph"),
  min("src/element/highlight.ts", "dist/min/highlight.js", "HighlightedCode"),
];
