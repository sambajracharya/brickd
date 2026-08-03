// Per-identity local storage.
//
// Security fix: receipt history, recent searches and shopping check-offs
// used to live under global keys that survived sign-out, so the next
// person to use the phone saw the previous user's grocery history.
// Every on-device key is now scoped to the signed-in user id (or
// 'guest'), the same way favorites already were.
//
// Sign-out deliberately does NOT delete anything — this data is
// local-only, so wiping it would silently destroy a user's history.
// Switching identity just switches namespace. Account deletion DOES
// purge, since "delete my account" should leave no local trace.

import AsyncStorage from '@react-native-async-storage/async-storage';

export function scopeOf(userId) {
  return userId || 'guest';
}

export function scopedKey(base, userId) {
  return `${base}:${scopeOf(userId)}`;
}

// One-time move of pre-scoping data into the current namespace so
// existing users keep their history. Safe to call repeatedly.
export async function migrateLegacyKey(base, userId) {
  const target = scopedKey(base, userId);
  try {
    const [existing, legacy] = await Promise.all([
      AsyncStorage.getItem(target),
      AsyncStorage.getItem(base),
    ]);
    if (existing == null && legacy != null) {
      await AsyncStorage.setItem(target, legacy);
    }
    if (legacy != null) await AsyncStorage.removeItem(base);
  } catch {}
}

// Hand the guest namespace's data to a newly created account.
//
// Only ever called for an account that signed up on THIS device (see
// auth.js pending-claim), never on an arbitrary sign-in — otherwise a
// second person signing in would inherit the previous guest's history.
// Existing data for the account always wins; guest data is cleared
// either way so it can't be inherited twice.
export async function claimGuestData(userId, bases) {
  if (!userId) return;
  for (const base of bases) {
    const from = scopedKey(base, null);
    const to = scopedKey(base, userId);
    try {
      const [mine, theirs] = await Promise.all([
        AsyncStorage.getItem(to),
        AsyncStorage.getItem(from),
      ]);
      if (theirs != null && mine == null) {
        await AsyncStorage.setItem(to, theirs);
      }
      if (theirs != null) await AsyncStorage.removeItem(from);
    } catch {}
  }
}

// Remove every on-device Brick'd key belonging to one identity.
export async function purgeScope(userId) {
  const suffix = `:${scopeOf(userId)}`;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter(
      (k) => k.startsWith('brickd:') && k.endsWith(suffix)
    );
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch {}
}
