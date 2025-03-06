# Firestore Setup for Token Tracking

This document provides instructions on how to set up Firestore for token tracking in the AI Interview Assistant application.

## Prerequisites

1. A Firebase project (the same one used for authentication)
2. Firebase CLI installed (`npm install -g firebase-tools`)

## Setup Steps

### 1. Enable Firestore in your Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. In the left sidebar, click on "Firestore Database"
4. Click "Create database"
5. Choose "Start in production mode" (recommended)
6. Select a location closest to your users
7. Click "Enable"

### 2. Deploy Firestore Security Rules

The application includes a `firestore.rules` file with the necessary security rules. To deploy these rules:

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

### 3. Create a Test Document

For the application to check Firestore availability, create a test document:

1. In the Firebase Console, go to Firestore Database
2. Click "Start collection"
3. Set Collection ID to "test"
4. Add a document with ID "test"
5. Add a field "exists" with value "true"
6. Click "Save"

### 4. Set Up Indexes (if needed)

If you plan to query sessions by user ID and other fields, you may need to create indexes:

1. In the Firebase Console, go to Firestore Database
2. Click on the "Indexes" tab
3. Click "Add index"
4. Collection ID: "sessions"
5. Fields to index:
   - userId (Ascending)
   - startTime (Descending)
6. Click "Create index"

## Data Structure

The application uses the following Firestore collections:

### Sessions Collection

Each document in the "sessions" collection represents an interview session:

```
sessions/{sessionId}
{
  id: string,            // Session ID
  userId: string,        // User ID from Firebase Auth
  userEmail: string,     // User's email
  interviewType: string, // Type of interview (e.g., "software-engineer")
  startTime: timestamp,  // When the session started
  lastUpdated: timestamp,// When the session was last updated
  totalTokens: number,   // Total tokens used in the session
  completed: boolean     // Whether the session is completed
}
```

## Troubleshooting

### Firestore Connection Issues

If you encounter Firestore connection issues:

1. Check that your Firebase project has Firestore enabled
2. Verify that your security rules allow the operations you're trying to perform
3. Ensure your application has the correct Firebase configuration
4. Check for any CORS issues in the browser console

### Security Rules

If you're having permission issues, you can temporarily set more permissive rules for testing:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note:** Always revert to more restrictive rules before deploying to production.

## Monitoring Usage

You can monitor Firestore usage in the Firebase Console:

1. Go to the Firebase Console
2. Select your project
3. In the left sidebar, click on "Firestore Database"
4. Click on the "Usage" tab

This will show you the number of reads, writes, and deletes, which can help you track your Firestore costs. 