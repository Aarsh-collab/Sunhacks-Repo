import { db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Get user by UID
 * @param {string} uid - User UID
 * @returns {Promise<User>} User object
 */
export const getUser = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    return { uid: userSnap.id, ...userSnap.data() };
  } catch (error) {
    console.error('❌ Error getting user:', error);
    throw error;
  }
};

/**
 * Ensure user document exists (contract-compliant version)
 * @returns {Promise<void>}
 */
export const ensureUserDoc = async () => {
  try {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe(); // Unsubscribe after first call
        
        if (!firebaseUser) {
          reject(new Error('No authenticated user'));
          return;
        }
        
        // Check if email is ASU email
        if (!firebaseUser.email?.endsWith('@asu.edu')) {
          reject(new Error('Non-ASU email rejected'));
          return;
        }
        
        try {
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
            console.log('✅ User document created');
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error ensuring user doc:', error);
    throw error;
  }
};

/**
 * Update user reputation (internal use)
 * @param {string} uid - User UID
 * @param {Object} reputation - New reputation data
 * @returns {Promise<void>}
 */
export const updateUserReputation = async (uid, reputation) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { reputation });
    console.log(`✅ User ${uid} reputation updated`);
  } catch (error) {
    console.error('❌ Error updating user reputation:', error);
    throw error;
  }
};

/**
 * Get user's listings
 * @param {string} uid - User UID
 * @returns {Promise<Listing[]>} Array of user's listings
 */
export const getUserListings = async (uid) => {
  try {
    const { getListingsByOwner } = await import('./listings.js');
    return await getListingsByOwner(uid);
  } catch (error) {
    console.error('❌ Error getting user listings:', error);
    throw error;
  }
};

/**
 * Get user's meetups
 * @param {string} uid - User UID
 * @returns {Promise<Object>} Object with buyer and seller meetups
 */
export const getUserMeetups = async (uid) => {
  try {
    const { getMeetupsForUser } = await import('./meetups.js');
    return await getMeetupsForUser(uid);
  } catch (error) {
    console.error('❌ Error getting user meetups:', error);
    throw error;
  }
};
