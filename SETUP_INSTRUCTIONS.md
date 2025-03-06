# Setting Up Firestore for Token Tracking

Follow these steps to properly set up Firestore in your Firebase project for token tracking.

## Step 1: Enable Firestore in Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (interviewhelper-pilot)
3. In the left sidebar, click on "Firestore Database"
4. Click "Create database"
5. Choose "Start in production mode" (you can change the rules later)
6. Select a location closest to your users
7. Click "Enable"

## Step 2: Deploy Firestore Rules

You can deploy the Firestore rules using the Firebase CLI:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
# When prompted, select Firestore and use the existing files
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## Step 3: Verify Firestore Setup

1. Go back to the Firebase Console
2. Navigate to Firestore Database
3. You should see an empty database with no collections

## Step 4: Test the Application

1. Run the application with `npm run dev`
2. Sign in with your Google account
3. Start a new interview
4. Check the browser console for any Firestore-related errors

## Troubleshooting

### If you see "Missing or insufficient permissions" error:

1. Check that you've enabled Firestore in your Firebase project
2. Verify that you've deployed the security rules
3. Make sure you're signed in with a Google account in the application

### If you see "Firestore is not available" error:

1. This is a fallback message when Firestore can't be accessed
2. The application will still work, but token tracking will be local only
3. Check the browser console for more detailed error messages

## Temporary Workaround

If you continue to have issues with Firestore, the application will still function using local session IDs. Token tracking will work within the current browser session, but the data won't be persisted to Firebase.

## Checking Firestore Data

Once everything is working:

1. Go to the Firebase Console
2. Navigate to Firestore Database
3. You should see a "sessions" collection
4. Each document in this collection represents an interview session with token tracking

## Next Steps

After confirming that token tracking works:

1. You can make the security rules more restrictive (see firestore.rules)
2. Set up Firebase Authentication rules if needed
3. Consider adding analytics or other Firebase features 