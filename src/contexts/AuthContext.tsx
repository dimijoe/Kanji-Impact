import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types';

// ----- Fonction utilitaire pour éviter undefined -----
function removeUndefined(obj: any) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserProfile = async (user: User): Promise<UserProfile> => {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Anonymous Player',
      photoURL: user.photoURL ?? null, // null plutôt que undefined
      createdAt: new Date(),
      lastLoginAt: new Date(),
      totalGamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      badges: [],
      achievements: [],
      levelProgress: {
        'N5': { level: 'N5', totalKanjisLearned: 0, masteredKanjis: new Set(), averageAccuracy: 0, bestTime: 0, gamesPlayed: 0 },
        'N4': { level: 'N4', totalKanjisLearned: 0, masteredKanjis: new Set(), averageAccuracy: 0, bestTime: 0, gamesPlayed: 0 },
        'N3': { level: 'N3', totalKanjisLearned: 0, masteredKanjis: new Set(), averageAccuracy: 0, bestTime: 0, gamesPlayed: 0 },
        'N2': { level: 'N2', totalKanjisLearned: 0, masteredKanjis: new Set(), averageAccuracy: 0, bestTime: 0, gamesPlayed: 0 },
        'N1': { level: 'N1', totalKanjisLearned: 0, masteredKanjis: new Set(), averageAccuracy: 0, bestTime: 0, gamesPlayed: 0 },
        'Jōyō1': { level: 'Jōyō1', totalKanjisLearned: 0, masteredKanjis: new Set(), averageAccuracy: 0, bestTime: 0, gamesPlayed: 0 },
        'Jōyō2': { level: 'Jōyō2', totalKanjisLearned: 0, masteredKanjis: new Set(), averageAccuracy: 0, bestTime: 0, gamesPlayed: 0 }
      }
    };
    await setDoc(doc(db, 'users', user.uid), removeUndefined({
      ...userProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      levelProgress: Object.fromEntries(
        Object.entries(userProfile.levelProgress).map(([key, value]) => [
          key, 
          { ...value, masteredKanjis: Array.from(value.masteredKanjis) }
        ])
      )
    }));
    return userProfile;
  };

  const loadUserProfile = async (user: User): Promise<UserProfile> => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const profile: UserProfile = {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        levelProgress: Object.fromEntries(
          Object.entries(data.levelProgress || {}).map(([key, value]: [string, any]) => [
            key,
            { ...value, masteredKanjis: new Set(value.masteredKanjis || []) }
          ])
        )
      } as UserProfile;
      // Update last login
      await updateDoc(doc(db, 'users', user.uid), { lastLoginAt: serverTimestamp() });
      return profile;
    } else {
      return await createUserProfile(user);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await createUserProfile(user);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);

    // Convert Sets to Arrays for Firestore
    const firestoreData = {
      ...updates,
      levelProgress: updates.levelProgress ? Object.fromEntries(
        Object.entries(updates.levelProgress).map(([key, value]) => [
          key,
          { ...value, masteredKanjis: Array.from(value.masteredKanjis) }
        ])
      ) : undefined
    };

    await updateDoc(doc(db, 'users', currentUser.uid), removeUndefined(firestoreData));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await loadUserProfile(user);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUserProfile
  };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
