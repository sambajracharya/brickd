import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getFoodsForStore } from '../data/curatedFoods';
import FoodCard from '../components/FoodCard';
import Screen from '../components/Screen';
import { formatDistance, CUISINE_LABELS } from '../api/stores';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

// Explains where the list came from, honestly.
function basisText(basis, store) {
  if (basis === 'cuisine') {
    return `Staples of ${CUISINE_LABELS[store.cuisine]} cooking that support the nutrients Brick'd scores. `;
  }
  if (basis === 'type') {
    return `Based on what ${store.type.toLowerCase()} stores typically carry. `;
  }
  return "Brick'd doesn't have a curated list for this store type yet, so here are our top-scoring foods overall. ";
}

export default function StoreDetailScreen({ route, navigation }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const { store } = route.params;
  const { foods, basis } = getFoodsForStore(store);

  return (
    <Screen>
      <FlatList
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
                {store.cuisine && (
                  <View style={[styles.typeChip, styles.cuisineChip]}>
                    <Text style={styles.cuisineText}>
                      {CUISINE_LABELS[store.cuisine]}
                    </Text>
                  </View>
                )}
                <Text style={styles.distance}>
                  {formatDistance(store.distanceKm)}
                </Text>
              </View>
              {store.address && (
                <Text style={styles.address}>{store.address}</Text>
              )}
              {store.openingHours && (
                <Text style={styles.hours}>{store.openingHours}</Text>
              )}
            </View>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerTitle}>
                Foods commonly found here
              </Text>
              <Text style={styles.disclaimerText}>
                {basisText(basis, store)}
                This isn't this store's real-time stock — no public data
                source provides that for most grocery stores.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Sorted by Brick'd Score</Text>
          </View>
        }
      />
    </Screen>
  );
}

function createStyles(t) {
  const { colors } = t;
  return StyleSheet.create({
    list: {
      paddingHorizontal: spacing.screen,
      // Extra room because the transparent nav header floats above.
      paddingTop: 48,
      paddingBottom: 40,
    },
    header: {
      paddingTop: 14,
      paddingBottom: 12,
    },
    storeName: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 10,
      gap: 8,
    },
    typeChip: {
      ...t.chip,
    },
    typeText: {
      ...t.chipText,
    },
    cuisineChip: {
      backgroundColor: colors.accentDim,
      borderColor: colors.accentBorder,
    },
    cuisineText: {
      ...t.chipText,
      color: colors.accent,
      fontWeight: '700',
    },
    distance: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    address: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 10,
    },
    hours: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 4,
    },
    disclaimer: {
      backgroundColor: colors.warnDim,
      borderColor: colors.warnBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      marginTop: 12,
      marginBottom: 20,
    },
    disclaimerTitle: {
      color: colors.warn,
      fontSize: 13,
      fontWeight: '800',
    },
    disclaimerText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 6,
      lineHeight: 18,
    },
    sectionTitle: {
      ...t.sectionLabel,
      marginBottom: 12,
    },
  });
}
