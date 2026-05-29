'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { buildSystemPrompt, buildIntroPrompt, parseAIResponse } from '@/lib/prompts';
import { SCENARIOS } from '@/lib/scenarios';
import { CEFRLevel } from '@/lib/levels';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognition,
  speak,
  stopSpeaking,
  requestMicPermission,
  MicPermission,
} from '@/lib/speech';
import {
  playMessageSent,
  playMessageReceived,
  playScenarioStart,
  playEndSession,
  playLevelUp,
  playAchievement,
} from '@/lib/sounds';
import ScenarioCard from '@/components/ScenarioCard';
import ScenarioStartModal from '@/components/ScenarioStartModal';
import ChatBubble from '@/components/ChatBubble';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import SummaryModal from '@/components/SummaryModal';
import { Mic, Send, X, Volume2, VolumeX } from 'lucide-react';

const MAX_MESSAGES = 30;

export default function PracticePage() {
  const router = useRouter();
  const store = useStore();
  const {
    user, currentSession, setScenario, addMessage, addWords,
    markUsedPortuguese, levelUpPending, clearLevelUp,
    resetSession, endSession, unlockAchievement, achievements,
  } = store;

  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [muted, setMuted] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');
  const [showMicPrompt, setShowMicPrompt] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTranscriptRef = useRef('');
  const introSentRef = useRef(false);
  const mutedRef = useRef(false);

  const speechSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  // Keep mutedRef in sync so callbacks always see latest value
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => { if (!user) router.replace('/'); }, [user, router]);

  // Reset to scenario grid if session was ended before navigating away
  useEffect(() => {
    if (currentSession.sessionEnded) resetSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check existing mic permission on mount (no prompt yet)
  useEffect(() => {
    if (!speechSupported) { setMicPermission('unsupported'); return; }
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then(result => {
        if (result.state === 'granted') setMicPermission('granted');
        else if (result.state === 'denied') setMicPermission('denied');
      })
      .catch(() => {}); // browser may not support permissions API
  }, [speechSupported]);

  // Timer
  useEffect(() => {
    if (!currentSession.scenarioId || currentSession.sessionEnded) return;
    timerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentSession.scenarioId, currentSession.sessionEnded]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages, loading]);

  // Level up sound
  useEffect(() => { if (levelUpPending) playLevelUp(); }, [levelUpPending]);

  const autoSpeak = useCallback((text: string, index: number, onEnd?: () => void) => {
    if (!ttsSupported || mutedRef.current) return;
    setPlayingIndex(index);
    void speak(text, () => { setPlayingIndex(null); onEnd?.(); });
  }, [ttsSupported]);

  // AI intro when scenario starts
  const sendIntro = useCallback(async () => {
    if (!user || introSentRef.current) return;
    introSentRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: buildIntroPrompt(store),
          messages: [{ role: 'user', content: 'start' }],
        }),
      });
      const data = await res.json();
      const { reply } = parseAIResponse(data.text ?? '');
      addMessage({ role: 'assistant', content: reply });
      playMessageReceived();
      // index 0 — intro is always the first message
      autoSpeak(reply, 0);
    } catch {
      addMessage({ role: 'assistant', content: '(Erro ao conectar. Tente novamente.)' });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, store, autoSpeak]);

  useEffect(() => {
    if (currentSession.scenarioId && currentSession.messages.length === 0) {
      introSentRef.current = false;
      sendIntro();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession.scenarioId]);

  function formatTimer(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !user || loading) return;
    if (currentSession.messageCount >= MAX_MESSAGES) return;

    const userMsg = { role: 'user' as const, content: text.trim() };
    addMessage(userMsg);
    setInput('');
    setLoading(true);
    playMessageSent();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(store),
          messages: [...currentSession.messages, userMsg],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { reply, meta } = parseAIResponse(data.text);
      addMessage({ role: 'assistant', content: reply });
      playMessageReceived();

      // auto-speak: index = messages.length after adding (user + assistant = +2)
      const replyIndex = currentSession.messages.length + 1;
      autoSpeak(reply, replyIndex);

      if (meta.newWords?.length > 0) addWords(meta.newWords);
      if (meta.usedPortuguese) markUsedPortuguese();
    } catch {
      addMessage({ role: 'assistant', content: '(Erro ao conectar com a IA. Tente novamente.)' });
    } finally {
      setLoading(false);
    }
  }, [user, loading, currentSession, addMessage, addWords, markUsedPortuguese, store, autoSpeak]);

  function handleSend() { sendMessage(input); }
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function stopListening() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function handleMic() {
    // Toggle off
    if (isListening) { stopListening(); return; }
    if (!speechSupported) return;

    // Request permission if not yet granted
    if (micPermission !== 'granted') {
      setShowMicPrompt(true);
      const result = await requestMicPermission();
      setMicPermission(result);
      setShowMicPrompt(false);
      if (result !== 'granted') return;
    }

    stopSpeaking();
    setPlayingIndex(null);
    setInput('');
    currentTranscriptRef.current = '';

    recognitionRef.current = createSpeechRecognition(
      (transcript, isFinal) => {
        currentTranscriptRef.current = transcript;
        setInput(transcript);
        // Auto-send on final result from browser
        if (isFinal && transcript.trim()) {
          stopListening();
          sendMessage(transcript.trim());
          setInput('');
          currentTranscriptRef.current = '';
        }
      },
      () => { setIsListening(false); }
    );
    recognitionRef.current?.start();
    setIsListening(true);
  }

  function handlePlayAudio(content: string, index: number) {
    if (playingIndex === index) { stopSpeaking(); setPlayingIndex(null); return; }
    setPlayingIndex(index);
    void speak(content, () => setPlayingIndex(null));
  }

  function handleMuteToggle() {
    const next = !muted;
    setMuted(next);
    if (next) stopSpeaking();
  }

  function handleEnd() {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    endSession();
    playEndSession();
    setShowSummary(true);
  }

  function handleContinue() {
    setShowSummary(false);
    setSessionSeconds(0);
    introSentRef.current = false;
    resetSession();
  }

  function handleStartScenario(difficulty: CEFRLevel) {
    if (!selectedScenarioId) return;
    setSelectedScenarioId(null);
    setSessionSeconds(0);
    introSentRef.current = false;
    setScenario(selectedScenarioId, difficulty);
    playScenarioStart();
  }

  function handleAchievementUnlock(id: string) { unlockAchievement(id); playAchievement(); }

  if (!user) return null;

  // ── Scenario selection ──────────────────────────────────────────────────────
  if (!currentSession.scenarioId) {
    const pendingScenario = selectedScenarioId ? SCENARIOS.find(s => s.id === selectedScenarioId) : null;
    return (
      <div className="h-full flex flex-col bg-white relative">
        <div className="px-5 pt-6 pb-3">
          <h2 className="text-xl font-extrabold text-gray-800">Pratique</h2>
          <p className="text-sm text-gray-500">Escolha um cenário para começar</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {SCENARIOS.map(s => (
              <ScenarioCard key={s.id} scenario={s} onSelect={() => setSelectedScenarioId(s.id)} />
            ))}
          </div>
        </div>
        {pendingScenario && (
          <ScenarioStartModal
            scenario={pendingScenario}
            defaultDifficulty={user.level}
            onStart={handleStartScenario}
            onClose={() => setSelectedScenarioId(null)}
          />
        )}
      </div>
    );
  }

  // ── Active chat ─────────────────────────────────────────────────────────────
  const scenario = SCENARIOS.find(s => s.id === currentSession.scenarioId)!;
  const atLimit = currentSession.messageCount >= MAX_MESSAGES;

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white shrink-0 z-10">
        <span className="text-xl">{scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{scenario.name}</p>
          <p className="text-xs text-gray-400">{formatTimer(sessionSeconds)} · {currentSession.chosenDifficulty}</p>
        </div>

        {/* Mute button */}
        {ttsSupported && (
          <button
            onClick={handleMuteToggle}
            className={`p-2 rounded-full transition-colors ${
              muted ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-[#58CC02]'
            }`}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
            title={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}

        {/* End button */}
        <button
          onClick={handleEnd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-xs font-bold shrink-0"
        >
          <X size={13} />
          Encerrar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {currentSession.messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            onPlayAudio={msg.role === 'assistant' && ttsSupported ? () => handlePlayAudio(msg.content, i) : undefined}
            isPlaying={playingIndex === i}
          />
        ))}

        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
              <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
              <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
              <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
            </div>
          </div>
        )}

        {atLimit && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 bg-gray-50 rounded-2xl px-4 py-3">
              🎉 Você atingiu o limite da demonstração!<br />
              <span className="text-xs">Encerre a sessão para ver seu resumo.</span>
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mic permission prompt overlay */}
      {showMicPrompt && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 text-center space-y-3 shadow-2xl">
            <div className="text-4xl">🎤</div>
            <p className="font-extrabold text-gray-800">Permitir microfone</p>
            <p className="text-sm text-gray-500">
              O browser vai pedir permissão para usar seu microfone.<br />
              Clique em <strong>Permitir</strong> para ativar a entrada por voz.
            </p>
            <div className="flex gap-2 items-center justify-center text-xs text-gray-400">
              <div className="w-2 h-2 bg-[#58CC02] rounded-full animate-pulse" />
              Aguardando resposta...
            </div>
          </div>
        </div>
      )}

      {/* Mic denied banner */}
      {micPermission === 'denied' && (
        <div className="mx-3 mb-1 px-4 py-2 bg-red-50 rounded-2xl flex items-center gap-2">
          <span className="text-sm">🚫</span>
          <p className="text-xs text-red-600 font-medium">
            Microfone bloqueado. Ative nas configurações do navegador.
          </p>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
        {/* Listening indicator strip */}
        {isListening && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <p className="text-xs text-red-500 font-medium">Ouvindo... fale em inglês</p>
          </div>
        )}
        <div className="flex items-end gap-2">
          {speechSupported && micPermission !== 'denied' && (
            <button
              onClick={handleMic}
              disabled={atLimit || loading}
              className={`p-3 rounded-2xl flex-shrink-0 transition-all disabled:opacity-40 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              aria-label={isListening ? 'Parar microfone' : 'Ligar microfone'}
              title={isListening ? 'Clique para parar' : 'Clique para falar'}
            >
              <Mic size={18} />
            </button>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || atLimit}
            placeholder={atLimit ? 'Limite atingido' : 'Digite em inglês...'}
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:outline-none text-sm text-gray-800 disabled:opacity-50 transition-colors"
            style={{ maxHeight: '80px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || atLimit}
            className="p-3 rounded-2xl bg-[#58CC02] text-white hover:bg-[#4caf00] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {levelUpPending && <LevelUpOverlay newLevel={levelUpPending} onDismiss={clearLevelUp} />}
      {showSummary && (
        <SummaryModal
          sessionSeconds={sessionSeconds}
          onContinue={handleContinue}
          onAchievementUnlock={handleAchievementUnlock}
        />
      )}
    </div>
  );
}
