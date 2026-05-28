import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // We use 'any' because SpeechRecognition types aren't fully standardized in TS DOM yet
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError("Your browser does not support Speech Recognition. Please try Chrome or Safari.");
        return;
      }

      const recognition = new SpeechRecognition();
      
      // User requested explicit stop, so continuous mode is true
      recognition.continuous = true; 
      recognition.interimResults = true; 
      recognition.lang = window.navigator.language || 'en-US'; 

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript(''); // Clear old text on new recording
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(interimText);
        if (finalText) {
          setTranscript((prev) => prev + finalText);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setError(`Microphone error: ${event.error}. Please ensure permissions are granted.`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const restartListening = useCallback(() => {
    if (recognitionRef.current) {
      // First stop the current recognition
      recognitionRef.current.stop();
      // Reset the text state
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      
      // Start it again after a tiny delay to ensure the stop event finished
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Failed to restart", err);
        }
      }, 300);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    restartListening,
    isSupported: error !== "Your browser does not support Speech Recognition. Please try Chrome or Safari."
  };
};
