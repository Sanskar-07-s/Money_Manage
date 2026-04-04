import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { fetchProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setUser({ uid: "demo-user", email: "demo@user.com" });
        setProfile({ name: 'Demo User', email: 'demo@user.com', phone: '', avatar: '' });
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

  const login = (email, password) => {
      if(!auth) {
          setUser({ uid: "demo-user", email });
          return Promise.resolve();
      }
      return signInWithEmailAndPassword(auth, email, password);
  }

  const signup = (email, password) => {
      if(!auth) {
          setUser({ uid: "demo-user", email });
          return Promise.resolve();
      }
      return createUserWithEmailAndPassword(auth, email, password);
  }

  const logout = () => {
      if(!auth) {
          setUser(null);
          setProfile(null);
          return Promise.resolve();
      }
      return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, login, signup, logout, loading, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
