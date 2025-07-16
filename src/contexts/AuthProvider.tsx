'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user && publicRoutes.includes(pathname)) {
        router.push('/');
      } else if (!user && !publicRoutes.includes(pathname)) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (e: any) {
      handleAuthError(e);
    }
  };

  const signup = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // You can create a user document in Firestore here if needed
      // For example: await setDoc(doc(db, "users", user.uid), { email: user.email });
      router.push('/');
    } catch (e: any) {
      handleAuthError(e);
    }
  };

  const logout = async () => {
    setError(null);
    try {
        await signOut(auth);
        router.push('/login');
    } catch (e: any) {
        handleAuthError(e);
    }
  };

  const handleAuthError = (e: any) => {
    switch (e.code) {
      case 'auth/user-not-found':
        setError('No se encontró un usuario con ese email.');
        break;
      case 'auth/wrong-password':
        setError('Contraseña incorrecta.');
        break;
      case 'auth/email-already-in-use':
        setError('Este email ya está en uso.');
        break;
      case 'auth/invalid-email':
         setError('El email no es válido.');
         break;
      default:
        setError('Ocurrió un error. Por favor, inténtalo de nuevo.');
        console.error('Firebase Auth Error:', e);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
