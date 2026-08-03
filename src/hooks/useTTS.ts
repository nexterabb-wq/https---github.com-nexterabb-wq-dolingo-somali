import { useCallback, useEffect, useRef, useState } from 'react';

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

/**
 * Pre-loads voices for speechSynthesis. Chrome returns [] on first getVoices()
 * call — this listens for the async 'voiceschanged' event so voices are ready
 * when the user clicks the pronunciation button.
 */
function useVoicesReady() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const populate = () => setVoices(window.speechSynthesis.getVoices());
    populate();
    window.speechSynthesis.addEventListener('voiceschanged', populate);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', populate);
  }, []);
  return voices;
}

export function useTTS({ audioUrl, lang = 'en-US', rate = 0.9 }: UseTTSOptions = {}): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [provider, setProvider] = useState<UseTTSReturn['provider']>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voices = useVoicesReady();

  const isSupported =
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || (audioUrl && typeof Audio !== 'undefined'));

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
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
            audioRef.current = null;
            if (text && 'speechSynthesis' in window) {
              // Fall through to speechSynthesis below
            } else {
              setIsSpeaking(false);
              setProvider(null);
            }
          };
          audio.play().catch(() => {
            audioRef.current = null;
          });
          return;
        } catch {
          // Fall through to speechSynthesis
        }
      }

      // Priority 2: Browser speechSynthesis fallback
      if (!text) return;
      if (!('speechSynthesis' in window)) return;

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1;

        // Pick best available English voice (uses pre-loaded voices)
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
    [audioUrl, lang, rate, stop, voices],
  );

  return { speak, stop, isSpeaking, isSupported, provider };
}
