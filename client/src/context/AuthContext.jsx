import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API, { registerUnauthorizedHandler } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    if (!['/login', '/register', '/privacy', '/terms'].includes(window.location.pathname)) {
      const returnPath = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnTo=${returnPath}`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    registerUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  const verifyUser = useCallback(async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        const u = res.data.data.user;
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          mustChangePassword: u.mustChangePassword,
          patientId: res.data.data.patientProfile?._id,
          doctorId: res.data.data.doctorProfile?._id
        });
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data.success) {
      const u = res.data.data.user;
      setUser(u);
      return u;
    }
  };

  const register = async (formData) => {
    const res = await API.post('/auth/register', formData);
    if (res.data.success) {
      const u = res.data.data.user;
      setUser(u);
      return u;
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, refreshAuth: verifyUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
