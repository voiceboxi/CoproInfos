import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User, Residence, Member } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  currentResidence: Residence | null;
  currentMember: Member | null;
  loading: boolean;
  refreshAuthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  currentResidence: null,
  currentMember: null,
  loading: true,
  refreshAuthData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentResidence, setCurrentResidence] = useState<Residence | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  const fetchAuthData = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
         setUserProfile(null);
         return;
      }
      
      const profile = { id: userSnap.id, ...userSnap.data() } as User;
      setUserProfile(profile);

      if (profile.residenceId) {
        const resRef = doc(db, 'residences', profile.residenceId);
        const resSnap = await getDoc(resRef);
        if (resSnap.exists()) {
          setCurrentResidence({ id: resSnap.id, ...resSnap.data() } as Residence);
        }

        const memRef = doc(db, `residences/${profile.residenceId}/members`, uid);
        const memSnap = await getDoc(memRef);
        if (memSnap.exists()) {
          setCurrentMember({ id: memSnap.id, ...memSnap.data() } as Member);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'users/residences', auth);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await fetchAuthData(u.uid);
      } else {
        setUserProfile(null);
        setCurrentResidence(null);
        setCurrentMember(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      currentResidence, 
      currentMember, 
      loading, 
      refreshAuthData: () => user ? fetchAuthData(user.uid) : Promise.resolve() 
    }}>
      {children}
    </AuthContext.Provider>
  );
}