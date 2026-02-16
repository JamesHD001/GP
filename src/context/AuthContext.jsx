import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import * as authService from '../services/authService';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // firebase user
  const [userProfile, setUserProfile] = useState(null); // firestore profile (role, name...)
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid) => {
    if (!uid) return null;
    const profile = await authService.getUserProfile(uid);
    setUserProfile(profile);
    setRole(profile?.role || null);
    return profile;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setUserProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  async function login(email, password) {
    const cred = await authService.login(email, password);
    await fetchProfile(cred.user.uid);
    return cred;
  }

  async function logout() {
    await authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
    setRole(null);
  }

  async function register({ email, password, fullName, role = 'leader', assignedClasses = [] }) {
    // Register creates both the Firebase Auth user and a Firestore profile document
    const cred = await authService.register({ email, password, fullName, role, assignedClasses });
    await fetchProfile(cred.user.uid);
    return cred;
  }

  async function refreshProfile() {
    if (!currentUser) return null;
    return fetchProfile(currentUser.uid);
  }

  const value = {
    currentUser,
    userProfile,
    role,
    loading,
    login,
    logout,
    register,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
