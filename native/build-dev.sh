#!/bin/bash

# Script לבניית Development Build

echo "🛠️  בניית Development Build"
echo "================================"
echo ""

# Set UTF-8 encoding
export LANG=en_US.UTF-8

# Navigate to project directory
cd "$(dirname "$0")"

echo "בחר פלטפורמה:"
echo "1) iOS"
echo "2) Android"
echo "3) שתיהן"
read -p "הזן בחירה (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📱 בונה iOS Development Build..."
    echo "⚠️  ייתכן שתצטרך להזין Apple credentials"
    eas build --profile development --platform ios
    ;;
  2)
    echo ""
    echo "🤖 בונה Android Development Build..."
    eas build --profile development --platform android
    ;;
  3)
    echo ""
    echo "📱 בונה iOS Development Build..."
    eas build --profile development --platform ios
    echo ""
    echo "🤖 בונה Android Development Build..."
    eas build --profile development --platform android
    ;;
  *)
    echo "❌ בחירה לא תקינה"
    exit 1
    ;;
esac

echo ""
echo "✅ בנייה הושלמה!"
echo ""
echo "📥 הורד את ה-build מה-EAS Dashboard:"
echo "   https://expo.dev/accounts/orel895/projects/yanuka/builds"
echo ""
echo "🚀 לאחר ההתקנה, הרץ:"
echo "   npm start"

