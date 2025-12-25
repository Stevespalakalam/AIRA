import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = (onFinalTranscript: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const listeningIntentRef = useRef(false);

  // Keep the callback ref up-to-date without re-triggering the main effect
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // This effect runs only once to initialize the speech recognition engine
  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        if (transcript) {
          onFinalTranscriptRef.current(transcript);
        }
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}.`);
      }
      // On a real error, stop trying to listen.
      listeningIntentRef.current = false;
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // If our intent was to keep listening, it means the browser stopped it (e.g., timeout). Restart it.
      if (listeningIntentRef.current) {
          try {
              recognition.start();
          } catch(e) {
              console.error("Speech recognition restart failed.", e);
          }
      }
    };
    
    // Cleanup on unmount
    return () => {
      listeningIntentRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort(); // Force stop
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  const startListening = useCallback(() => {
    if (recognitionRef.current && !listeningIntentRef.current) {
      try {
        listeningIntentRef.current = true;
        recognitionRef.current.start();
      } catch (err) {
        console.error("Could not start speech recognition:", err);
        listeningIntentRef.current = false;
      }
    }
  }, []); // This function is now stable

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listeningIntentRef.current) {
      listeningIntentRef.current = false;
      recognitionRef.current.stop(); 
    }
  }, []); // This function is now stable

  return { isListening, error, startListening, stopListening, hasSupport: !!SpeechRecognitionAPI };
};