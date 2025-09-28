import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ASU email verification
export const verifyASUEmail = (email) => {
  return email?.endsWith('@asu.edu') || false;
};

// Ensure user document exists in Firestore
export const ensureUserDoc = async (firebaseUser) => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newUser = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'ASU Student',
      asuEmail: firebaseUser.email || '',
      reputation: {
        completedTrades: 0,
        rating: 5.0
      },
      createdAt: Date.now()
    };

    await setDoc(userRef, newUser);
    return newUser;
  }
  return userSnap.data();
};

// Auth state listener with ASU verification
export const setupAuthListener = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Check if email is ASU email
      if (!verifyASUEmail(firebaseUser.email)) {
        console.log('❌ Non-ASU email rejected:', firebaseUser.email);
        await signOut(auth);
        callback({ error: 'Non-ASU email rejected', user: null, authUser: null });
        return;
      }

      console.log('✅ ASU email verified:', firebaseUser.email);
      
      // Ensure user document exists
      const user = await ensureUserDoc(firebaseUser);
      
      callback({ 
        user, 
        authUser: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        }
      });
    } else {
      callback({ user: null, authUser: null });
    }
  });
};

// Sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out error:', error);
    return { success: false, error: error.message };
  }
};

