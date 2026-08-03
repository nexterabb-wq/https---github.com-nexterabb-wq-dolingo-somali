import { useCallback, useRef, useState } from 'react';

interface UseTTSOptions {
  /** Preferred audio URL — if set and valid, plays instead of speechSynthesis */
  audioUrl?: string | null;
  /** Language for speechSynthesis fallback */
  lang?: string;
  /** Rate (0.1–2.0) for speechSynthesis */
  rate?: number;
}

interface UseTTSReturn {
  speak: (text?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  provider: 'audio-url' | 'browser-tts' | null;
}

export function useTTS({ audioUrl, lang = 'en-US', rate = 0.9 }: UseTTSOptions = {}): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [provider, setProvider] = useState<UseTTSReturn['provider']>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || (audioUrl && typeof Audio !== 'undefined'));

  const stop = useCallback(() => {
    // Stop audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Stop speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (utteranceRef.current) {
      utteranceRef.current = null;
    }
    setIsSpeaking(false);
    setProvider(null);
  }, []);

  const speak = useCallback(
    (text?: string) => {
      if (!text && !audioUrl) return;

      stop();

      // Priority 1: Use audioUrl if available
      if (audioUrl) {
        try {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          setProvider('audio-url');
          setIsSpeaking(true);

          audio.onended = () => {
            setIsSpeaking(false);
            setProvider(null);
            audioRef.current = null;
          };
          audio.onerror = () => {
            // Audio URL failed — fall through to speechSynthesis
            audioRef.current = null;
            if (text && 'speechSynthesis' in window) {
              // Will be handled below
            } else {
              setIsSpeaking(false);
              setProvider(null);
            }
          };
          audio.play().catch(() => {
            audioRef.current = null;
            // Fall through to speechSynthesis below if available
          });
          // If audioUrl started playing, don't continue to speechSynthesis
          // The onerror handler above will fall through if needed
          return;
        } catch {
          // Fall through to speechSynthesis
        }
      }

      // Priority 2: Browser speechSynthesis fallback
      if (!text) return;
      if (!('speechSynthesis' in window)) return;

      try {
        // Cancel any pending utterances
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1;

        // Try to pick an English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          (v) => v.lang.startsWith('en') && v.localService
        ) ?? voices.find((v) => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          setProvider(null);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setProvider(null);
        };

        utteranceRef.current = utterance;
        setProvider('browser-tts');
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
        setProvider(null);
      }
    },
    [audioUrl, lang, rate, stop],
  );

  return { speak, stop, isSpeaking, isSupported, provider };
}
