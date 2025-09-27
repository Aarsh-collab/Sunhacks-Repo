import 'dotenv/config';
import { auth, db } from './lib/firebase.js';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const testAuth = async () => {
  console.log('🧪 Testing ASU Authentication System...\n');
  
  // Debug: Check if environment variables are loaded
  console.log('🔍 Debug - Environment variables:');
  console.log('FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing');
  console.log('');
  
  try {
    // Test 1: Sign in with Google
    console.log('1️⃣ Testing Google Sign In...');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Google sign in successful');
    console.log('   Email:', result.user.email);
    console.log('   Name:', result.user.displayName);
    
    // Test 2: ASU email verification
    console.log('\n2️⃣ Testing ASU email verification...');
    const isASUEmail = result.user.email.endsWith('@asu.edu');
    if (isASUEmail) {
      console.log('✅ ASU email verified');
    } else {
      console.log('❌ Non-ASU email detected - would be rejected');
      await signOut(auth);
      return;
    }
    
    // Test 3: User document creation
    console.log('\n3️⃣ Testing user document creation...');
    const userRef = doc(db, 'users', result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: result.user.uid,
        name: result.user.displayName,
        asuEmail: result.user.email,
        reputation: { completedTrades: 0, rating: 5.0 },
        createdAt: new Date()
      });
      console.log('✅ User document created');
    } else {
      console.log('✅ User document already exists');
    }
    
    // Test 4: Sign out
    console.log('\n4️⃣ Testing sign out...');
    await signOut(auth);
    console.log('✅ Sign out successful');
    
    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Next steps:');
    console.log('   - Add listing creation logic');
    console.log('   - Add search functionality');
    console.log('   - Add messaging system');
    console.log('   - Add frontend when ready');
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
};

// Run the test
testAuth();
