// ===== Firebase Configuration =====
// TODO: Replace this config with your actual Firebase project config
// Get it from Firebase Console > Project Settings > Your App > Config

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Check if a user is an admin by reading the config/admins doc
async function checkAdmin(uid) {
  try {
    const doc = await db.collection('config').doc('admins').get();
    return doc.exists && (doc.data().uids || []).includes(uid);
  } catch (e) {
    // Permission denied = not admin
    return false;
  }
}
