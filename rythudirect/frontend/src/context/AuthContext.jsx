import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rythu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('rythu_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('rythu_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('rythu_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session expired or invalid:", err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (mobileOrEmail, password) => {
    const res = await api.post('/auth/login', {
      mobile_or_email: mobileOrEmail,
      password: password,
    });
    const { access_token } = res.data;
    localStorage.setItem('rythu_token', access_token);
    setToken(access_token);

    // Fetch full profile
    const profileRes = await api.get('/auth/me');
    setUser(profileRes.data);
    localStorage.setItem('rythu_user', JSON.stringify(profileRes.data));
    return profileRes.data;
  };

  const register = async (registerData) => {
    const res = await api.post('/auth/register', registerData);
    // After registration, auto login
    return await login(registerData.mobile_number, registerData.password);
  };

  const logout = () => {
    localStorage.removeItem('rythu_token');
    localStorage.removeItem('rythu_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('rythu_user', JSON.stringify(res.data));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isFarmer: user?.role === 'FARMER',
        isBuyer: user?.role === 'BUYER',
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
