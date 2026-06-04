const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Force Zustand to use the CommonJS build to avoid 'import.meta' errors in Hermes/Web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('zustand')) {
    const result = require.resolve(moduleName);
    return context.resolveRequest(context, result, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
