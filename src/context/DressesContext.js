import React, { createContext, useContext, useState, useMemo } from 'react';
import { mockDresses } from '../data/mockDresses';

// Holds the list of dresses shown on Home. Seeded with the placeholder
// catalogue so the app looks populated immediately; addDress() puts new
// uploads at the front. Later, this would instead fetch from
// GET /api/dresses and addDress would POST to it (see README).
const DressesContext = createContext(null);

let nextLocalId = 1000; // simple unique id for locally-added dresses

export function DressesProvider({ children }) {
  const [dresses, setDresses] = useState(mockDresses);

  const addDress = (dress) => {
    const newDress = { ...dress, id: `local-${nextLocalId++}` };
    setDresses((prev) => [newDress, ...prev]);
    return newDress;
  };

  const value = useMemo(() => ({ dresses, addDress }), [dresses]);

  return <DressesContext.Provider value={value}>{children}</DressesContext.Provider>;
}

export function useDresses() {
  const ctx = useContext(DressesContext);
  if (!ctx) throw new Error('useDresses must be used inside a DressesProvider');
  return ctx;
}
