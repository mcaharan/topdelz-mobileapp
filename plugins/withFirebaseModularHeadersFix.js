const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// React Native Firebase's static-framework pods (RNFBApp, RNFBAuth, ...) include
// non-modular React-Core headers (RCTConvert.h, RCTBridgeModule.h, ...), which
// Xcode treats as a hard build error under use_frameworks: static. This is a
// known upstream issue with no config-plugin-level fix from either Expo or
// react-native-firebase, so we patch the generated Podfile's post_install hook
// directly since prebuild regenerates it on every build.
const SETTING = 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';

module.exports = function withFirebaseModularHeadersFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes(SETTING)) {
        contents = contents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |build_config|\n        build_config.build_settings['${SETTING}'] = 'YES'\n      end\n    end\n`
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
};
