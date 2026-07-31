import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';

// Circular glass back button for the transparent detail headers. The
// default bare chevron disappears against content (score rings, photos),
// so every pushed screen gets this instead.
export default function BackButton({ onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[
        styles.button,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
      ]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Nudge the chevron optically centered in the circle.
    paddingRight: 2,
  },
});
