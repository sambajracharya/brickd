import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../store/favorites';

function scoreColor(score) {
  if (score >= 60) return '#22c55e'; // green
  if (score >= 30) return '#eab308'; // yellow
  return '#f97316'; // orange
}

// One food card: name, heart, score badge, nutrient chips, evidence.
// `food` = { fdcId, name, score, nutrients, evidence }
export default function FoodCard({ food, onPress }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(food.fdcId);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.foodName}>{food.name}</Text>
        <TouchableOpacity
          onPress={() => toggleFavorite(food)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={saved ? 'Remove from saved' : 'Save food'}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={22}
            color={saved ? '#ef4444' : '#6b7280'}
          />
        </TouchableOpacity>
        <View
          style={[styles.scoreBadge, { backgroundColor: scoreColor(food.score) }]}
        >
          <Text style={styles.scoreText}>{food.score}</Text>
        </View>
      </View>
      {food.nutrients.length > 0 && (
        <View style={styles.nutrientRow}>
          {food.nutrients.map((n) => (
            <View key={n} style={styles.nutrientChip}>
              <Text style={styles.nutrientText}>{n}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.evidence}>Evidence: {food.evidence}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  foodName: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  scoreBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 16,
  },
  nutrientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  nutrientChip: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nutrientText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  evidence: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
