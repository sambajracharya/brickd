import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useTheme } from '../store/theme';

// Web barcode scanner.
//
// iOS Safari has no BarcodeDetector API, so we decode frames in JS with
// ZXing. This works in Safari 15.1+ including installed (standalone)
// PWAs, which is how Brick'd runs on iPhone without a native build.
// Requires a secure context — fine on https and on localhost.
//
// This file renders real DOM elements rather than React Native views:
// Metro resolves *.web.js on web, where React DOM handles <video>.

const HINTS = new Map([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
    ],
  ],
]);

export default function BarcodeScanner({ onScanned, paused }) {
  const { colors, radius } = useTheme();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const pausedRef = useRef(paused);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(HINTS);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser cannot open the camera.');
        }
        const controls = await reader.decodeFromConstraints(
          // Rear camera on phones; falls back to any camera on desktop.
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (result) => {
            if (result && !pausedRef.current) onScanned(result.getText());
          }
        );
        if (cancelled) controls.stop();
        else {
          controlsRef.current = controls;
          setStarting(false);
        }
      } catch (e) {
        if (cancelled) return;
        setStarting(false);
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser settings, then reload.'
            : e?.message || 'Could not start the camera.'
        );
      }
    })();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {}
    };
  }, [onScanned]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 16 }}>
        <div style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.4 }}>
          {error}
        </div>
        <div style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>
          You can still type the barcode number below.
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          width: '100%',
          height: 260,
          objectFit: 'cover',
          borderRadius: radius.card,
          background: '#000',
        }}
      />
      <div
        style={{
          color: colors.textTertiary,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.4,
          marginTop: 12,
        }}
      >
        {starting ? 'STARTING CAMERA…' : 'CENTER THE BARCODE IN VIEW'}
      </div>
    </div>
  );
}
