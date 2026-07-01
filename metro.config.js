const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'flac' to the asset extensions so Metro bundler can load it
config.resolver.assetExts.push('flac');

module.exports = config;
