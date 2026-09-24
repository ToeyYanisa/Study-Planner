import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { notify, dbManager } from '../services/db';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName = '') => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && res.user) {
      await updateProfile(res.user, { displayName });
    }
    notify.success('สมัครสมาชิกและเข้าสู่ระบบสำเร็จ');
    return res.user;
  };

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    notify.success(`ยินดีต้อนรับ ${res.user.displayName || res.user.email}`);
    return res.user;
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    notify.success(`ยินดีต้อนรับ ${res.user.displayName || 'ผู้ใช้งาน'}`);
    return res.user;
  };

  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!auth.currentUser) return;
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;
    await updateProfile(auth.currentUser, updates);
    setCurrentUser({ ...auth.currentUser });
  };

  const logout = async () => {
    await signOut(auth);
    dbManager.clearLocalUserData();
    notify.info('ออกจากระบบและล้างข้อมูลในเครื่องเรียบร้อยแล้ว');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      signup,
      login,
      loginWithGoogle,
      logout,
      updateUserProfile
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


