import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCuisineFoods } from '../data/curatedFoods';
import { cartGaps, getFoodById } from '../lib/receipt';
import { loadHistory, formatHaulDate } from '../lib/history';
import FoodCard from '../components/FoodCard';
import Screen from '../components/Screen';
import { formatDistance, CUISINE_LABELS } from '../api/stores';
import { useAuth } from '../store/auth';
import { useFavorites } from '../store/favorites';
import { useShoppingChecks } from '../store/shoppingChecks';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

// This screen deliberately does NOT claim to know a store's inventory —
// no public data source provides that for most grocers. Instead it's a
// shopping companion for the moment you're standing inside: your saved
// list, the nutrient gaps from your last haul, and (where the store's
// name reveals a cuisine) staples worth looking for.
export default function StoreDetailScreen({ route, navigation }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const { store } = route.params;
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const { favorites } = useFavorites();
  const { isChecked, toggleChecked } = useShoppingChecks();
  const [gaps, setGaps] = useState(null);
  const [lastHaul, setLastHaul] = useState(null);

  const cuisineFoods = getCuisineFoods(store.cuisine);

  // Gaps come from the most recent receipt scan.
  useEffect(() => {
    let cancelled = false;
    loadHistory(uid).then((history) => {
      if (cancelled || history.length === 0) return;
      const recent = history[0];
      const matched = (recent.foodIds || [])
        .map((id) => getFoodById(id))
        .filter(Boolean)
        .map((food) => ({ food }));
      if (matched.length === 0) return;
      setLastHaul(recent);
      setGaps(cartGaps(matched));
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const openDirections = () => {
    const label = encodeURIComponent(store.name);
    const hasCoords = store.lat != null && store.lon != null;
    const url = hasCoords
      ? Platform.select({
          ios: `maps:0,0?q=${label}@${store.lat},${store.lon}`,
          android: `geo:0,0?q=${store.lat},${store.lon}(${label})`,
          default: `https://www.google.com/maps/search/?api=1&query=${store.lat}%2C${store.lon}`,
        })
      : `https://www.google.com/maps/search/?api=1&query=${label}`;
    Linking.openURL(url).catch(() => {});
  };

  const openFood = (food) =>
    navigation.navigate('FoodDetail', {
      fdcId: food.fdcId,
      name: food.name,
      score: food.score,
    });

  const remaining = favorites.filter((f) => !isChecked(f.fdcId)).length;

  // One flat list: saved items first (checkable), then gap suggestions,
  // then cuisine staples — each section labelled.
  const sections = [];
  favorites.forEach((f) => sections.push({ kind: 'saved', food: f }));
  if (gaps?.suggestions?.length) {
    gaps.suggestions.forEach((f) => sections.push({ kind: 'gap', food: f }));
  }
  cuisineFoods.forEach((f) => sections.push({ kind: 'cuisine', food: f }));

  const firstOf = (kind) => sections.findIndex((s) => s.kind === kind);
  const firstSaved = firstOf('saved');
  const firstGap = firstOf('gap');
  const firstCuisine = firstOf('cuisine');

  const renderItem = ({ item, index }) => (
    <View>
      {index === firstSaved && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>
            Your list · {remaining} to get
          </Text>
          <Text style={styles.sectionNote}>
            Tick items off as they go in the cart.
          </Text>
        </View>
      )}
      {index === firstGap && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Fill your gaps</Text>
          <Text style={styles.sectionNote}>
            Your haul from {formatHaulDate(lastHaul.ts)} was light on{' '}
            <Text style={styles.gapsWeak}>{gaps.weak.join(', ')}</Text>. Worth
            looking for here:
          </Text>
        </View>
      )}
      {index === firstCuisine && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>
            {CUISINE_LABELS[store.cuisine]} staples
          </Text>
          <Text style={styles.sectionNote}>
            Ingredients this kind of store is known for that support the
            nutrients Brick'd scores.
          </Text>
        </View>
      )}

      {item.kind === 'saved' ? (
        <View style={styles.savedRow}>
          <TouchableOpacity
            onPress={() => toggleChecked(item.food.fdcId)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={
              isChecked(item.food.fdcId) ? 'Mark as not bought' : 'Mark as bought'
            }
            style={styles.checkTap}
          >
            <Ionicons
              name={
                isChecked(item.food.fdcId)
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={26}
              color={
                isChecked(item.food.fdcId)
                  ? t.colors.accent
                  : t.colors.textTertiary
              }
            />
          </TouchableOpacity>
          <View
            style={[
              styles.savedCard,
              isChecked(item.food.fdcId) && styles.cardChecked,
            ]}
          >
            <FoodCard food={item.food} onPress={() => openFood(item.food)} />
          </View>
        </View>
      ) : (
        <FoodCard food={item.food} onPress={() => openFood(item.food)} />
      )}
    </View>
  );

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={sections}
        keyExtractor={(item, i) => `${item.kind}-${item.food.fdcId}-${i}`}
        renderItem={renderItem}
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
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={openDirections}
              >
                <Ionicons name="navigate" size={14} color={t.colors.onAccent} />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="basket-outline"
              size={36}
              color={t.colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              Nothing on your list yet. Save foods with the heart, or scan a
              receipt — Brick'd will show what to look for here.
            </Text>
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
      // Room for the transparent nav header.
      paddingTop: 48,
      paddingBottom: 40,
      flexGrow: 1,
    },
    header: {
      paddingTop: 14,
      paddingBottom: 22,
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
    directionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      borderRadius: t.radius.button,
      paddingHorizontal: 16,
      paddingVertical: 9,
      marginTop: 14,
    },
    directionsText: {
      color: colors.onAccent,
      fontSize: 13,
      fontWeight: '800',
    },
    sectionBlock: {
      marginBottom: 12,
    },
    sectionTitle: {
      ...t.sectionLabel,
      marginBottom: 6,
    },
    sectionNote: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
    gapsWeak: {
      color: colors.warn,
      fontWeight: '700',
    },
    savedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    checkTap: {
      paddingBottom: 12,
    },
    savedCard: {
      flex: 1,
    },
    cardChecked: {
      opacity: 0.45,
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      marginTop: 30,
    },
    emptyText: {
      color: colors.textTertiary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 20,
    },
  });
}
