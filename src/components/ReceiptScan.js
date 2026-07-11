import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ocrImage, usingDemoKey } from '../api/ocr';
import { parseReceipt, cartSummary } from '../lib/receipt';
import FoodCard from './FoodCard';
import { useTheme } from '../store/theme';
import { spacing } from '../theme';

const CAMERA_SUPPORTED = Platform.OS !== 'web';

export default function ReceiptScan({ navigation }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [mode, setMode] = useState('idle'); // idle | manual | working | result | error
  const [workingStep, setWorkingStep] = useState('');
  const [manualText, setManualText] = useState('');
  const [result, setResult] = useState(null); // { matched, unmatched, summary }
  const [error, setError] = useState(null);
  const [showUnmatched, setShowUnmatched] = useState(false);

  const analyze = (text) => {
    const { matched, unmatched } = parseReceipt(text);
    setResult({ matched, unmatched, summary: cartSummary(matched) });
    setShowUnmatched(false);
    setMode('result');
  };

  const scanImage = async (fromCamera) => {
    try {
      // Permissions + picker
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
      }
      const picked = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
      if (picked.canceled || !picked.assets?.length) return;

      setMode('working');
      setWorkingStep('Preparing image...');

      // Downscale + compress so the OCR service accepts it (1MB limit).
      const prepared = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 1200 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      setWorkingStep('Reading the receipt...');
      const text = await ocrImage(prepared.base64);

      setWorkingStep('Matching foods...');
      analyze(text);
    } catch (e) {
      setError(e.message ?? 'Could not read the receipt.');
      setMode('error');
    }
  };

  const reset = () => {
    setMode('idle');
    setResult(null);
    setError(null);
    setManualText('');
  };

  const ring = result?.summary ? t.scoreColor(result.summary.avg) : t.colors.accent;

  return (
    <View>
      {mode === 'idle' && (
        <>
          <View style={styles.actionCard}>
            {CAMERA_SUPPORTED && (
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => scanImage(true)}
              >
                <Ionicons name="camera" size={18} color={t.colors.onAccent} />
                <Text style={styles.primaryActionText}>Snap a receipt</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => scanImage(false)}
            >
              <Ionicons name="image" size={16} color={t.colors.text} />
              <Text style={styles.secondaryActionText}>Choose a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('manual')}>
              <Text style={styles.manualLink}>Type items instead</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Brick'd reads your grocery receipt and scores the foods it
            recognizes.{' '}
            {usingDemoKey
              ? 'Currently using a shared demo OCR key — expect occasional slowdowns.'
              : ''}
          </Text>
        </>
      )}

      {mode === 'manual' && (
        <View style={styles.actionCard}>
          <TextInput
            style={styles.manualInput}
            placeholder={'One item per line, e.g.\nground beef\ngreek yogurt\neggs'}
            placeholderTextColor={t.colors.textTertiary}
            multiline
            numberOfLines={6}
            value={manualText}
            onChangeText={setManualText}
          />
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => manualText.trim() && analyze(manualText)}
          >
            <Text style={styles.primaryActionText}>Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reset}>
            <Text style={styles.manualLink}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'working' && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={t.colors.accent} />
          <Text style={styles.centerText}>{workingStep}</Text>
        </View>
      )}

      {mode === 'error' && (
        <View style={styles.centerBox}>
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.primaryAction} onPress={reset}>
            <Text style={styles.primaryActionText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'result' && result && (
        <View style={styles.resultWrap}>
          {result.summary ? (
            <View style={styles.cartHero}>
              <View style={[styles.cartRing, { borderColor: ring }]}>
                <Text style={styles.cartScore}>{result.summary.avg}</Text>
                <Text style={styles.cartOutOf}>avg</Text>
              </View>
              <Text style={styles.cartTitle}>Cart Score</Text>
              <Text style={styles.cartMeta}>
                {result.summary.count} food
                {result.summary.count === 1 ? '' : 's'} recognized
                {result.summary.flagged > 0
                  ? ` · ${result.summary.flagged} flagged`
                  : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.centerText}>
                No scoreable foods recognized on this receipt. Brick'd
                matches testosterone-relevant groceries — produce and
                pantry staples may not appear.
              </Text>
            </View>
          )}

          {result.matched.map(({ food }) => (
            <FoodCard
              key={food.fdcId}
              food={food}
              onPress={() =>
                navigation.navigate('FoodDetail', {
                  fdcId: food.fdcId,
                  name: food.name,
                  score: food.score,
                })
              }
            />
          ))}

          {result.unmatched.length > 0 && (
            <TouchableOpacity
              style={styles.unmatchedToggle}
              onPress={() => setShowUnmatched(!showUnmatched)}
            >
              <Text style={styles.unmatchedTitle}>
                Not recognized ({result.unmatched.length}){' '}
                {showUnmatched ? '▾' : '▸'}
              </Text>
            </TouchableOpacity>
          )}
          {showUnmatched &&
            result.unmatched.map((line, i) => (
              <Text key={i} style={styles.unmatchedLine}>
                {line}
              </Text>
            ))}

          <Text style={styles.resultNote}>
            OCR isn't perfect — crumpled receipts and unusual abbreviations
            can be missed. Scores are per 100g of each food, not your
            purchased amounts.
          </Text>

          <TouchableOpacity style={styles.primaryAction} onPress={reset}>
            <Text style={styles.primaryActionText}>Scan another receipt</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function createStyles(t) {
  const { colors } = t;
  return StyleSheet.create({
    actionCard: {
      ...t.glassCard,
      marginHorizontal: spacing.screen,
      marginBottom: 14,
    },
    primaryAction: {
      ...t.buttonPrimary,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 4,
    },
    primaryActionText: {
      ...t.buttonPrimaryText,
    },
    secondaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: t.radius.button,
      paddingVertical: 12,
      marginTop: 10,
      backgroundColor: colors.inputBg,
    },
    secondaryActionText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    manualLink: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 14,
    },
    manualInput: {
      ...t.input,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 12,
    },
    hint: {
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 17,
      marginHorizontal: spacing.screen + 8,
      textAlign: 'center',
    },
    centerBox: {
      alignItems: 'center',
      paddingHorizontal: 32,
      marginTop: 30,
      marginBottom: 10,
    },
    centerText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 20,
      marginBottom: 10,
    },
    cartHero: {
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 20,
    },
    cartRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.ringBg,
      marginBottom: 10,
    },
    cartScore: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -1,
    },
    cartOutOf: {
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: -2,
    },
    cartTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    cartMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },
    unmatchedToggle: {
      marginTop: 6,
      marginBottom: 4,
    },
    unmatchedTitle: {
      ...t.sectionLabel,
    },
    unmatchedLine: {
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 18,
    },
    resultNote: {
      color: colors.textTertiary,
      fontSize: 11,
      fontStyle: 'italic',
      lineHeight: 16,
      marginTop: 14,
      marginBottom: 4,
    },
    resultWrap: {
      paddingHorizontal: spacing.screen,
    },
  });
}
