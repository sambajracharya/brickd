import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getFoodDetails, RESEARCH_NOTES } from '../api/usda';

function scoreColor(score) {
  if (score >= 60) return '#22c55e';
  if (score >= 30) return '#eab308';
  return '#f97316';
}

// One row of the "Why this score" section: label, amount, points earned,
// and a progress bar showing points / maxPoints.
function BreakdownRow({ item }) {
  const pct = item.maxPoints > 0 ? item.points / item.maxPoints : 0;
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowValue}>
          {item.value}
          {item.unit} per 100g
        </Text>
        <Text style={styles.rowPoints}>
          {item.points}/{item.maxPoints} pts
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${pct * 100}%`, backgroundColor: scoreColor(pct * 100) },
          ]}
        />
      </View>
    </View>
  );
}

export default function FoodDetailScreen({ route }) {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scoreHero}>
        <View
          style={[styles.scoreCircle, { borderColor: scoreColor(displayScore) }]}
        >
          <Text style={styles.scoreBig}>{displayScore}</Text>
          <Text style={styles.scoreOutOf}>/ 100</Text>
        </View>
        <Text style={styles.foodName}>{details ? details.name : name}</Text>
        <Text style={styles.scoreCaption}>Brick'd Score per 100g</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!details && !error && (
        <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 24 }} />
      )}

      {details && (
        <>
          <Text style={styles.sectionTitle}>Why this score</Text>
          <View style={styles.cardBlock}>
            {details.breakdown.map((item) => (
              <BreakdownRow key={item.key} item={item} />
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
              .map((item) => {
                const note = RESEARCH_NOTES[item.key];
                return (
                  <View key={item.key} style={styles.researchItem}>
                    <View style={styles.researchHeader}>
                      <Text style={styles.researchLabel}>{item.label}</Text>
                      <Text style={styles.researchStrength}>{note.strength}</Text>
                    </View>
                    <Text style={styles.researchText}>{note.text}</Text>
                  </View>
                );
              })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  scoreHero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  scoreBig: {
    color: '#f9fafb',
    fontSize: 40,
    fontWeight: '900',
  },
  scoreOutOf: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: -4,
  },
  foodName: {
    color: '#f9fafb',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreCaption: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  cardBlock: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    marginBottom: 14,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowLabel: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  rowValue: {
    color: '#9ca3af',
    fontSize: 12,
    marginRight: 10,
  },
  rowPoints: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
    width: 60,
    textAlign: 'right',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  methodNote: {
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 17,
  },
  researchItem: {
    marginBottom: 16,
  },
  researchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  researchLabel: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
  },
  researchStrength: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  researchText: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: '#f87171',
    textAlign: 'center',
    marginTop: 20,
  },
});
