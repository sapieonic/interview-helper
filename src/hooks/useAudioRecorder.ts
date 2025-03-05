import { useState, useRef, useCallback, useEffect } from 'react';
import RecordRTC from 'recordrtc';

interface UseAudioRecorderProps {
  onSilenceDetected: () => void;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | undefined>;
}

const useAudioRecorder = ({ onSilenceDetected }: UseAudioRecorderProps): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    return new Promise<Blob>((resolve) => {
      recorderRef.current!.stopRecording(() => {
        const blob = recorderRef.current!.getBlob();
        streamRef.current?.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        resolve(blob);
      });
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context for voice activity detection
      audioContextRef.current = new AudioContext();
      const audioSource = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 512; // Increased for better frequency resolution
      audioSource.connect(analyser);

      // Start monitoring audio levels
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Initialize silence detection variables
      let consecutiveSilenceFrames = 0;
      let consecutiveSpeechFrames = 0;
      const SILENCE_THRESHOLD = 10; // Adjust based on testing
      const FRAMES_BEFORE_SILENCE_DETECTION = 50; // About 1 second at 60fps
      const FRAMES_BEFORE_SPEECH_DETECTION = 3; // Require a few frames of speech to count as speaking
      
      console.log('Starting audio monitoring with silence threshold:', SILENCE_THRESHOLD);
      
      const checkAudioLevel = () => {
        if (!isRecording || !recorderRef.current) {
          console.log('Recording stopped, ending audio monitoring');
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS (root mean square) for better volume detection
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Log audio level every 60 frames (about once per second)
        if (Math.random() < 0.016) { // ~1/60 chance
          console.log('Current audio level:', rms.toFixed(2));
        }
        
        if (rms > SILENCE_THRESHOLD) {
          // Speech detected
          consecutiveSilenceFrames = 0;
          consecutiveSpeechFrames++;
          
          if (consecutiveSpeechFrames === FRAMES_BEFORE_SPEECH_DETECTION) {
            console.log('Speech detected at level:', rms.toFixed(2));
          }
        } else {
          // Silence detected
          consecutiveSpeechFrames = 0;
          consecutiveSilenceFrames++;
          
          // Only consider silence after we've detected speech first
          if (consecutiveSpeechFrames >= FRAMES_BEFORE_SPEECH_DETECTION && 
              consecutiveSilenceFrames === FRAMES_BEFORE_SILENCE_DETECTION) {
            console.log('Silence detected for ~1 second, stopping recording...');
            onSilenceDetected();
            return; // Stop the animation frame loop
          }
        }
        
        // Continue checking audio levels
        requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
      
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });
      
      recorderRef.current.startRecording();
      setIsRecording(true);
      
      // Fallback timeout - stop recording after 30 seconds maximum
      silenceTimeoutRef.current = setTimeout(() => {
        if (isRecording && recorderRef.current) {
          console.log('Maximum recording time reached (30s), stopping recording...');
          onSilenceDetected();
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  }, [isRecording, onSilenceDetected]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default useAudioRecorder; 