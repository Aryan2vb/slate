module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 compiles worklets through react-native-worklets.
    // This must stay last in the plugin list.
    plugins: ['react-native-worklets/plugin'],
  };
};
