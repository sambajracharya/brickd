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

// The Home tab is a stack: food list -> food detail.
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

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={theme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: '#1f2937', borderTopColor: '#374151' },
            tabBarActiveTintColor: '#22c55e',
            tabBarInactiveTintColor: '#6b7280',
            tabBarIcon: ({ color, size }) => {
              const icons = { Foods: 'nutrition', Scan: 'barcode', Stores: 'storefront' };
              return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Foods" component={HomeStack} />
          <Tab.Screen name="Scan" component={ScanScreen} />
          <Tab.Screen name="Stores" component={StoresScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
