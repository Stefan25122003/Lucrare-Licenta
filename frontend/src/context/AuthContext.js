// AuthContext.js - FIXED cu URL-uri corecte
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitializingRef = useRef(false);

  // ✅ FIX: Funcție pentru a obține user-ul curent
  const getCurrentUser = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('👤 User data from server:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  };

  // ✅ FIXED: Adaugă funcția register
  const register = async (username, email, password) => {
    try {
      console.log('🔄 Attempting registration...');
      const response = await axios.post('http://localhost:5000/auth/register', {
        username,
        email,
        password
      });
      
      console.log('✅ Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const login = async (token) => {
    try {
      console.log('🔐 AuthContext: Starting login with token');
      localStorage.setItem('token', token);
      const userData = await getCurrentUser(token);
      console.log('✅ AuthContext: User data received:', userData);
      console.log('🔑 Is admin?', userData.is_admin); // Debug log pentru admin status
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      localStorage.removeItem('token');
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 AuthContext: Logging out');
    localStorage.removeItem('token');
    setUser(null);
  };

  // Verifică token-ul la încărcarea aplicației
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitializingRef.current) {
        console.log('🚫 AuthContext: Already initializing, skipping...');
        return;
      }
      
      isInitializingRef.current = true;
      console.log('🔄 AuthContext: Initializing...');
      
      const token = localStorage.getItem('token');
      if (token) {
        try {
          console.log('🔑 AuthContext: Found token, verifying...');
          const userData = await getCurrentUser(token);
          console.log('✅ AuthContext: Token valid, user loaded:', userData.email);
          console.log('🔑 Admin status:', userData.is_admin); // Debug log
          setUser(userData);
        } catch (error) {
          console.error('❌ AuthContext: Token invalid, removing...', error);
          localStorage.removeItem('token');
        }
      } else {
        console.log('ℹ️ AuthContext: No token found');
      }
      
      setLoading(false);
      isInitializingRef.current = false;
    };

    initializeAuth();
  }, []); // Empty dependency array

  // ✅ FIXED: Asigură-te că register este inclus în value
  const value = {
    user,
    loading,
    login,
    register, // ← Adaugă aceasta
    logout,
    isAdmin: user?.is_admin || false // ✅ FIX: Exportă și isAdmin pentru ușurință
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};