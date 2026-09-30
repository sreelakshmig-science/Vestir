import React, { createContext, useContext, useState, useMemo } from 'react';

// A simple React Context standing in for global app state. Once the MERN
// backend exists, `addFavourite`/`removeFavourite` would also call the API
// (e.g. POST /api/favourites) - for now they just update local state so the
// UI is fully demoable on its own.
const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  // Each entry stores the dress plus when it was saved, so Favourites can
  // show them in chronological order (most recently saved first).
  const [favourites, setFavourites] = useState([]);

  const addFavourite = (dress) => {
    setFavourites((prev) => {
      if (prev.some((f) => f.id === dress.id)) return prev; // already saved
      return [{ ...dress, savedAt: Date.now() }, ...prev];
    });
  };

  const removeFavourite = (dressId) => {
    setFavourites((prev) => prev.filter((f) => f.id !== dressId));
  };

  const isFavourite = (dressId) => favourites.some((f) => f.id === dressId);

  const value = useMemo(
    () => ({ favourites, addFavourite, removeFavourite, isFavourite }),
    [favourites],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used inside a FavouritesProvider');
  return ctx;
}
