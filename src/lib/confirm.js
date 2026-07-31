import { Alert, Platform } from 'react-native';

// Cross-platform destructive confirmation. React Native's Alert is a
// no-op on web, so fall back to the browser dialog there.
export function confirmDestructive(title, message, onConfirm, confirmLabel = 'Delete') {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
