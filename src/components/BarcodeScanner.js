import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../store/theme';

// Native barcode scanner (expo-camera). The web build resolves
// BarcodeScanner.web.js instead, which decodes with ZXing since iOS
// Safari has no BarcodeDetector API.
export default function BarcodeScanner({ onScanned, paused }) {
  const t = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    return (
      <View style={styles.box}>
        <Text style={[styles.text, { color: t.colors.textSecondary }]}>
          Brick'd needs camera access to scan barcodes.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: t.colors.accent }]}
          onPress={requestPermission}
        >
          <Text style={[styles.buttonText, { color: t.colors.onAccent }]}>
            Allow camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8'],
        }}
        onBarcodeScanned={paused ? undefined : ({ data }) => onScanned(data)}
      />
      <Text style={[styles.hint, { color: t.colors.textTertiary }]}>
        CENTER THE BARCODE IN VIEW
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center' },
  camera: { width: '100%', height: 260, borderRadius: 12, overflow: 'hidden' },
  hint: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 12 },
  text: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  button: {
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 14,
  },
  buttonText: { fontWeight: '800', fontSize: 14 },
});
