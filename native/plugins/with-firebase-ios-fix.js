const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to fix React Native Firebase iOS build issues with modular headers
 * This fixes: "include of non-modular header inside framework module"
 * 
 * The fix adds CLANG_WARN_NON_MODULAR_INCLUDE_IN_FRAMEWORK_MODULE = NO
 * to the Podfile post_install hook
 */
const withFirebaseIOSFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // The fix we need to add to post_install
        const fixCode = `
    # Fix for React Native Firebase modular headers issue
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_WARN_NON_MODULAR_INCLUDE_IN_FRAMEWORK_MODULE'] = 'NO'
      end
    end`;
        
        // Check if fix already exists
        if (podfileContent.includes('CLANG_WARN_NON_MODULAR_INCLUDE_IN_FRAMEWORK_MODULE')) {
          console.log('ℹ️  Firebase iOS fix already exists in Podfile');
          return config;
        }
        
        // Look for post_install hook
        if (podfileContent.includes('post_install do |installer|')) {
          // Add our fix right after post_install starts
          podfileContent = podfileContent.replace(
            /post_install do \|installer\|/,
            `post_install do |installer|${fixCode}`
          );
          console.log('✅ Added Firebase iOS fix to existing post_install hook');
        } else {
          // No post_install hook exists, add one at the end before the last 'end'
          // Find the last 'end' that closes the main target block
          const lines = podfileContent.split('\n');
          let lastEndIndex = -1;
          
          // Find the position to insert (before the closing of the Podfile)
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === 'end') {
              lastEndIndex = i;
              break;
            }
          }
          
          if (lastEndIndex > 0) {
            const postInstallHook = `
post_install do |installer|${fixCode}
end
`;
            lines.splice(lastEndIndex + 1, 0, postInstallHook);
            podfileContent = lines.join('\n');
            console.log('✅ Added new post_install hook with Firebase iOS fix');
          } else {
            // Just append at the end
            podfileContent += `
post_install do |installer|${fixCode}
end
`;
            console.log('✅ Appended post_install hook with Firebase iOS fix');
          }
        }
        
        fs.writeFileSync(podfilePath, podfileContent);
        console.log('✅ Firebase iOS modular headers fix applied successfully');
      } else {
        console.log('⚠️  Podfile not found - this is normal during initial prebuild');
      }
      
      return config;
    },
  ]);
};

module.exports = withFirebaseIOSFix;

