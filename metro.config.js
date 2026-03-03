const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

// Adding custom configuration to handle too many open files issue
const customConfig = {
  watchFolders: ['./'], // Ensure this points to your project root
  maxWorkers: 2,        // Reduce the number of workers to minimize file watchers
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest: (context, moduleName, platform) => {
      // Use axios browser build in React Native (avoids Node-only crypto, http, etc.)
      if (moduleName === 'axios') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'node_modules/axios/dist/browser/axios.cjs'),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
