import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

// In-app copy of docs/privacy-policy.md — keep the two in sync.
const SECTIONS = [
  {
    title: 'The short version',
    body: "Brick'd collects the minimum needed to run: an email if you create an account, and the foods you save. No ads, no data brokers, no identifying analytics — ever. You can browse as a guest with no account at all.",
  },
  {
    title: 'Data you give us',
    body: 'Account (optional): your email and a hashed password — or your Google identity — stored with Supabase, our backend, solely so you can sign in. Saved foods: synced to your account (guests: device-only). Preferences like theme and recent searches stay on your device.',
  },
  {
    title: 'Used but never kept',
    body: "Location: used once per lookup to find nearby stores via OpenStreetMap — never stored on our servers or tied to your account. Receipt photos: sent to OCR.space to read the text; we don't store the photo or the text. Barcodes and searches: sent to Open Food Facts and USDA without your identity.",
  },
  {
    title: 'Service providers',
    body: 'Supabase (accounts + saved foods, protected by row-level security), OCR.space (receipt text), OpenStreetMap (store lookup), USDA FoodData Central and Open Food Facts (public nutrition data), and Google only if you choose Google sign-in.',
  },
  {
    title: "What we don't do",
    body: 'No advertising or ad SDKs. No selling or sharing personal data. No identifying analytics. No collection of health measurements — Brick\'d never asks for lab results, hormone levels, or medical history.',
  },
  {
    title: 'Deleting your data',
    body: 'Profile → Delete account permanently removes your account and saved foods from our servers, immediately. On-device data (guest favorites, preferences) is removed by deleting the app.',
  },
  {
    title: 'Not medical advice',
    body: "Brick'd summarizes public nutrition research. No food raises testosterone above normal in people who are already nutrient-sufficient. If you have symptoms, talk to a doctor.",
  },
  {
    title: 'Contact',
    body: 'Questions or requests: sambajracharya3030@gmail.com\n\nEffective date: July 8, 2026. Material changes will be noted in the app.',
  },
];

export default function PrivacyScreen() {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function createStyles(t) {
  const { colors } = t;
  return StyleSheet.create({
    content: {
      padding: spacing.screen,
      paddingTop: 56,
      paddingBottom: 60,
    },
    title: {
      ...t.screenTitle,
      marginBottom: 18,
    },
    section: {
      ...t.glassCard,
      marginBottom: 14,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 6,
    },
    body: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
  });
}
