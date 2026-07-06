import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../store/auth';

// First screen of the app (X-style). Pure black to match the logo's
// background — intentionally NOT themed: the welcome screen is the
// brand moment, identical in light and dark mode.
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const MUTED = '#71767B'; // X's muted gray
const FIELD_BORDER = '#2F3336';
const ACCENT = '#E8442D'; // brick red, pulled from the logo

export default function WelcomeScreen() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState('welcome'); // welcome | signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { kind, text }

  const google = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      setMessage({
        kind: 'error',
        text: e.message ?? 'Google sign-in failed.',
      });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      setMessage({ kind: 'error', text: 'Enter an email and password.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (view === 'signup') {
        await auth.signUp(email.trim(), password);
        setMessage({
          kind: 'info',
          text: 'Account created — check your email to confirm, then sign in.',
        });
        setView('signin');
      } else {
        await auth.signIn(email.trim(), password);
      }
    } catch (e) {
      setMessage({ kind: 'error', text: e.message ?? 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  const switchView = (v) => {
    setView(v);
    setMessage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/brick-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.headline}>Welcome to Brick'd</Text>
        <Text style={styles.subhead}>
          Evidence-based foods for healthy testosterone — at stores near you.
        </Text>

        {message && (
          <Text
            style={[
              styles.message,
              { color: message.kind === 'error' ? '#F4212E' : '#4ADE80' },
            ]}
          >
            {message.text}
          </Text>
        )}

        {view === 'welcome' && (
          <View style={styles.stack}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={google}
              disabled={busy}
            >
              <Ionicons name="logo-google" size={17} color={BLACK} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.accentButton}
              onPress={() => switchView('signup')}
            >
              <Text style={styles.accentText}>Create account</Text>
            </TouchableOpacity>

            <Text style={styles.finePrint}>
              Brick'd shares nutrition evidence. It is not medical advice.
            </Text>

            <View style={styles.signinRow}>
              <Text style={styles.signinPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => switchView('signin')}>
                <Text style={styles.signinLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(view === 'signin' || view === 'signup') && (
          <View style={styles.stack}>
            <TextInput
              style={styles.field}
              placeholder="Email"
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.field}
              placeholder="Password"
              placeholderTextColor={MUTED}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.accentButton}
              onPress={submit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <Text style={styles.accentText}>
                  {view === 'signup' ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchView(view === 'signup' ? 'signin' : 'signup')}
            >
              <Text style={styles.switchLink}>
                {view === 'signup'
                  ? 'Already have an account? Sign in'
                  : "New to Brick'd? Create an account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => switchView('welcome')}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: BLACK,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 4,
  },
  headline: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subhead: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 28,
    maxWidth: 300,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
    maxWidth: 320,
  },
  stack: {
    width: '100%',
    maxWidth: 340,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: WHITE,
    borderRadius: 999,
    paddingVertical: 13,
  },
  googleText: {
    color: BLACK,
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: FIELD_BORDER,
  },
  dividerText: {
    color: MUTED,
    fontSize: 13,
  },
  accentButton: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  accentText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
  },
  finePrint: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  signinPrompt: {
    color: MUTED,
    fontSize: 14,
  },
  signinLink: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
  },
  field: {
    backgroundColor: BLACK,
    borderColor: FIELD_BORDER,
    borderWidth: 1,
    borderRadius: 10,
    color: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  switchLink: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 18,
  },
  backLink: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },
});
