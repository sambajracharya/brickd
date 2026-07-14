// Auth state shared app-wide, backed by Supabase.
//
// `configured` is false until Supabase credentials exist in .env.local —
// the UI shows setup steps instead of a broken login form.

import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../api/supabase';

WebBrowser.maybeCompleteAuthSession();

const GUEST_KEY = 'brickd:guest';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [guest, setGuest] = useState(false);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;

    Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem(GUEST_KEY).catch(() => null),
    ]).then(([{ data }, g]) => {
      setSession(data.session ?? null);
      setGuest(g === '1');
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Browse without an account. Favorites stay on-device (see
  // favorites.js LEGACY_KEY) and migrate automatically at sign-up.
  const continueAsGuest = () => {
    setGuest(true);
    AsyncStorage.setItem(GUEST_KEY, '1').catch(() => {});
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    // Explicit sign-out returns to the welcome screen (guest mode off).
    setGuest(false);
    AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
    await supabase.auth.signOut();
  };

  // Permanently delete the account. Calls a SECURITY DEFINER Postgres
  // function (delete_user) that removes the auth user; the favorites
  // table cascades via its foreign key. App Store requirement.
  const deleteAccount = async () => {
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    await signOut();
  };

  // Google OAuth. On web, Supabase handles the redirect natively. On
  // phones we open the browser flow and hand the returned tokens back.
  // Requires the Google provider to be enabled in the Supabase dashboard.
  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      return;
    }

    // Two URLs, one trip:
    // - appReturn (exp://...) is what the auth sheet intercepts to hand
    //   control back to the app.
    // - redirectTo (http://<pc-ip>:8085/auth) is what Supabase actually
    //   redirects to — its allowlist silently rejects custom schemes
    //   like exp://, so a tiny dev forwarder (scripts/auth-forwarder.js)
    //   accepts the http redirect and bounces it into the app.
    const appReturn = Linking.createURL('/auth');
    const devHost = new URL(appReturn).hostname; // PC's LAN IP in Expo Go
    const redirectTo = devHost
      ? `http://${devHost}:8085/auth`
      : appReturn; // production builds use the app's own scheme

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data.url, appReturn);
    if (result.type !== 'success' || !result.url) {
      // User closed the browser sheet, or the redirect never fired
      // (usually a Supabase Redirect URL mismatch). Surface the exact
      // URLs so failures are diagnosable from the screen.
      throw new Error(
        `Google sign-in did not complete (${result.type}).\n` +
          `auth host: ${new URL(data.url).host}\n` +
          `redirect: ${redirectTo}\n` +
          `return: ${appReturn}`
      );
    }

    // PKCE flow: the redirect carries a one-time ?code= to exchange.
    const returned = new URL(result.url);
    const code = returned.searchParams.get('code');
    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return;
    }

    // Fallback: older implicit flow puts tokens in the URL fragment.
    const fragment = result.url.split('#')[1] ?? '';
    const params = new URLSearchParams(fragment);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) throw sessionError;
      return;
    }

    // We got redirected back but with neither code nor tokens — surface
    // whatever error Supabase attached instead of failing silently.
    const errDesc =
      returned.searchParams.get('error_description') ||
      params.get('error_description');
    throw new Error(errDesc || 'Google sign-in returned no session.');
  };

  return (
    <AuthContext.Provider
      value={{
        configured: !!supabase,
        session,
        user: session?.user ?? null,
        guest,
        loading,
        continueAsGuest,
        signUp,
        signIn,
        signOut,
        deleteAccount,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
