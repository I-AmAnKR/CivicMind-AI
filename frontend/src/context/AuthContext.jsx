import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseLogin, loginUser, registerUser } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token
    const token = localStorage.getItem('civicmind_token');
    const storedUser = localStorage.getItem('civicmind_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !localStorage.getItem('civicmind_token')) {
        try {
          const res = await firebaseLogin({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          });
          const { user: dbUser, token } = res.data;
          localStorage.setItem('civicmind_token', token);
          localStorage.setItem('civicmind_user', JSON.stringify(dbUser));
          setUser(dbUser);
        } catch (error) {
          console.error('Firebase auth sync error:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (role = 'citizen') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const res = await firebaseLogin({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        role,
      });
      const { user: dbUser, token } = res.data;
      localStorage.setItem('civicmind_token', token);
      localStorage.setItem('civicmind_user', JSON.stringify(dbUser));
      setUser(dbUser);
      toast.success(`Welcome, ${dbUser.name}! 🎉`);
      return dbUser;
    } catch (error) {
      toast.error('Login failed. Please try again.');
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    const res = await loginUser({ email, password });
    const { user: dbUser, token } = res.data;
    localStorage.setItem('civicmind_token', token);
    localStorage.setItem('civicmind_user', JSON.stringify(dbUser));
    setUser(dbUser);
    toast.success(`Welcome back, ${dbUser.name}! 🎉`);
    return dbUser;
  };

  const registerWithEmail = async (data) => {
    const res = await registerUser(data);
    const { user: dbUser, token } = res.data;
    localStorage.setItem('civicmind_token', token);
    localStorage.setItem('civicmind_user', JSON.stringify(dbUser));
    setUser(dbUser);
    toast.success(`Welcome to CivicMind, ${dbUser.name}! 🚀`);
    return dbUser;
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('civicmind_token');
    localStorage.removeItem('civicmind_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('civicmind_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
