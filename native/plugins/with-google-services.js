const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for google-services.json
 * 
 * This plugin creates google-services.json from EAS Secret during build.
 * 
 * Usage:
 * 1. Add the plugin to app.json plugins array
 * 2. Set EAS Secret: eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type string
 * 3. The plugin will automatically create the file during build
 */
module.exports = function withGoogleServices(config) {
  // Only run during EAS Build (when GOOGLE_SERVICES_JSON env var exists)
  if (process.env.GOOGLE_SERVICES_JSON) {
    const googleServicesPath = path.join(process.cwd(), 'google-services.json');
    
    try {
      // Write the secret content to google-services.json
      fs.writeFileSync(googleServicesPath, process.env.GOOGLE_SERVICES_JSON, 'utf8');
      console.log('✅ google-services.json created from EAS Secret');
    } catch (error) {
      console.warn('⚠️ Failed to create google-services.json:', error.message);
    }
  } else {
    // In local development, check if file exists
    const googleServicesPath = path.join(process.cwd(), 'google-services.json');
    if (!fs.existsSync(googleServicesPath)) {
      console.warn('⚠️ google-services.json not found. Make sure to add it locally or set GOOGLE_SERVICES_JSON secret for EAS Build.');
    }
  }
  
  return config;
};
