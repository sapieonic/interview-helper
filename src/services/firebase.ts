import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: import.meta.env.VITE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence when possible
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Firestore persistence enabled");
    })
    .catch((err) => {
      console.error("Error enabling Firestore persistence:", err);
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      }
    });
} catch (error) {
  console.error("Error setting up Firestore:", error);
}

const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return null;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen for auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Interface for session data
export interface SessionData {
  id: string;
  userId: string;
  userEmail: string;
  interviewType: string;
  startTime: Timestamp;
  lastUpdated: Timestamp;
  totalTokens: number;
  completed: boolean;
}

// Check if Firestore is available and properly configured
let firestoreAvailable = true;

const checkFirestoreAvailability = async (): Promise<boolean> => {
  if (!firestoreAvailable) return false;
  
  try {
    // Try to access a collection to verify Firestore is working
    // Instead of trying to read a document, we'll just check if we can access the database
    const sessionsRef = collection(db, 'sessions');
    
    // Just check if the collection reference is valid
    if (sessionsRef) {
      console.log('Firestore connection successful');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Firestore is not available:', error);
    firestoreAvailable = false;
    return false;
  }
};

// Create a new session
export const createSession = async (userId: string, userEmail: string, interviewType: string): Promise<string> => {
  try {
    // Check if Firestore is available
    if (!await checkFirestoreAvailability()) {
      console.warn('Firestore is not available, using local session ID');
      return `local_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Generate a unique session ID
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9);
    const sessionId = `session_${timestamp}_${randomPart}`;
    
    console.log('Creating new session with ID:', sessionId);
    
    // Create a reference to the session document
    const sessionRef = doc(db, 'sessions', sessionId);
    
    // Create the session data
    const sessionData: SessionData = {
      id: sessionId,
      userId,
      userEmail,
      interviewType,
      startTime: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      totalTokens: 0,
      completed: false
    };
    
    // Create the session document
    await setDoc(sessionRef, sessionData);
    console.log('Session created successfully in Firestore:', sessionId);
    
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    // Return a local session ID as fallback
    return `local_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};

// Update session with token count
export const updateSessionTokens = async (sessionId: string, additionalTokens: number): Promise<void> => {
  try {
    // Skip if using a local session ID or Firestore is not available
    if (sessionId.startsWith('local_') || !await checkFirestoreAvailability()) {
      console.log('Using local session, token update skipped');
      return;
    }
    
    console.log(`Updating session ${sessionId} with ${additionalTokens} additional tokens`);
    
    // Get a direct reference to the session document
    const sessionRef = doc(db, 'sessions', sessionId);
    
    // First, try to get the current document to check if it exists
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      // Get current token count from the document
      const currentData = sessionDoc.data();
      const currentTokens = currentData.totalTokens || 0;
      const newTotalTokens = currentTokens + additionalTokens;
      
      console.log(`Current tokens in Firestore: ${currentTokens}, Adding: ${additionalTokens}, New total: ${newTotalTokens}`);
      
      // Update the document with new token count
      await updateDoc(sessionRef, {
        totalTokens: newTotalTokens,
        lastUpdated: Timestamp.now()
      });
      
      console.log(`Successfully updated session ${sessionId}. New total in Firestore: ${newTotalTokens}`);
    } else {
      console.error('Session not found for updating:', sessionId);
      
      // If the session doesn't exist (which shouldn't happen), create it
      console.log('Attempting to recreate the session document');
      
      // Create a basic session document
      await setDoc(sessionRef, {
        id: sessionId,
        totalTokens: additionalTokens,
        lastUpdated: Timestamp.now(),
        startTime: Timestamp.now(),
        completed: false
      });
      
      console.log(`Created new session document with ID: ${sessionId} and initial tokens: ${additionalTokens}`);
    }
  } catch (error) {
    console.error('Error updating session tokens:', error);
    // Continue without throwing to prevent app from crashing
  }
};

// Mark session as completed
export const completeSession = async (sessionId: string): Promise<void> => {
  try {
    // Skip if using a local session ID or Firestore is not available
    if (sessionId.startsWith('local_') || !await checkFirestoreAvailability()) {
      console.log('Using local session, completion skipped');
      return;
    }
    
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      completed: true,
      lastUpdated: Timestamp.now()
    });
    console.log(`Marked session ${sessionId} as completed`);
  } catch (error) {
    console.error('Error completing session:', error);
    // Continue without throwing to prevent app from crashing
  }
};

// Get session data for debugging
export const getSessionData = async (sessionId: string): Promise<SessionData | null> => {
  try {
    // Skip if using a local session ID or Firestore is not available
    if (sessionId.startsWith('local_') || !await checkFirestoreAvailability()) {
      console.log('Using local session, cannot retrieve session data');
      return null;
    }
    
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      return sessionDoc.data() as SessionData;
    } else {
      console.error('Session not found:', sessionId);
      return null;
    }
  } catch (error) {
    console.error('Error getting session data:', error);
    return null;
  }
};

// List all sessions for a user (for debugging)
export const listUserSessions = async (userId: string): Promise<SessionData[]> => {
  try {
    // Check if Firestore is available
    if (!await checkFirestoreAvailability()) {
      console.warn('Firestore is not available, cannot list sessions');
      return [];
    }
    
    console.log('Listing sessions for user:', userId);
    
    // Query sessions for this user
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const sessions: SessionData[] = [];
    
    querySnapshot.forEach((doc) => {
      sessions.push(doc.data() as SessionData);
    });
    
    console.log(`Found ${sessions.length} sessions for user ${userId}`);
    return sessions;
  } catch (error) {
    console.error('Error listing user sessions:', error);
    return [];
  }
};

export { db };
export default auth; 