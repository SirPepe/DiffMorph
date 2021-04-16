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
      plugins: [
        "@babel/plugin-transform-runtime",
      ],
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

export default [
  {
    input: "src/element/element.ts",
    output: {
      sourcemap: true,
      file: "dist/esm/element.js",
      format: "esm",
      plugins: [license({ banner })],
    },
    ...esmConfig,
  },
  {
    input: "src/element/element.ts",
    output: {
      sourcemap: true,
      file: "dist/min/element.js",
      format: "umd",
      name: "DiffMorph",
      plugins: [terser(), license({ banner })],
    },
    ...minConfig,
  },
];
