// Receipt-scan history: the memory that turns one-shot scans into a
// habit loop ("your hauls: 21 -> 28 -> 34"). Stored on-device so it
// works identically for guests and signed-in users; capped so it can't
// grow unbounded.
//
// Scoped per identity (see scopedStorage.js) — history must not follow
// the device from one signed-in user to the next.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { scopedKey, migrateLegacyKey } from './scopedStorage';

const BASE_KEY = 'brickd:receipt-history';
const MAX_ENTRIES = 50;

// entry = { ts, avg, count, flagged, foodIds: [fdcId], unmatched: [str] }
export async function loadHistory(userId) {
  await migrateLegacyKey(BASE_KEY, userId);
  try {
    const json = await AsyncStorage.getItem(scopedKey(BASE_KEY, userId));
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

// Prepends the new entry (newest first) and returns the updated list.
export async function addHistoryEntry(entry, current, userId) {
  const next = [entry, ...current].slice(0, MAX_ENTRIES);
  try {
    await AsyncStorage.setItem(
      scopedKey(BASE_KEY, userId),
      JSON.stringify(next)
    );
  } catch {}
  return next;
}

// Remove one haul (identified by its timestamp); returns the new list.
export async function deleteHistoryEntry(ts, current, userId) {
  const next = current.filter((h) => h.ts !== ts);
  try {
    await AsyncStorage.setItem(
      scopedKey(BASE_KEY, userId),
      JSON.stringify(next)
    );
  } catch {}
  return next;
}

export async function clearHistory(userId) {
  try {
    await AsyncStorage.removeItem(scopedKey(BASE_KEY, userId));
  } catch {}
  return [];
}

export function formatHaulDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
