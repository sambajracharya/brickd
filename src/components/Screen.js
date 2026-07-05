import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/theme';

// Every screen's outermost wrapper: themed base with a subtle wash from
// the top, plus safe-area padding so content never slides under the
// status bar / notch. Screens shown under a transparent nav header pass
// extra top padding themselves (see FoodDetailScreen).
export default function Screen({ children, style }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bg, colors.bg]}
      locations={[0, 0.45, 1]}
      style={[styles.fill, { paddingTop: insets.top }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
