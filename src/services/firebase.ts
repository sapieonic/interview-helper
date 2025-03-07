import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Your Firebase configuration for client-side auth only
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Initialize Firebase for authentication only
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen for auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Session management functions using backend API
export const createSession = async (
  userId: string,
  userEmail: string,
  interviewType: string
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/firebase/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, userEmail, interviewType }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create session');
    }
    
    const data = await response.json();
    return data.sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const updateSessionTokens = async (
  sessionId: string,
  tokenCount: number
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/firebase/update-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, tokenCount }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update session tokens');
    }
  } catch (error) {
    console.error('Error updating session tokens:', error);
    // Don't throw the error to prevent disrupting the user experience
  }
};

export const completeSession = async (sessionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/firebase/complete-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete session');
    }
  } catch (error) {
    console.error('Error completing session:', error);
    // Don't throw the error to prevent disrupting the user experience
  }
};

export const getSessionData = async (sessionId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/firebase/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get session data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting session data:', error);
    throw error;
  }
};

export const listUserSessions = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/firebase/user-sessions/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list user sessions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error listing user sessions:', error);
    return [];
  }
};

export default auth; 