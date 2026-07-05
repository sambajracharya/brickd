import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../store/favorites';
import { colors, glassCard, chip, chipText, scoreColor } from '../theme';

// One food card: name, heart, score ring, nutrient chips, evidence.
// `food` = { fdcId, name, score, nutrients, evidence }
export default function FoodCard({ food, onPress }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(food.fdcId);
  const ring = scoreColor(food.score);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.65} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.evidence}>{food.evidence}</Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(food)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={saved ? 'Remove from saved' : 'Save food'}
          style={styles.heart}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={20}
            color={saved ? colors.heart : colors.textTertiary}
          />
        </TouchableOpacity>
        <View style={[styles.scoreRing, { borderColor: ring }]}>
          <Text style={[styles.scoreText, { color: ring }]}>{food.score}</Text>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassCard,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  foodName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  evidence: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 3,
  },
  heart: {
    padding: 2,
  },
  scoreRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
  },
  nutrientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  nutrientChip: {
    ...chip,
  },
  nutrientText: {
    ...chipText,
  },
});
