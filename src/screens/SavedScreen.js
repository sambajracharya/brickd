import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../store/favorites';
import FoodCard from '../components/FoodCard';
import Screen from '../components/Screen';
import { colors, screenSubtitle, screenTitle, spacing } from '../theme';

export default function SavedScreen({ navigation }) {
  const { favorites } = useFavorites();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>
          Your go-to foods, ready for the next grocery run
        </Text>
      </View>

      <FlatList
        data={favorites}
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
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="heart-outline" size={38} color={colors.textTertiary} />
            <Text style={styles.emptyText}>
              Nothing saved yet. Tap the heart on any food to keep it here.
            </Text>
          </View>
        }
      />
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
  list: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
