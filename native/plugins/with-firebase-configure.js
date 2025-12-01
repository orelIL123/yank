const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to add FirebaseApp.configure() to AppDelegate.swift
 * This fixes: "No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()"
 */
const withFirebaseConfigure = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const appDelegatePath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'AppDelegate.swift'
      );
      
      if (fs.existsSync(appDelegatePath)) {
        let content = fs.readFileSync(appDelegatePath, 'utf8');
        
        // Check if Firebase import already exists
        if (!content.includes('import FirebaseCore')) {
          // Add import after other imports
          content = content.replace(
            /import ReactAppDependencyProvider/,
            'import ReactAppDependencyProvider\nimport FirebaseCore'
          );
          console.log('✅ Added FirebaseCore import to AppDelegate.swift');
        }
        
        // Check if FirebaseApp.configure() already exists
        if (!content.includes('FirebaseApp.configure()')) {
          // Add FirebaseApp.configure() at the beginning of didFinishLaunchingWithOptions
          content = content.replace(
            /didFinishLaunchingWithOptions launchOptions: \[UIApplication\.LaunchOptionsKey: Any\]\? = nil\s*\) -> Bool \{/,
            `didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase FIRST, before anything else
    FirebaseApp.configure()
    `
          );
          console.log('✅ Added FirebaseApp.configure() to AppDelegate.swift');
        } else {
          console.log('ℹ️  FirebaseApp.configure() already exists in AppDelegate.swift');
        }
        
        fs.writeFileSync(appDelegatePath, content);
        console.log('✅ Firebase configuration applied to AppDelegate.swift');
      } else {
        console.log('⚠️  AppDelegate.swift not found at:', appDelegatePath);
      }
      
      return config;
    },
  ]);
};

module.exports = withFirebaseConfigure;

