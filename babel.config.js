module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        ["babel-preset-expo", { 
          jsxImportSource: "nativewind",
          enableReactNativeWebSupport: true
        }],
        "nativewind/babel",
      ],
      plugins: [
        "react-native-reanimated/plugin",
      ],
    };
  };