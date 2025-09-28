import { db } from './firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

/**
 * Send a message in a conversation thread
 * @param {Object} input - Message data
 * @param {string} input.listingId - Listing ID
 * @param {string} input.fromUid - Sender UID
 * @param {string} input.toUid - Recipient UID
 * @param {string} input.text - Message text
 * @returns {Promise<string>} New message ID
 */
export const sendMessage = async (input) => {
  try {
    if (!input.text || !input.text.trim()) {
      throw new Error('Message is empty');
    }

    const [uidA, uidB] = [input.fromUid, input.toUid].sort();
    const threadId = `t_${input.listingId}_${uidA}_${uidB}`;

    const messageData = {
      listingId: input.listingId,
      threadId,
      participants: [uidA, uidB],
      fromUid: input.fromUid,
      toUid: input.toUid,
      text: input.text.trim(),
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('✅ Message sent with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
};

/**
 * Fetch all messages in a conversation thread
 * @param {Object} input - Thread data
 * @param {string} input.listingId - Listing ID
 * @param {string} input.uidA - First user UID
 * @param {string} input.uidB - Second user UID
 * @returns {Promise<Message[]>} Array of messages in chronological order
 */
export const fetchThread = async (input) => {
  try {
    const [uidA, uidB] = [input.uidA, input.uidB].sort();
    const threadId = `t_${input.listingId}_${uidA}_${uidB}`;

    const q = query(
      collection(db, 'messages'),
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    return messages;
  } catch (error) {
    console.error('❌ Error fetching thread:', error);
    throw error;
  }
};

/**
 * Get all conversations for a user
 * @param {string} uid - User UID
 * @returns {Promise<Object[]>} Array of conversation summaries
 */
export const getUserConversations = async (uid) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conversations = new Map();
    
    querySnapshot.forEach((doc) => {
      const message = { id: doc.id, ...doc.data() };
      const threadId = message.threadId;
      
      if (!conversations.has(threadId)) {
        conversations.set(threadId, {
          threadId,
          listingId: message.listingId,
          participants: message.participants,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    return Array.from(conversations.values());
  } catch (error) {
    console.error('❌ Error getting user conversations:', error);
    throw error;
  }
};