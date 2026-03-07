/**
 * Frontend Part 7 - Voice: Speech-to-Text (Web Speech API) and Text-to-Speech.
 * Works in fallback mode; no server required for recognition/synthesis.
 */
import { useState, useRef, useCallback } from 'react';

const SpeechRecognitionAPI = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const hasSpeechSynthesis = typeof window !== 'undefined' && window.speechSynthesis;

export function useVoice(options = {}) {
  const { onResult, onInterim, lang = 'en-US' } = options;
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    setError(null);
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript;
      if (!last.isFinal && typeof onInterim === 'function') {
        onInterim(transcript);
      }
      if (last.isFinal && transcript && typeof onResult === 'function') {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
          recognitionRef.current = null;
        }
        setListening(false);
        if (typeof onInterim === 'function') onInterim('');
        onResult(transcript.trim());
      }
    };
    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return;
      setError(e.error === 'not-allowed' ? 'Microphone access denied.' : e.error);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch (e) {
      setError(e.message || 'Could not start recognition.');
    }
  }, [onResult, lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const speak = useCallback((text) => {
    if (!hasSpeechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).slice(0, 5000));
    u.rate = 0.95;
    u.pitch = 1;
    u.onstart = () => setIsSpeaking(true);
    u.onend   = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!hasSpeechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    listening,
    isSpeaking,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    supported: {
      stt: !!SpeechRecognitionAPI,
      tts: !!hasSpeechSynthesis,
    },
  };
}
