import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { useTheme } from '../store/theme';
import { SCORING, RESEARCH_NOTES } from '../api/usda';
import { spacing } from '../theme';

// The transparency page: how the Brick'd Score actually works.
// Everything here is rendered from the same SCORING/RESEARCH_NOTES the
// app scores with — this page can never drift from the real algorithm.
export default function HowScoringScreen() {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>How the score works</Text>
        <Text style={styles.lead}>
          The Brick'd Score (0–100) measures how much a food contributes,
          per 100g, toward the nutrient intakes involved in normal
          testosterone production. It is built from public USDA lab data —
          never from marketing claims.
        </Text>

        <Text style={styles.sectionTitle}>The nutrients & weights</Text>
        <View style={styles.card}>
          <Text style={styles.cardIntro}>
            Points are ranked by the strength of the human evidence — a
            nutrient with strong trial data can earn more than one with
            promising-but-thin data.
          </Text>
          {SCORING.map(({ key, weight, label }) => {
            const note = RESEARCH_NOTES[key];
            return (
              <View key={key} style={styles.nutrientRow}>
                <View style={styles.nutrientHeader}>
                  <Text style={styles.nutrientLabel}>{label}</Text>
                  <Text style={styles.nutrientStrength}>{note.strength}</Text>
                  <Text style={styles.nutrientWeight}>{weight} pts</Text>
                </View>
                <Text style={styles.nutrientText}>{note.text}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Why points are capped</Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            Each nutrient earns points in proportion to how far 100g gets
            you toward a meaningful daily amount (adult male RDAs), and
            stops at its cap. Oysters carry ~8× the zinc target — but once
            you're zinc-sufficient, extra zinc does nothing for
            testosterone, so extra zinc earns nothing. The cap is the
            evidence, not a design quirk.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Warning flags</Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            Flags (added sugar, sodium, saturated fat, ultra-processing)
            never change the score. Subtracting points would mean inventing
            math — "−12 for sugar" isn't a number any study supports.
            Instead, flags surface facts from the label, because the
            strongest dietary evidence on testosterone is about metabolic
            harm: obesity and heavily processed diets lower it more
            reliably than any single nutrient raises it. You see both
            sides; you decide.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>The honest part</Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            No food raises testosterone above normal in men who are already
            nutrient-sufficient. What nutrition can do is prevent the
            deficiencies known to lower it. A high score means "dense in
            the nutrients that protect normal testosterone" — not "eat
            this and levels go up." If you have symptoms of low
            testosterone, the right move is a morning blood test with a
            doctor, not a shopping list.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(t) {
  const { colors } = t;
  return StyleSheet.create({
    content: {
      padding: spacing.screen,
      // Room for the transparent nav header.
      paddingTop: 56,
      paddingBottom: 60,
    },
    title: {
      ...t.screenTitle,
      marginBottom: 10,
    },
    lead: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 22,
    },
    sectionTitle: {
      ...t.sectionLabel,
      marginBottom: 10,
    },
    card: {
      ...t.glassCard,
      marginBottom: 22,
    },
    cardIntro: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 16,
    },
    nutrientRow: {
      marginBottom: 16,
    },
    nutrientHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    nutrientLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      flex: 1,
    },
    nutrientStrength: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
      marginRight: 12,
    },
    nutrientWeight: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      width: 50,
      textAlign: 'right',
    },
    nutrientText: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
    body: {
      color: colors.textSecondary,
      fontSize: 13.5,
      lineHeight: 20,
    },
  });
}
