import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { useTheme } from '../store/theme';
import { useAuth } from '../store/auth';
import { spacing } from '../theme';

export default function ProfileScreen() {
  const t = useTheme();
  const { colors, mode, setMode } = t;
  const auth = useAuth();
  const styles = useMemo(() => createStyles(t), [t]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formMode, setFormMode] = useState('signin'); // signin | signup
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { kind: 'error'|'info', text }

  const submit = async () => {
    if (!email.trim() || !password) {
      setMessage({ kind: 'error', text: 'Enter an email and password.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (formMode === 'signup') {
        await auth.signUp(email.trim(), password);
        setMessage({
          kind: 'info',
          text: 'Account created. Check your email to confirm, then sign in.',
        });
        setFormMode('signin');
      } else {
        await auth.signIn(email.trim(), password);
      }
    } catch (e) {
      setMessage({ kind: 'error', text: e.message ?? 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      setMessage({
        kind: 'error',
        text:
          e.message ??
          'Google sign-in failed. The Google provider may not be enabled yet.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Appearance — always available */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.segmentRow}>
            {['dark', 'light'].map((m) => {
              const active = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setMode(m)}
                >
                  <Ionicons
                    name={m === 'dark' ? 'moon' : 'sunny'}
                    size={15}
                    color={active ? colors.onAccent : colors.textSecondary}
                  />
                  <Text
                    style={[styles.segmentText, active && styles.segmentTextActive]}
                  >
                    {m === 'dark' ? 'Dark' : 'Light'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>

        {!auth.configured && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Backend not connected yet</Text>
            <Text style={styles.cardBody}>
              Accounts run on Supabase (free). To activate login:{'\n\n'}
              1. Create a project at supabase.com{'\n'}
              2. Copy the Project URL and anon key from Settings → API{'\n'}
              3. Add both to .env.local and restart the app
            </Text>
          </View>
        )}

        {auth.configured && auth.loading && (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
        )}

        {auth.configured && !auth.loading && auth.user && (
          <View style={styles.card}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userEmail}>{auth.user.email}</Text>
                <Text style={styles.userMeta}>Signed in</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.buttonGhost}
              onPress={() => auth.signOut()}
            >
              <Text style={styles.buttonGhostText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        )}

        {auth.configured && !auth.loading && !auth.user && (
          <View style={styles.card}>
            <TextInput
              style={styles.field}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.field}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {message && (
              <Text
                style={[
                  styles.message,
                  { color: message.kind === 'error' ? colors.danger : colors.accent },
                ]}
              >
                {message.text}
              </Text>
            )}

            <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.onAccent} size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {formMode === 'signup' ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonGoogle} onPress={google} disabled={busy}>
              <Ionicons name="logo-google" size={16} color={colors.text} />
              <Text style={styles.buttonGoogleText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFormMode(formMode === 'signup' ? 'signin' : 'signup');
                setMessage(null);
              }}
            >
              <Text style={styles.switchText}>
                {formMode === 'signup'
                  ? 'Already have an account? Sign in'
                  : "New to Brick'd? Create an account"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footnote}>
          Brick'd shares evidence about nutrition. It is not medical advice —
          talk to a doctor about symptoms or treatment.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function createStyles(t) {
  const { colors } = t;
  return StyleSheet.create({
    content: {
      paddingHorizontal: spacing.screen,
      paddingBottom: 60,
    },
    header: {
      paddingTop: 24,
      paddingBottom: 18,
    },
    title: {
      ...t.screenTitle,
    },
    sectionTitle: {
      ...t.sectionLabel,
      marginBottom: 10,
      marginTop: 8,
    },
    card: {
      ...t.glassCard,
      marginBottom: 22,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    cardBody: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 11,
      borderRadius: t.radius.input,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    segmentActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    segmentText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    segmentTextActive: {
      color: colors.onAccent,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentDim,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userEmail: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    userMeta: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 2,
    },
    field: {
      ...t.input,
      marginBottom: 10,
    },
    message: {
      fontSize: 13,
      marginBottom: 10,
      lineHeight: 18,
    },
    button: {
      ...t.buttonPrimary,
      marginTop: 4,
    },
    buttonText: {
      ...t.buttonPrimaryText,
    },
    buttonGoogle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: t.radius.button,
      paddingVertical: 12,
      marginTop: 10,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    buttonGoogleText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    buttonGhost: {
      borderRadius: t.radius.button,
      paddingVertical: 11,
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    buttonGhostText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
    },
    switchText: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 14,
    },
    footnote: {
      color: colors.textTertiary,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 4,
      paddingHorizontal: 10,
    },
  });
}
