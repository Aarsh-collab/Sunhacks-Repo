# SunBooks - ASU Textbook Marketplace (Authentication)

Authentication system for ASU-only textbook marketplace.

## Current Status: Authentication Complete ✅

### What's Built:
- ✅ ASU email verification (@asu.edu only)
- ✅ User document creation in Firestore
- ✅ Reputation system setup
- ✅ Auth state management
- ✅ Test suite

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: `asu-textbook-marketplace`
3. Enable Authentication (Google provider)
4. Enable Firestore Database
5. Copy your config values to `.env` file

### 3. Create .env File
Copy `env.example` to `.env` and add your Firebase config:
```bash
cp env.example .env
```

Then edit `.env` with your actual Firebase values.

### 4. Test Authentication
```bash
npm run test
```

## Firebase Setup Steps

### Enable Authentication:
1. Go to **Authentication → Sign-in method**
2. Click **"Google"**
3. Enable it
4. Add your project support email
5. Click **"Save"**

### Enable Firestore:
1. Go to **Firestore Database**
2. Click **"Create database"**
3. Start in **test mode** (for hackathon)
4. Choose location (us-central1 is fine)

### Get Your Config:
1. Go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click **"Web"** icon
4. Register app: `asu-textbook-marketplace`
5. Copy the config values
6. Paste them into your `.env` file

## Firestore Rules

Go to **Firestore Database → Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all user documents (for reputation)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

## What You'll See When It Works:

```
🧪 Testing ASU Authentication System...

1️⃣ Testing Google Sign In...
✅ Google sign in successful
   Email: your.email@asu.edu
   Name: Your Name

2️⃣ Testing ASU email verification...
✅ ASU email verified

3️⃣ Testing user document creation...
✅ User document created

4️⃣ Testing sign out...
✅ Sign out successful

🎉 All authentication tests passed!
```

## Next Features to Build:

1. **Listing Management** (`lib/listings.js`)
   - Create listing
   - Update listing
   - Delete listing
   - Get user's listings

2. **Search System** (`lib/search.js`)
   - Search by course code
   - Search by title/ISBN
   - Filter by price/condition

3. **Messaging System** (`lib/messages.js`)
   - Send message
   - Get conversation
   - Mark as read

4. **Meetup System** (`lib/meetups.js`)
   - Schedule meetup
   - Accept/decline
   - Complete trade

## Development Flow:
1. Build backend logic first
2. Test with `npm run test`
3. Add features incrementally
4. Add frontend when backend is solid
5. Connect frontend to backend functions

This approach lets you focus on the core logic without getting distracted by UI details!
