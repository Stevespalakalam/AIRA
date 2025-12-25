import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = (onSpeechEnd: () => void) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep the onSpeechEnd callback up to date without causing re-renders
  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);
  
  // This effect handles finding and setting the desired voice.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        return;
    }

    const findAndSetVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return; // Voices not loaded yet

        // Priority 1: Indian English Female
        let foundVoice = voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female'))
            || voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('female'));

        // Priority 2: Any high-quality English Female
        if (!foundVoice) {
            foundVoice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female'))
                || voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('zira')) // Microsoft
                || voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('susan'))
                || voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('female'));
        }
        
        // Priority 3: Any Indian English
        if (!foundVoice) {
            foundVoice = voices.find(v => v.lang === 'en-IN');
        }

        preferredVoiceRef.current = foundVoice || null;
    };

    findAndSetVoice();
    window.speechSynthesis.addEventListener('voiceschanged', findAndSetVoice);

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', findAndSetVoice);
        window.speechSynthesis.cancel();
      }
    };
  }, []); // This effect runs only once on mount

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredVoiceRef.current) {
      utterance.voice = preferredVoiceRef.current;
      utterance.lang = preferredVoiceRef.current.lang;
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onSpeechEndRef.current();
    };
    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`);
      setIsSpeaking(false);
      onSpeechEndRef.current();
    };
    
    window.speechSynthesis.speak(utterance);
  }, []); // `speak` function is stable and does not change

  return { isSpeaking, speak, error, hasSupport: typeof window !== 'undefined' && !!window.speechSynthesis };
};
