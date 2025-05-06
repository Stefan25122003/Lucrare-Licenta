const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Adăugăm alias-uri pentru module
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'process/browser': require.resolve('process/browser.js')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert/'),
      constants: require.resolve('constants-browserify'),
      process: require.resolve('process/browser.js')
    }
  };
  
  // Adăugăm plugin-urile
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    })
  ];
  
  return config;
}