import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { apiRequest, getToken } from '../auth';

const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(false);

  const refreshFavourites = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const records = await apiRequest('favourites', { auth: true });
      if (!Array.isArray(records)) throw new Error('The backend returned an invalid favourites list.');
      const items = records.map((record) => {
        if (!record?._id || !record.dress?._id) {
          throw new Error('The backend returned an invalid favourite record.');
        }
        return {
          ...record.dress,
          id: record.dress._id,
          favouriteId: record._id,
        };
      });
      if (mountedRef.current) setFavourites(items);
    } catch (loadError) {
      if (mountedRef.current) setError(loadError.message || 'Could not load favourites.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const loadSavedFavourites = async () => {
      try {
        if (await getToken()) await refreshFavourites();
      } catch (loadError) {
        if (mountedRef.current) setError(loadError.message || 'Could not load favourites.');
      }
    };
    loadSavedFavourites();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshFavourites]);

  const addFavourite = async (dress) => {
    const dressId = dress?._id;
    if (!dressId) throw new Error('Only dresses saved to the catalogue can be favourited.');
    if (favourites.some((favourite) => favourite.id === dressId)) return true;

    setError('');
    try {
      const result = await apiRequest('favourites', {
        method: 'POST',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dress: dressId }),
      });
      if (!result?.favourite?._id) throw new Error('The backend returned an invalid favourite record.');
      const item = {
        ...dress,
        id: dressId,
        favouriteId: result.favourite._id,
      };
      setFavourites((previous) => [item, ...previous.filter((favourite) => favourite.id !== dressId)]);
      return true;
    } catch (saveError) {
      setError(saveError.message || 'Could not save this favourite.');
      throw saveError;
    }
  };

  const removeFavourite = async (favouriteId) => {
    setError('');
    try {
      await apiRequest(`favourites/${encodeURIComponent(favouriteId)}`, {
        method: 'DELETE',
        auth: true,
      });
      setFavourites((previous) => previous.filter((favourite) => favourite.favouriteId !== favouriteId));
      return true;
    } catch (removeError) {
      setError(removeError.message || 'Could not remove this favourite.');
      return false;
    }
  };

  const isFavourite = (dressId) => favourites.some((f) => f.id === dressId);

  const value = useMemo(
    () => ({ favourites, loading, error, refreshFavourites, addFavourite, removeFavourite, isFavourite }),
    [favourites, loading, error, refreshFavourites],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used inside a FavouritesProvider');
  return ctx;
}
