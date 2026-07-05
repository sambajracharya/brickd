import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { lookupBarcode } from '../api/openfoodfacts';
import { RESEARCH_NOTES } from '../api/usda';

function scoreColor(score) {
  if (score >= 60) return '#22c55e';
  if (score >= 30) return '#eab308';
  return '#f97316';
}

// Camera barcode scanning isn't supported on web — manual entry only.
const CAMERA_SUPPORTED = Platform.OS !== 'web';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('idle'); // idle | looking | result | notfound | error
  const [product, setProduct] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [paused, setPaused] = useState(false); // stops repeat scans of same code

  const lookup = useCallback(async (barcode) => {
    setMode('looking');
    try {
      const found = await lookupBarcode(barcode.trim());
      if (found) {
        setProduct(found);
        setMode('result');
      } else {
        setMode('notfound');
      }
    } catch (e) {
      setMode('error');
    }
  }, []);

  const onBarcodeScanned = useCallback(
    ({ data }) => {
      if (paused) return;
      setPaused(true);
      lookup(data);
    },
    [paused, lookup]
  );

  const reset = () => {
    setProduct(null);
    setManualCode('');
    setPaused(false);
    setMode('idle');
  };

  const showCamera =
    CAMERA_SUPPORTED && permission?.granted && mode === 'idle';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan a Product</Text>
        <Text style={styles.subtitle}>
          Point at a barcode, or type it below
        </Text>
      </View>

      {/* Camera area (native only) */}
      {CAMERA_SUPPORTED && mode === 'idle' && !permission?.granted && (
        <View style={styles.cameraBox}>
          <Text style={styles.centerText}>
            Brick'd needs camera access to scan barcodes.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Allow camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCamera && (
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8'],
            }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <Text style={styles.cameraHint}>Center the barcode in view</Text>
        </View>
      )}

      {!CAMERA_SUPPORTED && mode === 'idle' && (
        <View style={styles.cameraBox}>
          <Text style={styles.centerText}>
            Camera scanning works on your phone. On web, enter the barcode
            number manually below.
          </Text>
        </View>
      )}

      {/* Manual entry */}
      {mode === 'idle' && (
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="Barcode number, e.g. 737628064502"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={() => manualCode.trim() && lookup(manualCode)}
          />
          <TouchableOpacity
            style={[styles.button, styles.lookupButton]}
            onPress={() => manualCode.trim() && lookup(manualCode)}
          >
            <Text style={styles.buttonText}>Look up</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'looking' && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.centerText}>Looking up product...</Text>
        </View>
      )}

      {mode === 'notfound' && (
        <View style={styles.centerBox}>
          <Text style={styles.centerText}>
            This barcode isn't in the Open Food Facts database yet. Try a
            different product.
          </Text>
          <TouchableOpacity style={styles.button} onPress={reset}>
            <Text style={styles.buttonText}>Scan another</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'error' && (
        <View style={styles.centerBox}>
          <Text style={styles.centerText}>
            Could not look up the product. Check your connection.
          </Text>
          <TouchableOpacity style={styles.button} onPress={reset}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result */}
      {mode === 'result' && product && (
        <>
          <View style={styles.resultHero}>
            <View
              style={[
                styles.scoreCircle,
                { borderColor: scoreColor(product.score) },
              ]}
            >
              <Text style={styles.scoreBig}>{product.score}</Text>
              <Text style={styles.scoreOutOf}>/ 100</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && (
              <Text style={styles.brand}>{product.brand}</Text>
            )}
          </View>

          {/* Honesty first: how complete is the label data? */}
          {product.missing.length > 0 && (
            <View style={styles.caveatBox}>
              <Text style={styles.caveatTitle}>
                Score based on {product.reportedCount} of {product.totalCount}{' '}
                nutrients
              </Text>
              <Text style={styles.caveatText}>
                This label doesn't report: {product.missing.join(', ')}. The
                real score could be higher — packaged foods only list what
                regulations require.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Reported nutrients</Text>
          <View style={styles.cardBlock}>
            {product.breakdown
              .filter((item) => item.points > 0)
              .map((item) => (
                <View key={item.key} style={styles.breakRow}>
                  <Text style={styles.breakLabel}>{item.label}</Text>
                  <Text style={styles.breakValue}>
                    {item.value}
                    {item.unit} per 100g
                  </Text>
                  <Text style={styles.breakPoints}>
                    {item.points}/{item.maxPoints} pts
                  </Text>
                </View>
              ))}
            {product.breakdown.every((i) => i.points === 0) && (
              <Text style={styles.centerText}>
                No testosterone-relevant nutrients reported on this label.
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.button} onPress={reset}>
            <Text style={styles.buttonText}>Scan another</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    paddingBottom: 60,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  cameraBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: '#1f2937',
    padding: 16,
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: 260,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cameraHint: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 10,
  },
  manualRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
  },
  lookupButton: {
    marginTop: 0,
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  centerText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 14,
  },
  resultHero: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreBig: {
    color: '#f9fafb',
    fontSize: 36,
    fontWeight: '900',
  },
  scoreOutOf: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: -4,
  },
  productName: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  brand: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  caveatBox: {
    backgroundColor: '#78350f22',
    borderColor: '#a16207',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
  },
  caveatTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
  },
  caveatText: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  cardBlock: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakLabel: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  breakValue: {
    color: '#9ca3af',
    fontSize: 12,
    marginRight: 10,
  },
  breakPoints: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
    width: 60,
    textAlign: 'right',
  },
});
