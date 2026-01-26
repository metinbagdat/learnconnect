#!/bin/bash
# Deploy Firestore security rules to Firebase

set -e

echo "🔒 Deploying Firestore security rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo "⚠️  firebase.json not found. Creating basic configuration..."
    cat > firebase.json << EOF
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
EOF
fi

# Deploy rules
echo "📤 Deploying rules to Firebase..."
firebase deploy --only firestore:rules

echo "✅ Firestore rules deployed successfully!"
echo "🔍 Verify rules in Firebase Console: https://console.firebase.google.com/project/_/firestore/rules"
