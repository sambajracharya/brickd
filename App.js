import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
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
import ProfileScreen from './src/screens/ProfileScreen';
import { FavoritesProvider } from './src/store/favorites';
import { ThemeProvider, useTheme } from './src/store/theme';
import { AuthProvider } from './src/store/auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The Foods tab is a stack: food list -> food detail.
function HomeStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
        headerTintColor: colors.text,
        title: '',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
    </Stack.Navigator>
  );
}

// Saved gets its own stack so tapping a saved food opens details too.
function SavedStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
        headerTintColor: colors.text,
        title: '',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="SavedList"
        component={SavedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
    </Stack.Navigator>
  );
}

// Stores gets its own stack: store list -> store detail -> food detail.
function StoresStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
        headerTintColor: colors.text,
        title: '',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="StoresList"
        component={StoresScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Foods: 'nutrition',
  Scan: 'barcode',
  Saved: 'heart',
  Stores: 'storefront',
  Profile: 'person',
};

// Inside the providers so it can react to theme changes.
function AppShell() {
  const t = useTheme();
  const { colors, mode } = t;

  const navTheme = {
    ...(mode === 'light' ? DefaultTheme : DarkTheme),
    colors: {
      ...(mode === 'light' ? DefaultTheme.colors : DarkTheme.colors),
      background: colors.bg,
      card: colors.bg,
      text: colors.text,
      primary: colors.accent,
      border: colors.hairline,
    },
  };

  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <NavigationContainer theme={navTheme}>
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
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <AppShell />
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
