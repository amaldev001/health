import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Requirement A: Polling every 60s and ONLY while document is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && user) {
        fetchNotifications();
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
