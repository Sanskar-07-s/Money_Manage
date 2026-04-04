import { useState, useEffect, useCallback, useRef } from 'react';

export function useVoiceRecognition(options = {}) {
  const {
    lang = 'en-US',
    continuous = false,
    interimResults = true,
    onFinalTranscript = () => {},
  } = options;

  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('push-to-talk'); // 'push-to-talk' or 'always-listening'

  const recognitionRef = useRef(null);
  const shouldResumeRef = useRef(false);

  useEffect(() => {
    // Check support for Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    setSupported(true);
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = lang;
    recognitionRef.current.continuous = continuous || mode === 'always-listening';
    recognitionRef.current.interimResults = interimResults;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (finalStr) {
        onFinalTranscript(finalStr.trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interimStr.trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      // Ignore 'no-speech' error to keep it active
      if (event.error !== 'no-speech') {
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
        shouldResumeRef.current = false;
      }
    };

    recognitionRef.current.onend = () => {
      if (mode === 'always-listening' && shouldResumeRef.current) {
         window.setTimeout(() => {
           try {
             recognitionRef.current?.start();
           } catch (e) {
             setError(e.message || 'Unable to restart voice recognition.');
             setIsListening(false);
           }
         }, 180);
      } else {
         setIsListening(false);
      }
    };

    return () => {
      if (recognitionRef.current) {
        try {
           recognitionRef.current.stop();
        } catch(e) {}
      }
    };
  }, [lang, continuous, interimResults, onFinalTranscript, mode]);

  // Adjust continuous flag if mode changes while mounted
  useEffect(() => {
     if (recognitionRef.current) {
         recognitionRef.current.continuous = mode === 'always-listening';
     }
  }, [mode]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldResumeRef.current = true;
        setError(null);
        setInterimTranscript('');
        recognitionRef.current.start();
      } catch (err) {
        setError(err.message || 'Failed to start recognition.');
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        shouldResumeRef.current = false;
        recognitionRef.current.stop();
        // Don't set isListening here; let the onend event handle it for accuracy
      } catch (err) {
        setError(err.message || 'Failed to stop recognition.');
      }
    }
  }, [isListening]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  return {
    supported,
    isListening,
    interimTranscript,
    error,
    mode,
    start,
    stop,
    toggle,
    setMode,
  };
}
