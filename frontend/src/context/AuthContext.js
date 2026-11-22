import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth.api';
import { clearToken, getToken, saveToken } from '../utils/tokenStorage';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cek token dan validasi ke backend saat app dibuka
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setToken(storedToken);
          // Validasi token ke backend via GET /api/auth/me
          try {
            const me = await authApi.getMe();
            if (mounted && me) {
              setUser(me);
            }
          } catch (apiErr) {
            console.warn('[AuthContext] Gagal validasi token via getMe:', apiErr.message);
            // Jika token kadaluarsa / unauthorized (401 atau 403), hapus sesi
            if (apiErr.status === 401 || apiErr.status === 403) {
              await clearToken();
              if (mounted) {
                setToken(null);
                setUser(null);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Init error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data?.token) {
      await saveToken(data.token);
      setToken(data.token);
      setUser({
        id: data.id,
        nama: data.nama,
        username: data.username,
        email: data.email,
      });
    }
    return data;
  };

  const register = async (nama, username, email, password) => {
    const data = await authApi.register(nama, username, email, password);
    if (data?.token) {
      await saveToken(data.token);
      setToken(data.token);
      setUser({
        id: data.id,
        nama: data.nama,
        username: data.username,
        email: data.email,
      });
    }
    return data;
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}

export default AuthContext;
