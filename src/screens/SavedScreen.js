import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../store/favorites';
import FoodCard from '../components/FoodCard';

export default function SavedScreen({ navigation }) {
  const { favorites } = useFavorites();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Foods</Text>
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
            <Ionicons name="heart-outline" size={40} color="#374151" />
            <Text style={styles.emptyText}>
              Nothing saved yet. Tap the heart on any food to keep it here.
            </Text>
          </View>
        }
      />
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
  list: {
    paddingHorizontal: 20,
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
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
