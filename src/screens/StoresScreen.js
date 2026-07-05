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
import { getNearbyStores, formatDistance, CUISINE_LABELS } from '../api/stores';
import Screen from '../components/Screen';
import {
  buttonPrimary,
  buttonPrimaryText,
  chip,
  chipText,
  colors,
  glassCard,
  screenSubtitle,
  screenTitle,
  spacing,
} from '../theme';

function StoreCard({ store, onPress }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.65} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.distance}>{formatDistance(store.distanceKm)}</Text>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.typeChip}>
          <Text style={styles.typeText}>{store.type}</Text>
        </View>
        {store.cuisine && (
          <View style={[styles.typeChip, styles.cuisineChip]}>
            <Text style={styles.cuisineText}>{CUISINE_LABELS[store.cuisine]}</Text>
          </View>
        )}
        {store.address && <Text style={styles.address}>{store.address}</Text>}
      </View>
      {store.openingHours && (
        <Text style={styles.hours}>{store.openingHours}</Text>
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
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Stores</Text>
        <Text style={styles.subtitle}>
          Grocery stores around you, closest first
        </Text>
      </View>

      {status === 'loading' && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accent} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 24,
    paddingHorizontal: spacing.screen,
    paddingBottom: 18,
  },
  title: {
    ...screenTitle,
  },
  subtitle: {
    ...screenSubtitle,
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 48,
  },
  centerText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
  },
  retryButton: {
    ...buttonPrimary,
    marginTop: 18,
  },
  retryText: {
    ...buttonPrimaryText,
  },
  list: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },
  card: {
    ...glassCard,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  distance: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 9,
    gap: 8,
  },
  typeChip: {
    ...chip,
  },
  typeText: {
    ...chipText,
  },
  cuisineChip: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accentBorder,
  },
  cuisineText: {
    ...chipText,
    color: colors.accent,
    fontWeight: '700',
  },
  address: {
    color: colors.textTertiary,
    fontSize: 12,
    flex: 1,
  },
  hours: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 8,
  },
  viewFoods: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },
});
