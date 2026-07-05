import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import FoodDetailScreen from './src/screens/FoodDetailScreen';
import StoresScreen from './src/screens/StoresScreen';
import ScanScreen from './src/screens/ScanScreen';
import SavedScreen from './src/screens/SavedScreen';
import { FavoritesProvider } from './src/store/favorites';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Match React Navigation's dark theme to Brick'd's palette.
const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#111827',
    card: '#111827',
    text: '#f9fafb',
    primary: '#22c55e',
  },
};

// The Foods tab is a stack: food list -> food detail.
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodDetail"
        component={FoodDetailScreen}
        options={{ title: '', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

// Saved gets its own stack so tapping a saved food opens details too.
function SavedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SavedList"
        component={SavedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodDetail"
        component={FoodDetailScreen}
        options={{ title: '', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Foods: 'nutrition',
  Scan: 'barcode',
  Saved: 'heart',
  Stores: 'storefront',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={theme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: { backgroundColor: '#1f2937', borderTopColor: '#374151' },
              tabBarActiveTintColor: '#22c55e',
              tabBarInactiveTintColor: '#6b7280',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
              ),
            })}
          >
            <Tab.Screen name="Foods" component={HomeStack} />
            <Tab.Screen name="Scan" component={ScanScreen} />
            <Tab.Screen name="Saved" component={SavedStack} />
            <Tab.Screen name="Stores" component={StoresScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
