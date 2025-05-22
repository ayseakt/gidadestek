// src/context/AuthContext.js dosyasını oluştur
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/AuthService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        // Kullanıcı bilgilerini al
        try {
          const userData = authService.getUserInfo();
          setUser(userData);
        } catch (error) {
          console.error("Kullanıcı bilgileri alınamadı", error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, setUser, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);