import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { getNearbyStores, formatDistance } from '../api/stores';

function StoreCard({ store, onPress }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.distance}>{formatDistance(store.distanceKm)}</Text>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.typeChip}>
          <Text style={styles.typeText}>{store.type}</Text>
        </View>
        {store.address && <Text style={styles.address}>{store.address}</Text>}
      </View>
      {store.openingHours && (
        <Text style={styles.hours}>Hours: {store.openingHours}</Text>
      )}
      <Text style={styles.viewFoods}>See foods commonly found here →</Text>
    </TouchableOpacity>
  );
}

export default function StoresScreen({ navigation }) {
  const [status, setStatus] = useState('loading'); // loading | denied | error | ready
  const [stores, setStores] = useState([]);

  const locate = useCallback(async () => {
    setStatus('loading');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const found = await getNearbyStores(
        pos.coords.latitude,
        pos.coords.longitude
      );
      setStores(found);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Stores</Text>
        <Text style={styles.subtitle}>
          Grocery stores around you, closest first
        </Text>
      </View>

      {status === 'loading' && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.centerText}>Finding stores near you...</Text>
        </View>
      )}

      {status === 'denied' && (
        <View style={styles.centerBox}>
          <Text style={styles.centerText}>
            Brick'd needs location access to find grocery stores near you.
            Enable location in your device settings, then try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={locate}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centerBox}>
          <Text style={styles.centerText}>
            Could not load stores. Check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={locate}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'ready' && (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoreCard
              store={item}
              onPress={() => navigation.navigate('StoreDetail', { store: item })}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.centerText}>
              No grocery stores found within 5 miles.
            </Text>
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
  title: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 48,
  },
  centerText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 18,
  },
  retryText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 14,
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
  storeName: {
    color: '#f9fafb',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  distance: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
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
  address: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  hours: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
  },
  viewFoods: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
});
