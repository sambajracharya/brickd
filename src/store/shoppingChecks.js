// In-store check-offs, shared between the Saved tab and the store
// screen so ticking an item in one place shows in the other.
//
// Transient shopping state, so it stays on-device — but scoped per
// identity like everything else (see scopedStorage.js).

import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scopedKey, migrateLegacyKey } from '../lib/scopedStorage';
import { useAuth } from './auth';

const BASE_KEY = 'brickd:saved-checked';

const ChecksContext = createContext(null);

export function ShoppingChecksProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const storageKey = scopedKey(BASE_KEY, uid);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    let cancelled = false;
    setChecked({});
    migrateLegacyKey(BASE_KEY, uid)
      .then(() => AsyncStorage.getItem(storageKey))
      .then((json) => {
        if (!cancelled && json) setChecked(JSON.parse(json));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uid, storageKey]);

  const isChecked = (fdcId) => !!checked[fdcId];

  const toggleChecked = (fdcId) => {
    setChecked((prev) => {
      const next = { ...prev, [fdcId]: !prev[fdcId] };
      if (!next[fdcId]) delete next[fdcId];
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clearChecked = () => {
    setChecked({});
    AsyncStorage.removeItem(storageKey).catch(() => {});
  };

  const checkedCount = Object.keys(checked).length;

  return (
    <ChecksContext.Provider
      value={{ isChecked, toggleChecked, clearChecked, checkedCount }}
    >
      {children}
    </ChecksContext.Provider>
  );
}

export function useShoppingChecks() {
  const ctx = useContext(ChecksContext);
  if (!ctx) {
    throw new Error(
      'useShoppingChecks must be used inside <ShoppingChecksProvider>'
    );
  }
  return ctx;
}
