// Persistent favorites, shared across all screens via React context.
//
// AsyncStorage is the phone's simple key-value store (localStorage on
// web). We keep the whole favorites list under one key and rewrite it
// on every change — fine at this scale.

import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'brickd:favorites';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved favorites once on app start.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setFavorites(JSON.parse(json));
      })
      .catch(() => {}) // corrupt/missing data -> start empty
      .finally(() => setLoaded(true));
  }, []);

  // Persist on every change (after the initial load).
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)).catch(
        () => {}
      );
    }
  }, [favorites, loaded]);

  const isFavorite = (fdcId) => favorites.some((f) => f.fdcId === fdcId);

  // food = { fdcId, name, score, nutrients, evidence }
  const toggleFavorite = (food) => {
    setFavorites((prev) =>
      prev.some((f) => f.fdcId === food.fdcId)
        ? prev.filter((f) => f.fdcId !== food.fdcId)
        : [food, ...prev]
    );
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used inside <FavoritesProvider>');
  }
  return ctx;
}
