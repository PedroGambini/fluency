'use client';

import { Volume2, Square } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export default function ChatBubble({ role, content, onPlayAudio, isPlaying }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`relative max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[#58CC02] text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p>{content}</p>
        {!isUser && onPlayAudio && (
          <button
            onClick={onPlayAudio}
            className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
          >
            {isPlaying ? (
              <Square size={12} className="fill-current" />
            ) : (
              <Volume2 size={12} />
            )}
            <span>{isPlaying ? 'Parar' : 'Ouvir'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
