import { db } from './firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc 
} from 'firebase/firestore';

/**
 * Query listings with optional filters
 * @param {Object} filters - Optional filters: { course?, min?, max?, text? }
 * @returns {Promise<Listing[]>} Array of listing objects
 */
export const queryListings = async (filters = {}) => {
  try {
    let q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    let listings = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() });
    });

    // Apply client-side filters
    if (filters.course) {
      listings = listings.filter(listing => 
        listing.courseCodes.includes(filters.course)
      );
    }

    if (filters.min !== undefined) {
      listings = listings.filter(listing => listing.price >= filters.min);
    }

    if (filters.max !== undefined) {
      listings = listings.filter(listing => listing.price <= filters.max);
    }

    if (filters.text) {
      const searchText = filters.text.toUpperCase();
      listings = listings.filter(listing => 
        listing.searchKeys.some(key => key.includes(searchText))
      );
    }

    return listings;
  } catch (error) {
    console.error('❌ Error querying listings:', error);
    throw error;
  }
};

/**
 * Get a single listing by ID
 * @param {string} id - Listing ID
 * @returns {Promise<Listing>} Listing object
 */
export const getListing = async (id) => {
  try {
    const listingRef = doc(db, 'listings', id);
    const listingSnap = await getDoc(listingRef);
    
    if (!listingSnap.exists()) {
      throw new Error('Listing not found');
    }
    
    return { id: listingSnap.id, ...listingSnap.data() };
  } catch (error) {
    console.error('❌ Error getting listing:', error);
    throw error;
  }
};

/**
 * Create a new listing
 * @param {Object} input - Listing data
 * @param {string} input.ownerUid - Owner's UID
 * @param {string} input.title - Book title
 * @param {string} [input.author] - Book author
 * @param {string} [input.isbn] - ISBN
 * @param {string} [input.edition] - Edition
 * @param {string[]} input.courseCodes - Course codes array
 * @param {number} input.price - Price
 * @param {string} input.imageUrl - Image URL
 * @param {string[]} input.searchKeys - UPPERCASE search tokens
 * @returns {Promise<string>} New listing ID
 */
export const createListing = async (input) => {
  try {
    const listingData = {
      ownerUid: input.ownerUid,
      title: input.title,
      author: input.author || '',
      isbn: input.isbn || '',
      edition: input.edition || '',
      courseCodes: input.courseCodes,
      price: input.price,
      imageUrl: input.imageUrl,
      status: 'active',
      searchKeys: input.searchKeys,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, 'listings'), listingData);
    console.log('✅ Listing created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating listing:', error);
    throw error;
  }
};

/**
 * Set listing status
 * @param {string} id - Listing ID
 * @param {string} status - New status (active | pending_meetup | meetup_set | sold | flagged)
 * @returns {Promise<void>}
 */
export const setListingStatus = async (id, status) => {
  try {
    const listingRef = doc(db, 'listings', id);
    await updateDoc(listingRef, { status });
    console.log(`✅ Listing ${id} status updated to ${status}`);
  } catch (error) {
    console.error('❌ Error updating listing status:', error);
    throw error;
  }
};

/**
 * Get listings by owner UID
 * @param {string} ownerUid - Owner's UID
 * @returns {Promise<Listing[]>} Array of owner's listings
 */
export const getListingsByOwner = async (ownerUid) => {
  try {
    const q = query(
      collection(db, 'listings'),
      where('ownerUid', '==', ownerUid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const listings = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() });
    });

    return listings;
  } catch (error) {
    console.error('❌ Error getting listings by owner:', error);
    throw error;
  }
};
