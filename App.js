import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import FoodDetailScreen from './src/screens/FoodDetailScreen';

const Stack = createNativeStackNavigator();

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

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={theme}>
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
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
