import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Temporary hardcoded data — later this comes from the USDA FoodData Central API.
// Evidence levels are honest: "strong" only where research actually supports it
// (i.e., correcting a deficiency), "moderate"/"supportive" otherwise.
const FOODS = [
  {
    id: '1',
    name: 'Oysters',
    score: 94,
    nutrients: ['Zinc', 'Protein', 'Selenium', 'Vitamin B12'],
    evidence: 'Strong (zinc deficiency correction)',
  },
  {
    id: '2',
    name: 'Ground Beef (90% lean)',
    score: 88,
    nutrients: ['Protein', 'Zinc', 'Iron', 'B Vitamins'],
    evidence: 'Moderate',
  },
  {
    id: '3',
    name: 'Eggs',
    score: 85,
    nutrients: ['Protein', 'Vitamin D', 'Choline'],
    evidence: 'Moderate',
  },
  {
    id: '4',
    name: 'Salmon',
    score: 84,
    nutrients: ['Omega-3', 'Vitamin D', 'Protein', 'Selenium'],
    evidence: 'Moderate',
  },
  {
    id: '5',
    name: 'Greek Yogurt',
    score: 78,
    nutrients: ['Protein', 'Calcium', 'Vitamin D (fortified)'],
    evidence: 'Supportive',
  },
  {
    id: '6',
    name: 'Pumpkin Seeds',
    score: 76,
    nutrients: ['Zinc', 'Magnesium', 'Healthy Fats'],
    evidence: 'Supportive',
  },
  {
    id: '7',
    name: 'Spinach',
    score: 70,
    nutrients: ['Magnesium', 'Folate', 'Iron'],
    evidence: 'Supportive',
  },
];

function scoreColor(score) {
  if (score >= 85) return '#22c55e'; // green
  if (score >= 75) return '#eab308'; // yellow
  return '#f97316'; // orange
}

function FoodCard({ food }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.foodName}>{food.name}</Text>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor(food.score) }]}>
          <Text style={styles.scoreText}>{food.score}</Text>
        </View>
      </View>
      <View style={styles.nutrientRow}>
        {food.nutrients.map((n) => (
          <View key={n} style={styles.nutrientChip}>
            <Text style={styles.nutrientText}>{n}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.evidence}>Evidence: {food.evidence}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [query, setQuery] = useState('');

  const filtered = FOODS.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.logo}>BRICK'D</Text>
          <Text style={styles.tagline}>
            Foods that support healthy testosterone — backed by evidence
          </Text>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search foods (try 'beef' or 'eggs')..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FoodCard food={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No foods found for "{query}"</Text>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
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
  empty: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 40,
  },
});
