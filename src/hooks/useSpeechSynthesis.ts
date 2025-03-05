import { useState, useCallback } from 'react';
import { generateSpeech } from '../services/openai';

type VoiceOption = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  selectedVoice: VoiceOption;
  setSelectedVoice: (voice: VoiceOption) => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('alloy');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const stopSpeaking = useCallback(() => {
    // Stop the current audio if it exists
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
    
    // Find all audio elements and pause them (fallback)
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
    });
    
    setIsSpeaking(false);
  }, [audioElement]);

  const speak = useCallback(async (text: string) => {
    try {
      // Stop any existing speech
      stopSpeaking();
      
      setIsSpeaking(true);
      console.log('Generating speech using OpenAI TTS...');
      
      // Generate speech using OpenAI
      const arrayBuffer = await generateSpeech(text, selectedVoice);
      
      // Convert the ArrayBuffer to a Blob
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create an audio element
      const audio = new Audio(url);
      setAudioElement(audio);
      
      // Set up event listeners
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url); // Clean up the URL
        setAudioElement(null);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(url); // Clean up the URL
        setAudioElement(null);
      };
      
      // Play the audio
      await audio.play();
      
    } catch (error) {
      console.error('Error generating or playing speech:', error);
      setIsSpeaking(false);
      setAudioElement(null);
    }
  }, [selectedVoice, stopSpeaking]);

  return {
    isSpeaking,
    selectedVoice,
    setSelectedVoice,
    speak,
    stopSpeaking
  };
};

export default useSpeechSynthesis; 