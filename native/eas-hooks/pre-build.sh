#!/bin/bash
# Create google-services.json from environment variable
if [ -n "$GOOGLE_SERVICES_JSON_BASE64" ]; then
  echo "$GOOGLE_SERVICES_JSON_BASE64" | base64 -d > google-services.json
  echo "✅ google-services.json created from env"
fi
