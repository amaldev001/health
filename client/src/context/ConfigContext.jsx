import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    clinicName: 'AuraCare Health',
    phone: '',
    address: '',
    hours: '',
    emergencyPhone: '',
    currency: 'USD',
    timezone: 'Asia/Kolkata',
    slotMinutes: 30,
    cancellationCutoffHours: 24,
    bookingWindowDays: 60
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadConfig = async () => {
      try {
        const res = await API.get('/config');
        if (res.data.success && isMounted) {
          setConfig(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load clinic configuration:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  const formatCurrency = useCallback((amount) => {
    const num = Number(amount) || 0;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: config.currency || 'USD'
      }).format(num);
    } catch {
      return `${config.currency} ${num.toFixed(2)}`;
    }
  }, [config.currency]);

  const formatDate = useCallback((dateInput, options = {}) => {
    if (!dateInput) return '';
    let d;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      d = new Date(`${dateInput}T00:00:00`);
    } else {
      d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return String(dateInput);

    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: config.timezone || 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
      }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  }, [config.timezone]);

  return (
    <ConfigContext.Provider value={{ config, loading, formatCurrency, formatDate }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
