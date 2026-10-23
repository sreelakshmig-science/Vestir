import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { apiRequest } from '../auth';

const DressesContext = createContext(null);

export function DressesProvider({ children }) {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDresses = async () => {
      try {
        const data = await apiRequest('dresses');
        if (!Array.isArray(data) || data.some((dress) => !dress || !dress._id)) {
          throw new Error('The backend returned an invalid dress catalogue.');
        }

        if (isMounted) {
          setDresses(data.map((dress) => ({ ...dress, id: dress._id })));
          setError('');
        }
      } catch (loadError) {
        if (isMounted) {
          setDresses([]);
          setError(loadError.message || 'The backend returned an invalid dress catalogue.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDresses();
    return () => {
      isMounted = false;
    };
  }, []);

  const addDress = (dress) => {
    if (!dress?._id) throw new Error('The saved dress is missing its MongoDB ID.');
    const newDress = { ...dress, id: dress._id };
    setDresses((prev) => [newDress, ...prev.filter((item) => item._id !== dress._id)]);
    return newDress;
  };

  const value = useMemo(() => ({ dresses, addDress, loading, error }), [dresses, loading, error]);

  return <DressesContext.Provider value={value}>{children}</DressesContext.Provider>;
}

export function useDresses() {
  const ctx = useContext(DressesContext);
  if (!ctx) throw new Error('useDresses must be used inside a DressesProvider');
  return ctx;
}
