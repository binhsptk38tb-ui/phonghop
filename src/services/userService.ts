import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

const ADMIN_EMAIL = 'binhsptk38tb@gmail.com';

export const userService = {
  subscribeAuth: (callback: (user: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        let profile: UserProfile;
        
        if (userDoc.exists()) {
          profile = userDoc.data() as UserProfile;
        } else {
          // Check if this email was pre-registered or if it's the admin email
          const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Found a pre-registered profile by email
            const existingDoc = querySnapshot.docs[0];
            const data = existingDoc.data();
            // Move it to the UID based document
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || data.name || 'User',
              role: data.role || 'staff',
              createdAt: data.createdAt || serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
          } else if (firebaseUser.email === ADMIN_EMAIL) {
            // Bootstrap first admin
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Admin',
              role: 'admin',
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
          } else {
            // Unregistered user - default to staff or handle as restricted
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Guest',
              role: 'staff', // Or a 'guest' role if you want stricter control
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
          }
        }
        callback(profile);
      } else {
        callback(null);
      }
    });
  },

  login: async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },

  logout: async () => {
    return signOut(auth);
  },

  getAllUsers: async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  },

  registerUser: async (email: string, name: string, role: UserRole) => {
    // We use a temporary ID or email as key for pre-registration
    // But since rule uses UID, we'll store in users with some identifier
    // For simplicity, we just add a document to 'users' with email as ID or random
    // and let the login logic link it.
    const userRef = doc(collection(db, 'users'));
    return setDoc(userRef, {
      email,
      name,
      role,
      createdAt: serverTimestamp()
    });
  }
};
