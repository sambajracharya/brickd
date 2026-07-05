import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchFoods } from '../api/usda';
import FoodCard from '../components/FoodCard';
import Screen from '../components/Screen';
import {
  colors,
  input,
  sectionLabel,
  spacing,
} from '../theme';

// Curated picks shown before the user searches. These are REAL USDA
// entries (fdcId) with scores computed from real lab data — so the card
// always matches what the detail screen shows.
const FEATURED_FOODS = [
  {
    id: '170556',
    fdcId: 170556,
    name: 'Pumpkin Seeds (dried kernels)',
    score: 70,
    nutrients: ['Protein 30.2g', 'Zinc 7.8mg', 'Magnesium 592mg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
  },
  {
    id: '175167',
    fdcId: 175167,
    name: 'Salmon (Atlantic, farmed)',
    score: 59,
    nutrients: ['Protein 20.4g', 'Vitamin D 11µg', 'Selenium 24µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
  },
  {
    id: '174030',
    fdcId: 174030,
    name: 'Ground Beef (90% lean)',
    score: 56,
    nutrients: ['Protein 20g', 'Zinc 4.8mg', 'Selenium 16.6µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
  },
  {
    id: '171978',
    fdcId: 171978,
    name: 'Oysters (eastern, wild)',
    score: 44,
    nutrients: ['Zinc 39.3mg', 'Protein 5.7g', 'Selenium 19.7µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
  },
  {
    id: '171287',
    fdcId: 171287,
    name: 'Eggs (whole, fresh)',
    score: 44,
    nutrients: ['Protein 12.6g', 'Zinc 1.3mg', 'Vitamin D 2µg', 'Selenium 30.7µg'],
    evidence: 'Moderate',
  },
  {
    id: '168462',
    fdcId: 168462,
    name: 'Spinach (raw)',
    score: 18,
    nutrients: ['Magnesium 79mg'],
    evidence: 'Supportive',
  },
  {
    id: '2259794',
    fdcId: 2259794,
    name: 'Greek Yogurt (plain, whole milk)',
    score: 13,
    nutrients: ['Protein 8.8g'],
    evidence: 'Supportive',
  },
];

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = show featured list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  // Search the USDA database 500ms after the user stops typing.
  useEffect(() => {
    clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const foods = await searchFoods(trimmed);
        setResults(foods);
        setError(null);
      } catch (e) {
        setError('Could not reach the food database. Check your connection.');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const showingFeatured = results === null;
  const data = showingFeatured ? FEATURED_FOODS : results;

  const openFood = (food) => {
    navigation.navigate('FoodDetail', {
      fdcId: food.fdcId,
      name: food.name,
      score: food.score,
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.logo}>
          BRICK<Text style={styles.logoAccent}>'D</Text>
        </Text>
        <Text style={styles.tagline}>
          Evidence-based foods for healthy testosterone
        </Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search 300,000+ foods..."
        placeholderTextColor={colors.textTertiary}
        value={query}
        onChangeText={setQuery}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodCard food={item} onPress={() => openFood(item)} />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {showingFeatured
                ? 'Featured picks'
                : `Results — sorted by Brick'd Score`}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No foods found for "{query}"</Text>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 24,
    paddingHorizontal: spacing.screen,
    paddingBottom: 18,
  },
  logo: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoAccent: {
    color: colors.accent,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },
  search: {
    ...input,
    marginHorizontal: spacing.screen,
    marginBottom: 14,
  },
  sectionTitle: {
    ...sectionLabel,
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
  },
  error: {
    color: colors.danger,
    marginHorizontal: spacing.screen,
    marginBottom: 8,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
