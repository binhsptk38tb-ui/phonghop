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
        const email = firebaseUser.email?.toLowerCase();
        if (!email) {
          await signOut(auth);
          callback(null);
          return;
        }

        // 1. Try to find by UID first
        let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        // 2. If not found by UID, try to find by Email
        if (!userDoc.exists()) {
          userDoc = await getDoc(doc(db, 'users', email));
        }

        if (userDoc.exists()) {
          const data = userDoc.data();
          const profile = {
            ...data,
            uid: firebaseUser.uid,
            email: email,
          } as UserProfile;
          
          callback(profile);
        } else if (email === ADMIN_EMAIL) {
          // Absolute last resort: bootstrap admin
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: email,
            name: firebaseUser.displayName || 'Admin',
            position: 'admin',
            role: 'chairperson',
            createdAt: serverTimestamp()
          };
          // Use try-catch because rules might still block if not careful
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
            callback(profile);
          } catch (e) {
            console.error("Admin bootstrap failed", e);
            await signOut(auth);
            callback(null);
          }
        } else {
          // NOT AUTHORIZED
          await signOut(auth);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  login: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    const email = firebaseUser.email?.toLowerCase();

    if (!email) {
      await signOut(auth);
      throw new Error('Email not found');
    }

    // Check if authorized
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) return result;

    const preDoc = await getDoc(doc(db, 'users', email));
    if (preDoc.exists()) return result;

    if (email !== ADMIN_EMAIL) {
      await signOut(auth);
      const error = new Error('Unauthorized');
      (error as any).code = 'auth/unauthorized-user';
      throw error;
    }

    return result;
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
    const userRef = doc(db, 'users', email.toLowerCase());
    return setDoc(userRef, {
      uid: email.toLowerCase(),
      email: email.toLowerCase(),
      name,
      position,
      role,
      phoneNumber: phoneNumber || '',
      createdAt: serverTimestamp()
    });
  }
};
