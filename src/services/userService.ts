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
  serverTimestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, UserPosition } from '../types';

const ADMIN_EMAIL = 'binhsptk38tb@gmail.com';

export const userService = {
  subscribeAuth: (callback: (user: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        let profile: UserProfile;
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          profile = {
            ...data,
            uid: firebaseUser.uid,
            // Fallback for migration
            position: data.position || (data.role === 'admin' ? 'admin' : data.role === 'management' ? 'principal' : 'staff'),
            role: data.role === 'chairperson' ? 'chairperson' : data.role === 'secretary' ? 'secretary' : 'member'
          } as UserProfile;
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
              position: data.position || 'staff',
              role: data.role || 'member',
              createdAt: data.createdAt || serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
          } else if (firebaseUser.email === ADMIN_EMAIL) {
            // Bootstrap first admin
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Admin',
              position: 'admin',
              role: 'chairperson',
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
          } else {
            // Unregistered user
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Guest',
              position: 'staff',
              role: 'member',
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
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        ...data, 
        uid: doc.id,
        position: data.position || (data.role === 'admin' ? 'admin' : data.role === 'management' ? 'principal' : 'staff'),
        role: (data.role === 'chairperson' || data.role === 'secretary' || data.role === 'member') ? data.role : 'member'
      } as UserProfile;
    });
  },

  deleteUser: async (uid: string) => {
    return deleteDoc(doc(db, 'users', uid));
  },

  updateUser: async (uid: string, updates: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, updates);
  },

  registerUser: async (email: string, name: string, position: UserPosition, role: UserRole, phoneNumber?: string) => {
    const userRef = doc(collection(db, 'users'));
    return setDoc(userRef, {
      uid: userRef.id,
      email,
      name,
      position,
      role,
      phoneNumber: phoneNumber || '',
      createdAt: serverTimestamp()
    });
  }
};
