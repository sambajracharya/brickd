// Auth state shared app-wide, backed by Supabase.
//
// `configured` is false until Supabase credentials exist in .env.local —
// the UI shows setup steps instead of a broken login form.

import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../api/supabase';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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

    const redirectTo = Linking.createURL('/auth');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      // User closed the browser sheet, or the redirect never fired
      // (usually a Supabase Redirect URL mismatch).
      throw new Error(
        'Google sign-in was cancelled or the redirect back to the app failed.'
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
        loading,
        signUp,
        signIn,
        signOut,
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
