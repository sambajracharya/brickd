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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>BRICK'D</Text>
        <Text style={styles.tagline}>
          Foods that support healthy testosterone — backed by evidence
        </Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search 300,000+ foods (try 'oysters')..."
        placeholderTextColor="#9ca3af"
        value={query}
        onChangeText={setQuery}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#22c55e" style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodCard food={item} onPress={() => openFood(item)} />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            showingFeatured ? (
              <Text style={styles.sectionTitle}>Featured picks</Text>
            ) : (
              <Text style={styles.sectionTitle}>
                Results for "{query.trim()}" — sorted by Brick'd Score
              </Text>
            )
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No foods found for "{query}"</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logo: {
    color: '#f9fafb',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  search: {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  loader: {
    marginTop: 40,
  },
  error: {
    color: '#f87171',
    marginHorizontal: 20,
    marginBottom: 8,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  empty: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 40,
  },
});
