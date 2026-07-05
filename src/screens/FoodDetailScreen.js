import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getFoodDetails, RESEARCH_NOTES } from '../api/usda';
import Screen from '../components/Screen';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

// One row of the "Why this score" section: label, amount, points earned,
// and a gradient progress bar showing points / maxPoints.
function BreakdownRow({ item, t, styles }) {
  const pct = item.maxPoints > 0 ? item.points / item.maxPoints : 0;
  const tint = t.scoreColor(pct * 100);
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowValue}>
          {item.value}
          {item.unit} / 100g
        </Text>
        <Text style={[styles.rowPoints, { color: tint }]}>
          {item.points}/{item.maxPoints}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <LinearGradient
          colors={[`${tint}55`, tint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${Math.max(pct * 100, 2)}%` }]}
        />
      </View>
    </View>
  );
}

export default function FoodDetailScreen({ route }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  // Passed from the card so the screen renders instantly...
  const { fdcId, name, score } = route.params;
  // ...while the full breakdown loads from the USDA.
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getFoodDetails(fdcId)
      .then((d) => !cancelled && setDetails(d))
      .catch(() => !cancelled && setError('Could not load food details.'));
    return () => {
      cancelled = true;
    };
  }, [fdcId]);

  const displayScore = details ? details.score : score;
  const ring = t.scoreColor(displayScore);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scoreHero}>
          <View style={[styles.scoreHalo, { shadowColor: ring }]}>
            <View style={[styles.scoreCircle, { borderColor: ring }]}>
              <Text style={styles.scoreBig}>{displayScore}</Text>
              <Text style={styles.scoreOutOf}>/ 100</Text>
            </View>
          </View>
          <Text style={styles.foodName}>{details ? details.name : name}</Text>
          <Text style={styles.scoreCaption}>BRICK'D SCORE · PER 100G</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {!details && !error && (
          <ActivityIndicator
            size="large"
            color={t.colors.accent}
            style={{ marginTop: 24 }}
          />
        )}

        {details && (
          <>
            <Text style={styles.sectionTitle}>Why this score</Text>
            <View style={styles.cardBlock}>
              {details.breakdown.map((item) => (
                <BreakdownRow key={item.key} item={item} t={t} styles={styles} />
              ))}
              <Text style={styles.methodNote}>
                Points reflect how far 100g gets you toward daily intakes
                (adult male RDAs) for nutrients involved in normal
                testosterone production. No food raises testosterone above
                normal in men who are already nutrient-sufficient.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>The research</Text>
            <View style={styles.cardBlock}>
              {details.breakdown
                .filter((item) => item.points > 0)
                .map((item, i, arr) => {
                  const note = RESEARCH_NOTES[item.key];
                  return (
                    <View
                      key={item.key}
                      style={[
                        styles.researchItem,
                        i === arr.length - 1 && { marginBottom: 0 },
                      ]}
                    >
                      <View style={styles.researchHeader}>
                        <Text style={styles.researchLabel}>{item.label}</Text>
                        <Text style={styles.researchStrength}>
                          {note.strength}
                        </Text>
                      </View>
                      <Text style={styles.researchText}>{note.text}</Text>
                    </View>
                  );
                })}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function createStyles(t) {
  const { colors } = t;
  return StyleSheet.create({
    content: {
      padding: spacing.screen,
      // Extra room because the transparent nav header floats above.
      paddingTop: 56,
      paddingBottom: 60,
    },
    scoreHero: {
      alignItems: 'center',
      marginBottom: 26,
    },
    scoreHalo: {
      shadowOpacity: 0.55,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 0 },
      elevation: 12,
      borderRadius: 62,
      marginBottom: 16,
    },
    scoreCircle: {
      width: 124,
      height: 124,
      borderRadius: 62,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.ringBg,
    },
    scoreBig: {
      color: colors.text,
      fontSize: 42,
      fontWeight: '800',
      letterSpacing: -1,
    },
    scoreOutOf: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: -2,
    },
    foodName: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    scoreCaption: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.6,
      marginTop: 6,
    },
    sectionTitle: {
      ...t.sectionLabel,
      marginBottom: 10,
      marginTop: 8,
    },
    cardBlock: {
      ...t.glassCard,
      marginBottom: 22,
    },
    row: {
      marginBottom: 15,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 7,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      flex: 1,
    },
    rowValue: {
      color: colors.textSecondary,
      fontSize: 12,
      marginRight: 12,
    },
    rowPoints: {
      fontSize: 12,
      fontWeight: '800',
      width: 44,
      textAlign: 'right',
    },
    barTrack: {
      height: 6,
      backgroundColor: colors.inputBg,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    methodNote: {
      color: colors.textTertiary,
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 4,
      lineHeight: 17,
    },
    researchItem: {
      marginBottom: 18,
    },
    researchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    researchLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    researchStrength: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    researchText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    error: {
      color: colors.danger,
      textAlign: 'center',
      marginTop: 20,
    },
  });
}
