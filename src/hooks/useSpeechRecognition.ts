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
        if (event.error === 'not-allowed') {
          setError("Mikrofon-Zugriff verweigert. Bitte Einstellungen prüfen.");
        } else {
          setError(`Mikrofon-Fehler: ${event.error}. Bitte prüfe die Freigabe.`);
        }
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

  const startListening = useCallback(async () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Explicitly request microphone permission first to force iOS/Safari prompt
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop the tracks immediately so we don't hold the mic hostage
          stream.getTracks().forEach(track => track.stop());
        }
        recognitionRef.current.start();
      } catch (err: any) {
        console.error("Failed to start speech recognition", err);
        setIsListening(false);
        if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
          setError("Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.");
        } else {
          setError("Fehler beim Starten des Mikrofons: " + (err.message || "Unbekannter Fehler"));
        }
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
