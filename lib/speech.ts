'use client';

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export type MicPermission = 'unknown' | 'granted' | 'denied' | 'unsupported';

export async function requestMicPermission(): Promise<MicPermission> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return 'unsupported';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return 'granted';
  } catch {
    return 'denied';
  }
}

export type RecognitionCallback = (transcript: string, isFinal: boolean) => void;
export type RecognitionErrorCallback = (error: string) => void;

export function createSpeechRecognition(
  onResult: RecognitionCallback,
  onEnd: () => void,
  onError?: RecognitionErrorCallback
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition: any = new SpeechRecognitionAPI();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false; // one phrase at a time — most reliable across browsers
  recognition.maxAlternatives = 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (e: any) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      const isFinal = e.results[i].isFinal;
      onResult(transcript, isFinal);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (e: any) => {
    const msg = e.error ?? 'unknown';
    // 'no-speech' is benign — user just didn't speak, restart silently
    if (msg !== 'no-speech') onError?.(msg);
    onEnd();
  };

  recognition.onend = onEnd;

  return recognition;
}

// ── Voice selection ────────────────────────────────────────────────────────────

let voiceCache: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const immediate = speechSynthesis.getVoices();
    if (immediate.length > 0) { voiceCache = immediate; return resolve(immediate); }
    const handler = () => {
      const v = speechSynthesis.getVoices();
      voiceCache = v;
      speechSynthesis.onvoiceschanged = null;
      resolve(v);
    };
    speechSynthesis.onvoiceschanged = handler;
    // Fallback: some browsers never fire the event
    setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
  });
}

function pickVoice(lang: 'en-US' | 'pt-BR', voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const prefix = lang === 'en-US' ? 'en' : 'pt';
  const matches = voices.filter(v => v.lang.toLowerCase().startsWith(prefix));

  // 1. Microsoft Online Natural (neural, best quality)
  const neural = matches.find(v => v.name.includes('Online') && v.name.includes('Natural'));
  if (neural) return neural;

  // 2. Microsoft (non-neural but still good on Windows)
  const microsoft = matches.find(v => v.name.toLowerCase().includes('microsoft'));
  if (microsoft) return microsoft;

  // 3. Google voices (Chrome on other OS)
  const google = matches.find(v => v.name.toLowerCase().includes('google'));
  if (google) return google;

  // 4. Any matching language
  return matches[0] ?? null;
}

// ── Language detection ─────────────────────────────────────────────────────────

const PT_PATTERN = /\b(você|voce|não|nao|que|para|com|uma|mas|seu|sua|por|isso|também|tambem|então|entao|muito|ainda|já|ja|aqui|agora|só|so|bem|mais|são|sao|foi|ser|ter|tem|quando|como|onde|quem|qual|porque|pois|porém|porem|cada|esse|essa|este|esta|eles|elas|nós|nos|meu|minha|nosso|nossa|dele|dela|aquele|aquela|novo|nova|grande|pequeno|bom|boa|ruim|certo|errado|precisa|falar|fazer|dizer|quero|quero|tenho|posso|devo|isso|aqui|tudo|nada|sempre|nunca|talvez|agora|depois|antes|hoje|amanhã|amanha|ontem|semana|mês|mes|ano|dia|hora|minuto|vez|vezes)\b/i;

function detectLang(text: string): 'en-US' | 'pt-BR' {
  return PT_PATTERN.test(text) ? 'pt-BR' : 'en-US';
}

// Split text into sentences, group consecutive same-language sentences together
function segmentByLang(text: string): Array<{ text: string; lang: 'en-US' | 'pt-BR' }> {
  // Split on sentence-ending punctuation while keeping the punctuation
  const raw = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  const segments: Array<{ text: string; lang: 'en-US' | 'pt-BR' }> = [];

  for (const chunk of raw) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const lang = detectLang(trimmed);
    const last = segments[segments.length - 1];
    if (last && last.lang === lang) {
      last.text += ' ' + trimmed;
    } else {
      segments.push({ text: trimmed, lang });
    }
  }

  return segments.length > 0 ? segments : [{ text, lang: detectLang(text) }];
}

// ── Public speak API ───────────────────────────────────────────────────────────

export async function speak(text: string, onEnd?: () => void): Promise<void> {
  if (!isSpeechSynthesisSupported()) return;

  speechSynthesis.cancel();

  const voices = voiceCache ?? await loadVoices();
  const segments = segmentByLang(text);

  segments.forEach(({ text: segText, lang }, i) => {
    const utt = new SpeechSynthesisUtterance(segText);
    utt.lang = lang;
    utt.rate = lang === 'pt-BR' ? 1.08 : 0.92;
    utt.pitch = 1;

    const voice = pickVoice(lang, voices);
    if (voice) utt.voice = voice;

    if (i === segments.length - 1 && onEnd) {
      utt.onend = onEnd;
    }

    speechSynthesis.speak(utt);
  });
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && speechSynthesis.speaking;
}
