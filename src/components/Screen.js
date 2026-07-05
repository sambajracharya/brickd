import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Every screen's outermost wrapper: near-black base with a subtle
// blue-tinted wash from the top, so glass cards have depth to sit on.
export default function Screen({ children, style }) {
  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bg, colors.bg]}
      locations={[0, 0.45, 1]}
      style={[styles.fill, style]}
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
