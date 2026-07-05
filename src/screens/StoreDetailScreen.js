import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getFoodsForStoreType, CURATED_FOODS } from '../data/curatedFoods';
import FoodCard from '../components/FoodCard';
import { formatDistance } from '../api/stores';

export default function StoreDetailScreen({ route, navigation }) {
  const { store } = route.params;
  const foods = getFoodsForStoreType(store.type);
  const isFallback = !CURATED_FOODS.some((f) => f.storeTypes.includes(store.type));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={foods}
      keyExtractor={(item) => String(item.fdcId)}
      renderItem={({ item }) => (
        <FoodCard
          food={item}
          onPress={() =>
            navigation.navigate('FoodDetail', {
              fdcId: item.fdcId,
              name: item.name,
              score: item.score,
            })
          }
        />
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Text style={styles.storeName}>{store.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.typeChip}>
                <Text style={styles.typeText}>{store.type}</Text>
              </View>
              <Text style={styles.distance}>
                {formatDistance(store.distanceKm)}
              </Text>
            </View>
            {store.address && (
              <Text style={styles.address}>{store.address}</Text>
            )}
            {store.openingHours && (
              <Text style={styles.hours}>Hours: {store.openingHours}</Text>
            )}
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerTitle}>
              Foods commonly found here
            </Text>
            <Text style={styles.disclaimerText}>
              {isFallback
                ? "Brick'd doesn't have a curated list for this store type yet, so here are our top-scoring foods overall. "
                : `Based on what ${store.type.toLowerCase()} stores typically carry. `}
              This isn't this store's real-time stock — no public data
              source provides that for most grocery stores.
            </Text>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  storeName: {
    color: '#f9fafb',
    fontSize: 24,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  typeChip: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  distance: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
  },
  address: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 8,
  },
  hours: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  disclaimer: {
    backgroundColor: '#78350f22',
    borderColor: '#a16207',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    marginBottom: 18,
  },
  disclaimerTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
  },
  disclaimerText: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
});
