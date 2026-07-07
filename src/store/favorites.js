// Favorites, synced to the user's Supabase account.
//
// Strategy: cloud is the source of truth, AsyncStorage is a per-user
// cache for instant startup + offline tolerance.
//   1. On sign-in: show the cached list immediately, then fetch the
//      cloud list and reconcile.
//   2. Anything that exists only locally (saved while offline, or from
//      the pre-account era) is uploaded during reconciliation.
//   3. Toggles update the UI instantly (optimistic) and fire the
//      insert/delete at Supabase in the background.
//
// Row-level security on the `favorites` table means users can only
// ever read/write their own rows — enforced server-side, not here.

import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { useAuth } from './auth';

const LEGACY_KEY = 'brickd:favorites'; // pre-account device-only list
const cacheKey = (uid) => `brickd:favorites:${uid}`;

// food object <-> database row
function rowToFood(r) {
  return {
    fdcId: Number(r.fdc_id),
    name: r.name,
    score: r.score,
    nutrients: r.nutrients ?? [],
    evidence: r.evidence ?? '',
    flags: r.flags ?? [],
  };
}

function foodToRow(uid, f) {
  return {
    user_id: uid,
    fdc_id: f.fdcId,
    name: f.name,
    score: f.score,
    nutrients: f.nutrients ?? [],
    evidence: f.evidence ?? null,
    flags: f.flags ?? [],
  };
}

function dedupe(foods) {
  const seen = new Set();
  return foods.filter((f) => {
    if (!f || seen.has(f.fdcId)) return false;
    seen.add(f.fdcId);
    return true;
  });
}

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // No account/backend: plain device-only behavior (old style).
      if (!uid || !supabase) {
        try {
          const json = await AsyncStorage.getItem(LEGACY_KEY);
          if (!cancelled) setFavorites(json ? JSON.parse(json) : []);
        } catch {
          if (!cancelled) setFavorites([]);
        }
        return;
      }

      // 1) Instant: per-user cache.
      let cached = [];
      try {
        const json = await AsyncStorage.getItem(cacheKey(uid));
        if (json) cached = JSON.parse(json);
      } catch {}
      if (!cancelled && cached.length) setFavorites(cached);

      // 2) Cloud truth + reconciliation.
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const cloud = (data ?? []).map(rowToFood);

        // 3) Upload anything that exists only locally: the legacy
        // pre-account list plus cache entries that never reached the
        // cloud (saved offline).
        let legacy = [];
        try {
          const json = await AsyncStorage.getItem(LEGACY_KEY);
          if (json) legacy = JSON.parse(json);
        } catch {}
        const cloudIds = new Set(cloud.map((f) => f.fdcId));
        const uploads = dedupe(
          [...legacy, ...cached].filter((f) => f && !cloudIds.has(f.fdcId))
        );
        let merged = cloud;
        if (uploads.length) {
          const { error: upError } = await supabase
            .from('favorites')
            .upsert(uploads.map((f) => foodToRow(uid, f)), {
              onConflict: 'user_id,fdc_id',
            });
          if (!upError) merged = [...uploads, ...cloud];
        }
        if (legacy.length) AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});

        if (!cancelled) {
          setFavorites(merged);
          AsyncStorage.setItem(cacheKey(uid), JSON.stringify(merged)).catch(
            () => {}
          );
        }
      } catch {
        // Offline or table missing: the cached list stays on screen.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const isFavorite = (fdcId) => favorites.some((f) => f.fdcId === fdcId);

  // Optimistic: UI + cache update instantly, Supabase in the background.
  const toggleFavorite = (food) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.fdcId === food.fdcId);
      const next = exists
        ? prev.filter((f) => f.fdcId !== food.fdcId)
        : [food, ...prev];

      const storageKey = uid ? cacheKey(uid) : LEGACY_KEY;
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});

      if (uid && supabase) {
        const op = exists
          ? supabase
              .from('favorites')
              .delete()
              .eq('user_id', uid)
              .eq('fdc_id', food.fdcId)
          : supabase
              .from('favorites')
              .upsert([foodToRow(uid, food)], { onConflict: 'user_id,fdc_id' });
        op.then(({ error }) => {
          // Failure is tolerated: reconciliation on next load re-syncs
          // local-only saves; deletes that failed will reappear (honest).
          if (error) console.warn('favorites sync:', error.message);
        });
      }

      return next;
    });
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
