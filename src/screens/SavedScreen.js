import { useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../store/favorites';
import FoodCard from '../components/FoodCard';
import Screen from '../components/Screen';
import { useShoppingChecks } from '../store/shoppingChecks';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

export default function SavedScreen({ navigation }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const { favorites } = useFavorites();
  // Shared with the store screen so ticks show up in both places.
  const { isChecked, toggleChecked, clearChecked, checkedCount } =
    useShoppingChecks();

  const anyChecked = checkedCount > 0;

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
          const ticked = isChecked(item.fdcId);
          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.checkTap}
                onPress={() => toggleChecked(item.fdcId)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={
                  ticked ? 'Mark as not bought' : 'Mark as bought'
                }
              >
                <Ionicons
                  name={ticked ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={ticked ? t.colors.accent : t.colors.textTertiary}
                />
              </TouchableOpacity>
              <View style={[styles.cardWrap, ticked && styles.cardChecked]}>
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
