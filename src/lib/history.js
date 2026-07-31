// Receipt-scan history: the memory that turns one-shot scans into a
// habit loop ("your hauls: 21 -> 28 -> 34"). Stored on-device so it
// works identically for guests and signed-in users; capped so it can't
// grow unbounded.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'brickd:receipt-history';
const MAX_ENTRIES = 50;

// entry = { ts, avg, count, flagged, foodIds: [fdcId], unmatched: [str] }
export async function loadHistory() {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

// Prepends the new entry (newest first) and returns the updated list.
export async function addHistoryEntry(entry, current) {
  const next = [entry, ...current].slice(0, MAX_ENTRIES);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

// Remove one haul (identified by its timestamp); returns the new list.
export async function deleteHistoryEntry(ts, current) {
  const next = current.filter((h) => h.ts !== ts);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
  return [];
}

export function formatHaulDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
