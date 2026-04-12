import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, firebaseConfigError } from '../utils/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserSessionPersistence 
} from 'firebase/auth';
import { fetchProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const authUnavailableMessage = firebaseConfigError?.message || 'Firebase Auth is not initialized.';

  const refreshProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      if (data) setProfile(data);
    } catch (error) {
      console.error("Profile refresh failed", error);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      console.error(authUnavailableMessage);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr);
      if (usr) {
        const token = await usr.getIdToken();
        localStorage.setItem('token', token);
        await refreshProfile();
      } else {
        setProfile(null);
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [refreshProfile]);

  const login = async (email, password) => {
      if (!auth) throw new Error(authUnavailableMessage);
      await setPersistence(auth, browserSessionPersistence);
      return signInWithEmailAndPassword(auth, email, password);
  }

  const signup = (email, password) => {
      if (!auth) throw new Error(authUnavailableMessage);
      return createUserWithEmailAndPassword(auth, email, password);
  }

  const logout = () => {
      if (!auth) throw new Error(authUnavailableMessage);
      return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, login, signup, logout, loading, refreshProfile, authReady: Boolean(auth), authError: firebaseConfigError?.message || null }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
