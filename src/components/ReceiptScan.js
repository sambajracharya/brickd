import { useEffect, useMemo, useState } from 'react';
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
import {
  parseReceipt,
  cartSummary,
  cartGaps,
  getFoodById,
} from '../lib/receipt';
import { loadHistory, addHistoryEntry, formatHaulDate } from '../lib/history';
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
  const [result, setResult] = useState(null); // { matched, unmatched, summary, gaps, delta, pastDate? }
  const [error, setError] = useState(null);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const analyze = async (text) => {
    const { matched, unmatched } = parseReceipt(text);
    const summary = cartSummary(matched);
    const gaps = summary ? cartGaps(matched) : { weak: [], suggestions: [] };
    // Compare against the previous haul, then remember this one.
    let delta = null;
    if (summary) {
      const prev = history[0];
      if (prev) delta = summary.avg - prev.avg;
      const entry = {
        ts: Date.now(),
        avg: summary.avg,
        count: summary.count,
        flagged: summary.flagged,
        foodIds: matched.map((m) => m.food.fdcId),
        unmatched: unmatched.slice(0, 20),
      };
      const next = await addHistoryEntry(entry, history);
      setHistory(next);
    }
    setResult({ matched, unmatched, summary, gaps, delta });
    setShowUnmatched(false);
    setMode('result');
  };

  // Reopen a saved haul (read-only view; nothing re-saved).
  const viewPast = (entry) => {
    const matched = entry.foodIds
      .map((id) => getFoodById(id))
      .filter(Boolean)
      .map((food) => ({ food, raw: '' }));
    setResult({
      matched,
      unmatched: entry.unmatched || [],
      summary: { avg: entry.avg, count: entry.count, flagged: entry.flagged },
      gaps: cartGaps(matched),
      delta: null,
      pastDate: formatHaulDate(entry.ts),
    });
    setShowUnmatched(false);
    setMode('result');
  };

  const scanImage = async (fromCamera) => {
    try {
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
      await analyze(text);
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

  const ring = result?.summary
    ? t.scoreColor(result.summary.avg)
    : t.colors.accent;

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

          {history.length > 0 && (
            <View style={styles.historyBlock}>
              <Text style={styles.sectionTitle}>Past hauls</Text>
              {history.length > 1 && (
                <Text style={styles.trendLine}>
                  {[...history]
                    .slice(0, 5)
                    .reverse()
                    .map((h) => h.avg)
                    .join('  →  ')}
                </Text>
              )}
              {history.slice(0, 8).map((h) => (
                <TouchableOpacity
                  key={h.ts}
                  style={styles.historyRow}
                  onPress={() => viewPast(h)}
                >
                  <View
                    style={[
                      styles.historyRing,
                      { borderColor: t.scoreColor(h.avg) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyRingText,
                        { color: t.scoreColor(h.avg) },
                      ]}
                    >
                      {h.avg}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>
                      {formatHaulDate(h.ts)}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {h.count} food{h.count === 1 ? '' : 's'}
                      {h.flagged > 0 ? ` · ${h.flagged} flagged` : ''}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={t.colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
          {result.pastDate && (
            <Text style={styles.pastLabel}>
              Haul from {result.pastDate}
            </Text>
          )}

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
              {result.delta !== null && result.delta !== 0 && (
                <View
                  style={[
                    styles.deltaBadge,
                    {
                      backgroundColor:
                        result.delta > 0
                          ? t.colors.accentDim
                          : t.colors.warnDim,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.deltaText,
                      {
                        color:
                          result.delta > 0 ? t.colors.accent : t.colors.warn,
                      },
                    ]}
                  >
                    {result.delta > 0 ? '▲' : '▼'} {Math.abs(result.delta)} vs
                    your last haul
                  </Text>
                </View>
              )}
              {result.delta === 0 && (
                <Text style={styles.cartMeta}>— same as your last haul</Text>
              )}
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

          {/* The prescription: what this haul is missing, and what fixes it */}
          {result.gaps && result.gaps.suggestions.length > 0 && (
            <>
              <View style={styles.gapsHeader}>
                <Text style={styles.sectionTitle}>Fill your gaps</Text>
                <Text style={styles.gapsText}>
                  This haul is light on{' '}
                  <Text style={styles.gapsWeak}>
                    {result.gaps.weak.join(', ')}
                  </Text>
                  . Next trip, consider:
                </Text>
              </View>
              {result.gaps.suggestions.map((food) => (
                <FoodCard
                  key={`gap-${food.fdcId}`}
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
            </>
          )}

          {result.matched.length > 0 && (
            <Text style={styles.sectionTitle}>This haul</Text>
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
            <Text style={styles.primaryActionText}>
              {result.pastDate ? 'Back to scanner' : 'Scan another receipt'}
            </Text>
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
    sectionTitle: {
      ...t.sectionLabel,
      marginBottom: 10,
    },
    historyBlock: {
      marginTop: 22,
      marginHorizontal: spacing.screen,
    },
    trendLine: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    historyRow: {
      ...t.glassCard,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      marginBottom: 10,
    },
    historyRing: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.ringBg,
    },
    historyRingText: {
      fontSize: 14,
      fontWeight: '800',
    },
    historyDate: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    historyMeta: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 2,
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
    deltaBadge: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
      marginTop: 10,
    },
    deltaText: {
      fontSize: 13,
      fontWeight: '800',
    },
    pastLabel: {
      ...t.sectionLabel,
      textAlign: 'center',
      marginBottom: 12,
    },
    gapsHeader: {
      marginBottom: 12,
    },
    gapsText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    gapsWeak: {
      color: colors.warn,
      fontWeight: '700',
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
