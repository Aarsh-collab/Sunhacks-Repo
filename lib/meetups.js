import { db } from './firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  updateDoc 
} from 'firebase/firestore';
import { setListingStatus } from './listings.js';
import { getUser } from './users.js';

/**
 * Propose a meetup for a listing
 * @param {Object} input - Meetup data
 * @param {string} input.listingId - Listing ID
 * @param {string} input.buyerUid - Buyer's UID
 * @param {string} input.sellerUid - Seller's UID
 * @param {string} input.spot - Meetup spot (enum: Hayden Library Lobby | MU Starbucks | Student Services Lawn | Polytechnic Student Union Desk)
 * @param {string} input.timeISO - ISO timestamp string
 * @returns {Promise<string>} New meetup ID
 */
export const proposeMeetup = async (input) => {
  try {
    const meetupData = {
      listingId: input.listingId,
      buyerUid: input.buyerUid,
      sellerUid: input.sellerUid,
      spot: input.spot,
      timeISO: input.timeISO,
      status: 'proposed',
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, 'meetups'), meetupData);
    console.log('✅ Meetup proposed with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error proposing meetup:', error);
    throw error;
  }
};

/**
 * Accept a proposed meetup
 * @param {string} id - Meetup ID
 * @returns {Promise<void>}
 */
export const acceptMeetup = async (id) => {
  try {
    const meetupRef = doc(db, 'meetups', id);
    await updateDoc(meetupRef, { status: 'accepted' });
    
    // Get meetup data to update listing status
    const meetupSnap = await getDoc(meetupRef);
    if (meetupSnap.exists()) {
      const meetupData = meetupSnap.data();
      await setListingStatus(meetupData.listingId, 'meetup_set');
    }
    
    console.log(`✅ Meetup ${id} accepted`);
  } catch (error) {
    console.error('❌ Error accepting meetup:', error);
    throw error;
  }
};

/**
 * Complete a meetup (mark as sold and update seller reputation)
 * @param {string} id - Meetup ID
 * @returns {Promise<void>}
 */
export const completeMeetup = async (id) => {
  try {
    const meetupRef = doc(db, 'meetups', id);
    const meetupSnap = await getDoc(meetupRef);
    
    if (!meetupSnap.exists()) {
      throw new Error('Meetup not found');
    }
    
    const meetupData = meetupSnap.data();
    
    // Update meetup status
    await updateDoc(meetupRef, { status: 'completed' });
    
    // Update listing status to sold
    await setListingStatus(meetupData.listingId, 'sold');
    
    // Update seller reputation
    const seller = await getUser(meetupData.sellerUid);
    if (seller) {
      const newCompletedTrades = (seller.reputation.completedTrades || 0) + 1;
      const sellerRef = doc(db, 'users', meetupData.sellerUid);
      await updateDoc(sellerRef, {
        'reputation.completedTrades': newCompletedTrades
      });
      console.log(`✅ Seller reputation updated: ${newCompletedTrades} completed trades`);
    }
    
    console.log(`✅ Meetup ${id} completed`);
  } catch (error) {
    console.error('❌ Error completing meetup:', error);
    throw error;
  }
};

/**
 * Cancel a meetup
 * @param {string} id - Meetup ID
 * @returns {Promise<void>}
 */
export const cancelMeetup = async (id) => {
  try {
    const meetupRef = doc(db, 'meetups', id);
    await updateDoc(meetupRef, { status: 'cancelled' });
    console.log(`✅ Meetup ${id} cancelled`);
  } catch (error) {
    console.error('❌ Error cancelling meetup:', error);
    throw error;
  }
};

/**
 * Get meetups for a user (as buyer or seller)
 * @param {string} uid - User UID
 * @returns {Promise<Object>} Object with buyer and seller meetups
 */
export const getMeetupsForUser = async (uid) => {
  try {
    // Get meetups where user is buyer
    const buyerQuery = query(
      collection(db, 'meetups'),
      where('buyerUid', '==', uid)
    );
    
    // Get meetups where user is seller
    const sellerQuery = query(
      collection(db, 'meetups'),
      where('sellerUid', '==', uid)
    );
    
    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      getDocs(buyerQuery),
      getDocs(sellerQuery)
    ]);
    
    const buyerMeetups = [];
    const sellerMeetups = [];
    
    buyerSnapshot.forEach((doc) => {
      buyerMeetups.push({ id: doc.id, ...doc.data() });
    });
    
    sellerSnapshot.forEach((doc) => {
      sellerMeetups.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      buyer: buyerMeetups,
      seller: sellerMeetups
    };
  } catch (error) {
    console.error('❌ Error getting meetups for user:', error);
    throw error;
  }
};

/**
 * Get a single meetup by ID
 * @param {string} id - Meetup ID
 * @returns {Promise<Object>} Meetup object
 */
export const getMeetup = async (id) => {
  try {
    const meetupRef = doc(db, 'meetups', id);
    const meetupSnap = await getDoc(meetupRef);
    
    if (!meetupSnap.exists()) {
      throw new Error('Meetup not found');
    }
    
    return { id: meetupSnap.id, ...meetupSnap.data() };
  } catch (error) {
    console.error('❌ Error getting meetup:', error);
    throw error;
  }
};
