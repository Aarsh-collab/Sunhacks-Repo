# Firestore Setup Instructions

## Required Firestore Index

To make the contract-compliant queries work, you need to create a composite index in Firestore.

### Steps:

1. **Go to Firebase Console** → Your Project → **Firestore Database**
2. Click on **"Indexes"** tab
3. Click **"Create Index"**
4. Set up the index with these exact settings:

**Collection ID:** `listings`
**Fields:**
- Field 1: `status` (Ascending)
- Field 2: `createdAt` (Descending)

5. Click **"Create"**

### Why This Index is Needed:
The contract requires this query:
```javascript
query(
  collection(db, 'listings'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
  limit(100)
)
```

Firestore requires a composite index for queries that filter on one field and order by another field.

## Firestore Security Rules

Add these rules to your Firestore Database → Rules:

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
    
    // Listings: authenticated users can read all, write their own
    match /listings/{listingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.ownerUid == request.auth.uid);
    }
    
    // Meetups: authenticated users can read/write if they're buyer or seller
    match /meetups/{meetupId} {
      allow read, write: if request.auth != null && 
        (resource.data.buyerUid == request.auth.uid || 
         resource.data.sellerUid == request.auth.uid);
    }
  }
}
```

## Test Data (Optional)

You can add this test data to verify everything works:

### User Document:
**Collection:** `users`
**Document ID:** `u1`
```json
{
  "uid": "u1",
  "displayName": "Alex Doe",
  "asuEmail": "adoe@asu.edu",
  "reputation": {
    "completedTrades": 1,
    "rating": 5
  },
  "createdAt": 1727400000000
}
```

### Listing Document:
**Collection:** `listings`
**Document ID:** `seed1`
```json
{
  "ownerUid": "u1",
  "title": "Calculus: ET",
  "author": "Stewart",
  "isbn": "9781285741550",
  "edition": "8th",
  "courseCodes": ["MAT265"],
  "price": 35,
  "imageUrl": "https://via.placeholder.com/300x400?text=Book",
  "status": "active",
  "searchKeys": ["CALCULUS", "STEWART", "MAT265", "9781285741550"],
  "createdAt": 1727400000000
}
```

## Verification

After setting up the index and rules:

1. **Test the index** by running a query in the Firebase Console
2. **Test authentication** with your existing auth system
3. **Test listing creation** using the new service functions

Your setup will be 100% contract-compliant and ready for your teammates to build the frontend!
