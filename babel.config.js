module.exports = (api) => {
  if (api.env("test")) {
    return {
      presets: [
        [ "@babel/preset-env", {
          targets: { node: "current" },
          modules: "commonjs",
        } ],
        [ "@babel/preset-typescript" ],
      ],
    };
  } else {
    return {
      presets: [
        [ "@babel/preset-env" ],
      ],
    };
  }
};


