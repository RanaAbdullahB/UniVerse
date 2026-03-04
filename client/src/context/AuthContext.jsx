import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('uni_token');
    const stored = localStorage.getItem('uni_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('uni_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (universityEmail, password) => {
    const { data } = await api.post('/auth/login', { universityEmail, password });
    localStorage.setItem('uni_token', data.token);
    localStorage.setItem('uni_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('uni_token', data.token);
    localStorage.setItem('uni_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('uni_token');
    localStorage.removeItem('uni_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('uni_user', JSON.stringify(data.user));
      return data.user;
    } catch {
      logout();
    }
  }, [logout]);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('uni_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
