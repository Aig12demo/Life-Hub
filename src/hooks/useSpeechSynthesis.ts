import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
}

export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select a default English voice
      const defaultVoice = availableVoices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || availableVoices.find(voice => voice.lang.startsWith('en')) || availableVoices[0];
      
      if (defaultVoice && !selectedVoice) {
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported, selectedVoice]);

  // Monitor speech synthesis state
  useEffect(() => {
    if (!isSupported) return;

    const checkSpeakingState = () => {
      setIsSpeaking(speechSynthesis.speaking);
      setIsPaused(speechSynthesis.paused);
    };

    const interval = setInterval(checkSpeakingState, 100);
    return () => clearInterval(interval);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Event listeners
    utterance.addEventListener('start', () => {
      setIsSpeaking(true);
      setIsPaused(false);
    });

    utterance.addEventListener('end', () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    });

    utterance.addEventListener('error', (event) => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('Speech synthesis error:', event.error);
      }
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    });

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, selectedVoice]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
};