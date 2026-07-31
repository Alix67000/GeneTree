import React, { createContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { AuthContextType } from '@/types';
import { logActivity } from '@/lib/logger';

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for custom session first
    const sessionStr = localStorage.getItem('genetree_member_session');
    if (sessionStr) {
      try {
        const customSession = JSON.parse(sessionStr);
        setCurrentUser(customSession as unknown as FirebaseUser);
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse custom session', err);
        localStorage.removeItem('genetree_member_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Only set Firebase user if there's no custom session
      if (!localStorage.getItem('genetree_member_session')) {
        setCurrentUser(user);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (identifier: string, password: string) => {
    try {
      const usersRef = collection(db, 'allowed_users');
      // Firebase doesn't support case-insensitive queries natively like this, but we'll try exact match first
      const q = query(usersRef, where('emailOrUsername', '==', identifier), where('password', '==', password));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const userData = doc.data();
        
        const customUser = { 
          uid: doc.id, 
          email: userData.emailOrUsername, 
          displayName: userData.displayName || identifier, 
          isAdmin: false 
        };

        localStorage.setItem('genetree_member_session', JSON.stringify(customUser));
        setCurrentUser(customUser as unknown as FirebaseUser);
        
        logActivity('CONNEXION', `Connexion du membre ${userData.emailOrUsername}`, userData.emailOrUsername);
        
        return customUser;
      }
    } catch (dbError) {
      console.error('Error checking allowed_users', dbError);
    }

    // Fall back to Firebase Auth
    const result = await signInWithEmailAndPassword(auth, identifier, password);
    logActivity('CONNEXION', `Connexion de l'administrateur ${result.user.email}`, result.user.email || 'inconnu');
    return result;
  };

  const registerWithEmail = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    localStorage.removeItem('genetree_member_session');
    setCurrentUser(null);
    return signOut(auth);
  };

  const value = {
    currentUser,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

