const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to add use_modular_headers! to Podfile for Firebase and React-Core compatibility
 * This fixes the issue: "include of non-modular header inside framework module"
 */
const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Check if use_modular_headers! already exists
        if (!podfileContent.includes('use_modular_headers!')) {
          // Strategy 1: Add after platform declaration (most common case)
          if (podfileContent.includes("platform :ios")) {
            podfileContent = podfileContent.replace(
              /(platform :ios, ['"]\d+\.\d+['"])/,
              (match) => `${match}\n  use_modular_headers!`
            );
          }
          
          // Strategy 2: If still not added, add right after the first require or at the top
          if (!podfileContent.includes('use_modular_headers!')) {
            const lines = podfileContent.split('\n');
            let insertIndex = -1;
            
            // Find the line after platform declaration
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes('platform :ios')) {
                insertIndex = i + 1;
                break;
              }
            }
            
            // If platform not found, find after require statements
            if (insertIndex === -1) {
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('require') && i + 1 < lines.length) {
                  if (!lines[i + 1].trim().startsWith('require') && lines[i + 1].trim() !== '') {
                    insertIndex = i + 1;
                    break;
                  }
                }
              }
            }
            
            // If still not found, add at line 2 (after first line)
            if (insertIndex === -1) {
              insertIndex = 1;
            }
            
            if (insertIndex > 0 && insertIndex < lines.length) {
              lines.splice(insertIndex, 0, 'use_modular_headers!');
              podfileContent = lines.join('\n');
            }
          }
          
          // Strategy 3: If still not added, add at the beginning of the file
          if (!podfileContent.includes('use_modular_headers!')) {
            podfileContent = 'use_modular_headers!\n' + podfileContent;
          }
          
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('✅ Added use_modular_headers! to Podfile for Firebase/React-Core compatibility');
        } else {
          console.log('ℹ️  use_modular_headers! already exists in Podfile');
        }
      } else {
        console.log('⚠️  Podfile not found at:', podfilePath);
        console.log('   This is normal during prebuild. The plugin will run again when Podfile is created.');
      }
      
      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;

