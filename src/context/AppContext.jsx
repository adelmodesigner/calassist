import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    // Poll every 30s to pick up WhatsApp-sourced drafts
    const interval = setInterval(fetchEvents, 30_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  async function approveEvent(id) {
    await api.approveEvent(id);
    await fetchEvents();
  }

  async function rejectEvent(id) {
    await api.rejectEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  async function updateEvent(id, fields) {
    await api.updateEvent(id, fields);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e));
  }

  const pending = events.filter(e => e.status === 'pending');
  const approved = events
    .filter(e => e.status === 'approved')
    .sort((a, b) => {
      const da = new Date(`${a.date}T${a.time || '00:00'}`);
      const db_ = new Date(`${b.date}T${b.time || '00:00'}`);
      return da - db_;
    });

  const sourceBreakdown = ['text', 'image', 'audio', 'whatsapp'].map(src => ({
    source: src,
    count: events.filter(e => e.source === src).length,
  }));

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const totalThisWeek = events.filter(e => new Date(e.created_at || e.createdAt) >= weekStart).length;

  return (
    <AppContext.Provider value={{
      events, pending, approved, loading, error,
      fetchEvents, approveEvent, rejectEvent, updateEvent,
      totalThisWeek, sourceBreakdown,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
