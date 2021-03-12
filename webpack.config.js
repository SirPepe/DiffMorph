module.exports = (env) => {
  const mode = env.mode || "production";
  const isProd = env.mode === "production";
  return {
    mode,
    devtool: (isProd) ? "inline-source-map" : false,
    entry: "./src/element/diff-morph.ts",
    resolve: {
      extensions: [".ts", ".js"]
    },
    output: {
      path: require("path").resolve(__dirname, "dist"),
      filename: "diff-morph.js",
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            { loader: "babel-loader" },
            { loader: "ts-loader" },
          ]
        }
      ]
    }
  };
};
