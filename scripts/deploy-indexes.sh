#!/bin/bash

# Deploy Firestore Indexes Script
# This script deploys Firestore indexes using Firebase CLI

echo "🚀 Deploying Firestore Indexes..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  Not logged in to Firebase. Logging in..."
    firebase login
fi

# Deploy indexes
echo "📦 Deploying indexes from firestore.indexes.json..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore indexes deployed successfully!"
    echo "⏳ Indexes may take 5-10 minutes to build."
    echo "You can check status in Firebase Console → Firestore → Indexes"
else
    echo ""
    echo "❌ Failed to deploy indexes. Check the error above."
    exit 1
fi
