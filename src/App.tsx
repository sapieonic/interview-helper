import React, { useState, useRef, useCallback } from 'react';
import RecordRTC from 'recordrtc';
import { Mic, Square, Play, Loader2, Volume2, VolumeX } from 'lucide-react';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are an experienced technical interviewer conducting a software engineering interview. 
Your role is to:
1. Ask relevant technical questions based on the candidate's responses
2. Evaluate their answers professionally
3. Probe deeper into their technical knowledge
4. Focus on software engineering principles, system design, and coding practices
5. Maintain a professional and constructive tone
6. Keep responses concise and focused

If this is the start of the conversation, begin by introducing yourself briefly and asking an initial technical question.
If this is a follow-up, evaluate their response and ask a relevant follow-up question.`;

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationRef = useRef<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'system', content: SYSTEM_PROMPT }
  ]);

  const resetSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      if (isRecording) {
        handleTranscription();
      }
    }, 2000); // Stop after 2 seconds of silence
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context for voice activity detection
      audioContextRef.current = new AudioContext();
      const audioSource = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      audioSource.connect(analyser);

      // Start monitoring audio levels
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (!isRecording) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > 5) { // Adjust this threshold as needed
          resetSilenceTimeout();
        }
        
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
      resetSilenceTimeout();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  }, [resetSilenceTimeout]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
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

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1.1;
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = [
          'Google UK English Female',
          'Microsoft Libby Online (Natural)',
          'Microsoft Sarah Online (Natural)',
          'Karen',
          'Samantha'
        ];
        
        const voice = voices.find(v => 
          preferredVoices.includes(v.name) || 
          (v.lang.startsWith('en') && v.name.includes('Female'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        utterance.voice = voice;
      };

      if (window.speechSynthesis.getVoices().length) {
        loadVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const handleTranscription = async () => {
    try {
      setIsProcessing(true);
      const audioBlob = await stopRecording();
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' }),
        model: 'whisper-1',
      });

      conversationRef.current.push({ role: 'user', content: transcription.text });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: conversationRef.current,
        stream: true,
      });

      let fullResponse = '';
      setResponse('');

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setResponse(fullResponse);
      }

      conversationRef.current.push({ role: 'assistant', content: fullResponse });
      
      speak(fullResponse);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Technical Interview Assistant
          </h1>
          
          <div className="flex justify-center gap-4 mb-8">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-blue-600 text-white rounded-full p-6 hover:bg-blue-700 transition-colors"
                disabled={isProcessing}
              >
                <Mic size={32} />
              </button>
            ) : (
              <button
                onClick={handleTranscription}
                className="bg-red-600 text-white rounded-full p-6 hover:bg-red-700 transition-colors"
              >
                <Square size={32} />
              </button>
            )}
            
            {response && (
              <button
                onClick={isSpeaking ? stopSpeaking : () => speak(response)}
                className={`${
                  isSpeaking ? 'bg-gray-600' : 'bg-green-600'
                } text-white rounded-full p-6 hover:bg-opacity-90 transition-colors`}
              >
                {isSpeaking ? <VolumeX size={32} /> : <Volume2 size={32} />}
              </button>
            )}
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
              <Loader2 className="animate-spin" />
              <span>Processing your message...</span>
            </div>
          )}

          {response && (
            <div className="bg-gray-50 rounded-xl p-6 mt-4">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Interviewer:</h2>
              <p className="text-gray-600 leading-relaxed">{response}</p>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            Click the microphone to start recording your answer, and the square to stop and process
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;