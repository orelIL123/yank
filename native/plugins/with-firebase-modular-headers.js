const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to configure modular headers for Firebase dependencies only
 * This fixes Firebase compatibility without breaking gRPC-Core
 */
const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Remove global use_modular_headers! if it exists (causes gRPC issues)
        if (podfileContent.includes('use_modular_headers!')) {
          podfileContent = podfileContent.replace(/^\s*use_modular_headers!\s*$/gm, '');
          console.log('✅ Removed global use_modular_headers! to fix gRPC-Core compatibility');
        }
        
        // Add post_install hook to enable modular headers only for Firebase dependencies
        const firebaseModularHeadersHook = `
  post_install do |installer|
    # Enable modular headers only for Firebase dependencies (not gRPC)
    installer.pods_project.targets.each do |target|
      firebase_deps = [
        'FirebaseAuthInterop',
        'FirebaseAppCheckInterop',
        'FirebaseCore',
        'FirebaseCoreExtension',
        'GoogleUtilities',
        'RecaptchaInterop',
        'FirebaseFirestoreInternal',
        'FirebaseCoreInternal',
        'FirebaseAuth',
        'FirebaseFirestore',
        'FirebaseStorage'
      ]
      
      # Skip gRPC pods - they don't support modular headers
      next if target.name.start_with?('gRPC')
      next if target.name.start_with?('BoringSSL')
      
      if firebase_deps.include?(target.name)
        target.build_configurations.each do |config|
          config.build_settings['DEFINES_MODULE'] = 'YES'
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
        end
      end
    end
  end`;
        
        // Check if post_install already exists
        if (podfileContent.includes('post_install do |installer|')) {
          // Add Firebase modular headers logic to existing post_install
          if (!podfileContent.includes('firebase_deps = [')) {
            // Find the post_install block and add before react_native_post_install
            const postInstallRegex = /(post_install do \|installer\|[\s\S]*?)(react_native_post_install)/;
            if (postInstallRegex.test(podfileContent)) {
              podfileContent = podfileContent.replace(
                postInstallRegex,
                (match, postInstallBlock, reactNativeCall) => {
                  if (!postInstallBlock.includes('firebase_deps = [')) {
                    return postInstallBlock + `
    # Enable modular headers only for Firebase dependencies (not gRPC)
    installer.pods_project.targets.each do |target|
      firebase_deps = [
        'FirebaseAuthInterop',
        'FirebaseAppCheckInterop',
        'FirebaseCore',
        'FirebaseCoreExtension',
        'GoogleUtilities',
        'RecaptchaInterop',
        'FirebaseFirestoreInternal',
        'FirebaseCoreInternal',
        'FirebaseAuth',
        'FirebaseFirestore',
        'FirebaseStorage'
      ]
      
      # Skip gRPC pods - they don't support modular headers
      next if target.name.start_with?('gRPC')
      next if target.name.start_with?('BoringSSL')
      
      if firebase_deps.include?(target.name)
        target.build_configurations.each do |config|
          config.build_settings['DEFINES_MODULE'] = 'YES'
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
        end
      end
    end
` + reactNativeCall;
                  }
                  return match;
                }
              );
            }
          }
        } else {
          // Add new post_install hook before the end of target block
          if (podfileContent.includes("end")) {
            podfileContent = podfileContent.replace(
              /(\s+)(end\s*$)/m,
              firebaseModularHeadersHook + '\n$1$2'
            );
          }
        }
        
        fs.writeFileSync(podfilePath, podfileContent);
        console.log('✅ Configured selective modular headers for Firebase (excluding gRPC)');
      } else {
        console.log('⚠️  Podfile not found at:', podfilePath);
        console.log('   This is normal during prebuild. The plugin will run again when Podfile is created.');
      }
      
      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;

