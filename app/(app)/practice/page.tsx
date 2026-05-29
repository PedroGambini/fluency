'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { buildSystemPrompt, parseAIResponse } from '@/lib/prompts';
import { SCENARIOS } from '@/lib/scenarios';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported, createSpeechRecognition, speak, stopSpeaking } from '@/lib/speech';
import ScenarioCard from '@/components/ScenarioCard';
import ChatBubble from '@/components/ChatBubble';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import SummaryModal from '@/components/SummaryModal';
import { Mic, MicOff, Send, X, Volume2 } from 'lucide-react';

const MAX_MESSAGES = 30;

export default function PracticePage() {
  const router = useRouter();
  const store = useStore();
  const { user, currentSession, setScenario, addMessage, addWords, markUsedPortuguese, levelUpPending, clearLevelUp, resetSession } = store;

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

  const speechSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
  }, [user, router]);

  // Timer
  useEffect(() => {
    if (!currentSession.scenarioId) return;
    timerRef.current = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentSession.scenarioId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages, loading]);

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

      if (meta.newWords?.length > 0) addWords(meta.newWords);
      if (meta.usedPortuguese) markUsedPortuguese();
    } catch {
      addMessage({ role: 'assistant', content: '(Erro ao conectar com a IA. Tente novamente.)' });
    } finally {
      setLoading(false);
    }
  }, [user, loading, currentSession, addMessage, addWords, markUsedPortuguese, store]);

  function handleSend() {
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    setShowSummary(true);
  }

  function handleContinue() {
    setShowSummary(false);
    setSessionSeconds(0);
    resetSession();
  }

  function handleSelectScenario(id: string) {
    setSessionSeconds(0);
    setScenario(id);
  }

  if (!user) return null;

  // Scenario selection view
  if (!currentSession.scenarioId) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="px-5 pt-6 pb-3">
          <h2 className="text-xl font-extrabold text-gray-800">Escolha um cenário</h2>
          <p className="text-sm text-gray-500">Selecione para começar a praticar</p>
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
      </div>
    );
  }

  const scenario = SCENARIOS.find((s) => s.id === currentSession.scenarioId)!;
  const atLimit = currentSession.messageCount >= MAX_MESSAGES;

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <span className="text-xl">{scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{scenario.name}</p>
          <p className="text-xs text-gray-400">{formatTimer(sessionSeconds)}</p>
        </div>
        <button
          onClick={handleEnd}
          className="text-xs font-semibold text-red-400 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 hover:border-red-300 transition-colors"
        >
          <X size={12} />
          Encerrar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {currentSession.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-4xl">{scenario.icon}</span>
            <p className="text-sm font-semibold text-gray-600">{scenario.name}</p>
            <p className="text-xs text-gray-400 max-w-[200px]">{scenario.mission}</p>
            <p className="text-xs text-[#58CC02] font-semibold mt-2">Diga olá para começar!</p>
          </div>
        )}

        {currentSession.messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            onPlayAudio={msg.role === 'assistant' && ttsSupported
              ? () => handlePlayAudio(msg.content, i)
              : undefined}
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
              disabled={atLimit}
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
        <SummaryModal sessionSeconds={sessionSeconds} onContinue={handleContinue} />
      )}
    </div>
  );
}
