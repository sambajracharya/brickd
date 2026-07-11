// Receipt image -> text, via OCR.space (free tier: 25k requests/month,
// no billing). Swappable by design: when Brick'd moves from Expo Go to
// a production build, this file changes to on-device ML Kit and nothing
// else in the app needs to know.
//
// Key lives in .env.local as EXPO_PUBLIC_OCR_SPACE_KEY (free signup at
// https://ocr.space/ocrapi). Falls back to OCR.space's public demo key,
// which is heavily rate-limited — fine for development only.
//
// Privacy note (for the eventual privacy policy): with this provider,
// receipt photos are sent to OCR.space for processing.

const OCR_URL = 'https://api.ocr.space/parse/image';
const API_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_KEY || 'helloworld';

// Surfaced in the UI so it's obvious when the shared demo key is in use.
export const usingDemoKey = API_KEY === 'helloworld';

// base64 JPEG (no data: prefix) -> recognized text
export async function ocrImage(base64) {
  const form = new FormData();
  form.append('apikey', API_KEY);
  form.append('base64Image', `data:image/jpeg;base64,${base64}`);
  form.append('language', 'eng');
  form.append('scale', 'true');
  form.append('OCREngine', '2'); // engine 2 handles receipts better

  const res = await fetch(OCR_URL, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`OCR service error: ${res.status}`);

  const data = await res.json();
  if (data.IsErroredOnProcessing) {
    const msg = Array.isArray(data.ErrorMessage)
      ? data.ErrorMessage[0]
      : data.ErrorMessage;
    throw new Error(msg || 'OCR failed to read the image.');
  }

  const text = (data.ParsedResults || [])
    .map((r) => r.ParsedText || '')
    .join('\n');
  if (!text.trim()) throw new Error('No text found in the image.');
  return text;
}
