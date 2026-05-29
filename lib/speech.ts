'use client';

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export type RecognitionCallback = (transcript: string, isFinal: boolean) => void;

export function createSpeechRecognition(onResult: RecognitionCallback, onEnd: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition: any = new SpeechRecognitionAPI();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (e: any) => {
    const result = e.results[e.results.length - 1];
    const transcript = result[0].transcript;
    onResult(transcript, result.isFinal);
  };

  recognition.onend = onEnd;

  return recognition;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;

  speechSynthesis.cancel();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'en-US';
  currentUtterance.rate = 0.9;

  if (onEnd) currentUtterance.onend = onEnd;

  speechSynthesis.speak(currentUtterance);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && speechSynthesis.speaking;
}
