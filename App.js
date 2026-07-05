import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import FoodDetailScreen from './src/screens/FoodDetailScreen';
import StoresScreen from './src/screens/StoresScreen';
import StoreDetailScreen from './src/screens/StoreDetailScreen';
import ScanScreen from './src/screens/ScanScreen';
import SavedScreen from './src/screens/SavedScreen';
import { FavoritesProvider } from './src/store/favorites';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Match React Navigation's dark theme to Brick'd's palette.
const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    primary: colors.accent,
    border: colors.hairline,
  },
};

const detailScreenOptions = {
  title: '',
  headerBackTitle: 'Back',
  headerTransparent: true,
  headerTintColor: colors.text,
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
        options={detailScreenOptions}
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
        options={detailScreenOptions}
      />
    </Stack.Navigator>
  );
}

// Stores gets its own stack: store list -> store detail -> food detail.
function StoresStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="StoresList"
        component={StoresScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StoreDetail"
        component={StoreDetailScreen}
        options={detailScreenOptions}
      />
      <Stack.Screen
        name="FoodDetail"
        component={FoodDetailScreen}
        options={detailScreenOptions}
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
              tabBarStyle: {
                backgroundColor: colors.tabBar,
                borderTopColor: colors.hairline,
                borderTopWidth: 1,
                height: 62,
                paddingTop: 6,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.4,
              },
              tabBarActiveTintColor: colors.accent,
              tabBarInactiveTintColor: colors.textTertiary,
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={
                    focused
                      ? TAB_ICONS[route.name]
                      : `${TAB_ICONS[route.name]}-outline`
                  }
                  size={size - 2}
                  color={color}
                />
              ),
            })}
          >
            <Tab.Screen name="Foods" component={HomeStack} />
            <Tab.Screen name="Scan" component={ScanScreen} />
            <Tab.Screen name="Saved" component={SavedStack} />
            <Tab.Screen name="Stores" component={StoresStack} />
          </Tab.Navigator>
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
