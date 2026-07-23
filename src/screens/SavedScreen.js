import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavorites } from '../store/favorites';
import FoodCard from '../components/FoodCard';
import Screen from '../components/Screen';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

// In-store check-offs live on the device (they're transient shopping
// state, not account data).
const CHECKED_KEY = 'brickd:saved-checked';

export default function SavedScreen({ navigation }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const { favorites } = useFavorites();
  const [checked, setChecked] = useState({});

  useEffect(() => {
    AsyncStorage.getItem(CHECKED_KEY)
      .then((json) => json && setChecked(JSON.parse(json)))
      .catch(() => {});
  }, []);

  const toggleChecked = (fdcId) => {
    setChecked((prev) => {
      const next = { ...prev, [fdcId]: !prev[fdcId] };
      if (!next[fdcId]) delete next[fdcId];
      AsyncStorage.setItem(CHECKED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clearChecked = () => {
    setChecked({});
    AsyncStorage.removeItem(CHECKED_KEY).catch(() => {});
  };

  const anyChecked = Object.keys(checked).length > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>
          Your shopping list — check items off as you shop
        </Text>
        {anyChecked && (
          <TouchableOpacity onPress={clearChecked}>
            <Text style={styles.clearLink}>Uncheck all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.fdcId)}
        renderItem={({ item }) => {
          const isChecked = !!checked[item.fdcId];
          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.checkTap}
                onPress={() => toggleChecked(item.fdcId)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={
                  isChecked ? 'Mark as not bought' : 'Mark as bought'
                }
              >
                <Ionicons
                  name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={isChecked ? t.colors.accent : t.colors.textTertiary}
                />
              </TouchableOpacity>
              <View style={[styles.cardWrap, isChecked && styles.cardChecked]}>
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
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="heart-outline"
              size={38}
              color={t.colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              Nothing saved yet. Tap the heart on any food to build your
              shopping list.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function createStyles(t) {
  return StyleSheet.create({
    header: {
      paddingTop: 18,
      paddingHorizontal: spacing.screen,
      paddingBottom: 18,
    },
    title: {
      ...t.screenTitle,
    },
    subtitle: {
      ...t.screenSubtitle,
    },
    clearLink: {
      color: t.colors.accent,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 8,
    },
    list: {
      paddingHorizontal: spacing.screen,
      paddingBottom: 40,
      flexGrow: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    checkTap: {
      paddingBottom: 12, // visually centers against the card's margin
    },
    cardWrap: {
      flex: 1,
    },
    cardChecked: {
      opacity: 0.45,
    },
    emptyBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      color: t.colors.textTertiary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 20,
    },
  });
}
