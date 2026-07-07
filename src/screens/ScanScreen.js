import { useCallback, useMemo, useState } from 'react';
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
import Screen from '../components/Screen';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

// Camera barcode scanning isn't supported on web — manual entry only.
const CAMERA_SUPPORTED = Platform.OS !== 'web';

export default function ScanScreen() {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
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

  const showCamera = CAMERA_SUPPORTED && permission?.granted && mode === 'idle';
  const ring = product ? t.scoreColor(product.score) : t.colors.accent;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan</Text>
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
            <Text style={styles.cameraHint}>CENTER THE BARCODE IN VIEW</Text>
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
              placeholder="Barcode number..."
              placeholderTextColor={t.colors.textTertiary}
              keyboardType="number-pad"
              value={manualCode}
              onChangeText={setManualCode}
              onSubmitEditing={() => manualCode.trim() && lookup(manualCode)}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => manualCode.trim() && lookup(manualCode)}
            >
              <Text style={styles.buttonText}>Look up</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'looking' && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={t.colors.accent} />
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
              <View style={[styles.scoreHalo, { shadowColor: ring }]}>
                <View style={[styles.scoreCircle, { borderColor: ring }]}>
                  <Text style={styles.scoreBig}>{product.score}</Text>
                  <Text style={styles.scoreOutOf}>/ 100</Text>
                </View>
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
            </View>

            {/* Warning flags — facts beside the score, never subtracted */}
            {product.flags.length > 0 && (
              <View style={styles.caveatBox}>
                <Text style={styles.caveatTitle}>Heads up</Text>
                {product.flags.map((f) => (
                  <Text key={f.key} style={styles.flagLine}>
                    {f.label} — {f.detail}
                  </Text>
                ))}
              </View>
            )}

            {/* Honesty first: how complete is the label data? */}
            {product.missing.length > 0 && (
              <View style={styles.caveatBox}>
                <Text style={styles.caveatTitle}>
                  Score based on {product.reportedCount} of{' '}
                  {product.totalCount} nutrients
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
                      {item.unit} / 100g
                    </Text>
                    <Text
                      style={[
                        styles.breakPoints,
                        {
                          color: t.scoreColor(
                            (item.points / item.maxPoints) * 100
                          ),
                        },
                      ]}
                    >
                      {item.points}/{item.maxPoints}
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
    </Screen>
  );
}

function createStyles(t) {
  const { colors } = t;
  return StyleSheet.create({
    content: {
      paddingBottom: 60,
    },
    header: {
      paddingTop: 18,
      paddingHorizontal: spacing.screen,
      paddingBottom: 18,
    },
    title: {
      ...t.screenTitle,
    },
    subtitle: {
      ...t.screenSubtitle,
    },
    cameraBox: {
      ...t.glassCard,
      marginHorizontal: spacing.screen,
      marginBottom: 16,
      alignItems: 'center',
    },
    camera: {
      width: '100%',
      height: 260,
      borderRadius: 12,
      overflow: 'hidden',
    },
    cameraHint: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginTop: 12,
    },
    manualRow: {
      flexDirection: 'row',
      marginHorizontal: spacing.screen,
      gap: 10,
      alignItems: 'center',
    },
    manualInput: {
      ...t.input,
      flex: 1,
    },
    centerBox: {
      alignItems: 'center',
      paddingHorizontal: 32,
      marginTop: 40,
    },
    centerText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 20,
    },
    button: {
      ...t.buttonPrimary,
      marginTop: 0,
      alignSelf: 'center',
      marginVertical: 8,
    },
    buttonText: {
      ...t.buttonPrimaryText,
    },
    resultHero: {
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 22,
      paddingHorizontal: spacing.screen,
    },
    scoreHalo: {
      shadowOpacity: 0.55,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 0 },
      elevation: 12,
      borderRadius: 56,
      marginBottom: 14,
    },
    scoreCircle: {
      width: 112,
      height: 112,
      borderRadius: 56,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.ringBg,
    },
    scoreBig: {
      color: colors.text,
      fontSize: 38,
      fontWeight: '800',
      letterSpacing: -1,
    },
    scoreOutOf: {
      color: colors.textTertiary,
      fontSize: 11,
      marginTop: -2,
    },
    productName: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    brand: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
    caveatBox: {
      ...t.warnBox,
      marginHorizontal: spacing.screen,
      marginBottom: 16,
    },
    caveatTitle: {
      color: colors.warn,
      fontSize: 13,
      fontWeight: '800',
    },
    caveatText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 6,
      lineHeight: 18,
    },
    flagLine: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 4,
    },
    sectionTitle: {
      ...t.sectionLabel,
      marginBottom: 10,
      marginHorizontal: spacing.screen,
    },
    cardBlock: {
      ...t.glassCard,
      marginHorizontal: spacing.screen,
      marginBottom: 14,
    },
    breakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    breakLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      flex: 1,
    },
    breakValue: {
      color: colors.textSecondary,
      fontSize: 12,
      marginRight: 12,
    },
    breakPoints: {
      fontSize: 12,
      fontWeight: '800',
      width: 44,
      textAlign: 'right',
    },
  });
}
