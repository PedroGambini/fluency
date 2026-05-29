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
import { Mic, MicOff, Send, X } from 'lucide-react';

const MAX_MESSAGES = 30;

export default function PracticePage() {
  const router = useRouter();
  const store = useStore();
  const {
    user,
    currentSession,
    setScenario,
    addMessage,
    addWords,
    markUsedPortuguese,
    levelUpPending,
    clearLevelUp,
    resetSession,
    endSession,
    unlockAchievement,
    achievements,
  } = store;

  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const introSentRef = useRef(false);

  const speechSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  // Redirect if no user
  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  // Fix bug: if session was ended and user navigates back, reset to scenario grid
  useEffect(() => {
    if (currentSession.sessionEnded) {
      resetSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (!currentSession.scenarioId || currentSession.sessionEnded) return;
    timerRef.current = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentSession.scenarioId, currentSession.sessionEnded]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages, loading]);

  // Level up sound
  useEffect(() => {
    if (levelUpPending) playLevelUp();
  }, [levelUpPending]);

  // Send AI intro when scenario starts
  const sendIntro = useCallback(async () => {
    if (!user || introSentRef.current) return;
    introSentRef.current = true;
    setLoading(true);

    const introPrompt = buildIntroPrompt(store);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: introPrompt,
          messages: [{ role: 'user', content: 'start' }],
        }),
      });
      const data = await res.json();
      const { reply } = parseAIResponse(data.text ?? '');
      addMessage({ role: 'assistant', content: reply });
      playMessageReceived();
    } catch {
      addMessage({ role: 'assistant', content: '(Erro ao conectar. Tente novamente.)' });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, store]);

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

    const systemPrompt = buildSystemPrompt(store);
    const messages = [...currentSession.messages, userMsg];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, messages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { reply, meta } = parseAIResponse(data.text);
      addMessage({ role: 'assistant', content: reply });
      playMessageReceived();

      if (meta.newWords?.length > 0) addWords(meta.newWords);
      if (meta.usedPortuguese) markUsedPortuguese();
    } catch {
      addMessage({ role: 'assistant', content: '(Erro ao conectar com a IA. Tente novamente.)' });
    } finally {
      setLoading(false);
    }
  }, [user, loading, currentSession, addMessage, addWords, markUsedPortuguese, store]);

  function handleSend() { sendMessage(input); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleMic() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    if (!speechSupported) return;
    recognitionRef.current = createSpeechRecognition(
      (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal) setIsListening(false);
      },
      () => setIsListening(false)
    );
    recognitionRef.current?.start();
    setIsListening(true);
  }

  function handlePlayAudio(content: string, index: number) {
    if (playingIndex === index) {
      stopSpeaking();
      setPlayingIndex(null);
      return;
    }
    setPlayingIndex(index);
    speak(content, () => setPlayingIndex(null));
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

  function handleSelectScenario(id: string) {
    setSelectedScenarioId(id);
  }

  function handleStartScenario(difficulty: CEFRLevel) {
    if (!selectedScenarioId) return;
    setSelectedScenarioId(null);
    setSessionSeconds(0);
    introSentRef.current = false;
    setScenario(selectedScenarioId, difficulty);
    playScenarioStart();
  }

  function handleAchievementUnlock(id: string) {
    unlockAchievement(id);
    playAchievement();
  }

  if (!user) return null;

  // Scenario selection view
  if (!currentSession.scenarioId) {
    const pendingScenario = selectedScenarioId
      ? SCENARIOS.find(s => s.id === selectedScenarioId)
      : null;

    return (
      <div className="h-full flex flex-col bg-white relative">
        <div className="px-5 pt-6 pb-3">
          <h2 className="text-xl font-extrabold text-gray-800">Pratique</h2>
          <p className="text-sm text-gray-500">Escolha um cenário para começar</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {SCENARIOS.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onSelect={() => handleSelectScenario(s.id)}
              />
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

  const scenario = SCENARIOS.find(s => s.id === currentSession.scenarioId)!;
  const atLimit = currentSession.messageCount >= MAX_MESSAGES;

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header — always visible */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0 z-10">
        <span className="text-xl">{scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{scenario.name}</p>
          <p className="text-xs text-gray-400">
            {formatTimer(sessionSeconds)} · {currentSession.chosenDifficulty}
          </p>
        </div>
        <button
          onClick={handleEnd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-xs font-bold shrink-0"
          aria-label="Encerrar conversa"
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
            onPlayAudio={
              msg.role === 'assistant' && ttsSupported
                ? () => handlePlayAudio(msg.content, i)
                : undefined
            }
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

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
        <div className="flex items-end gap-2">
          {speechSupported && (
            <button
              onClick={handleMic}
              disabled={atLimit || loading}
              className={`p-3 rounded-2xl flex-shrink-0 transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              } disabled:opacity-40`}
              aria-label={isListening ? 'Parar gravação' : 'Gravar voz'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            aria-label="Enviar mensagem"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Overlays */}
      {levelUpPending && (
        <LevelUpOverlay newLevel={levelUpPending} onDismiss={clearLevelUp} />
      )}
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
