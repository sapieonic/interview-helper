import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SYSTEM_PROMPTS, InterviewType, transcribeAudio, generateChatCompletion } from './services/openai';
import useAudioRecorder from './hooks/useAudioRecorder';
import useSpeechSynthesis from './hooks/useSpeechSynthesis';
import useAuth from './hooks/useAuth';
import VoiceSelector from './components/VoiceSelector';
import ResponseDisplay from './components/ResponseDisplay';
import RecordButton from './components/RecordButton';
import InterviewTypeSelector from './components/InterviewTypeSelector';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';

function App() {
  const { user, loading: authLoading, logOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('software-engineer');
  const [hasStarted, setHasStarted] = useState(false);
  
  const conversationRef = useRef<{ role: 'user' | 'assistant' | 'system', content: string }[]>([]);
  
  // Initialize or reset the conversation when interview type changes
  useEffect(() => {
    conversationRef.current = [
      { role: 'system', content: SYSTEM_PROMPTS[interviewType] }
    ];
    
    // Clear previous response when changing interview type
    if (hasStarted) {
      setResponse('');
      setHasStarted(false);
    }
  }, [interviewType, hasStarted]);

  const { isSpeaking, selectedVoice, setSelectedVoice, speak, stopSpeaking } = useSpeechSynthesis();
  
  // Initialize the audio recorder hook first to avoid reference errors
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onSilenceDetected: () => {
      // We'll call handleTranscription when silence is detected
      if (handleTranscription.current) {
        handleTranscription.current();
      }
    }
  });
  
  // Use a ref for handleTranscription to avoid circular dependencies
  const handleTranscription = useRef<() => Promise<void>>();
  
  // Set up the handleTranscription function
  useEffect(() => {
    handleTranscription.current = async () => {
      // Prevent multiple calls
      if (isProcessing) {
        console.log('Already processing audio, ignoring duplicate call');
        return;
      }
      
      try {
        console.log('Starting audio processing...');
        setIsProcessing(true);
        
        const audioBlob = await stopRecording();
        
        // Check if audioBlob is defined
        if (!audioBlob) {
          console.error('No audio blob received from recorder');
          throw new Error('Failed to get audio recording');
        }
        
        // Check if the audio is too short (less than 0.5 seconds)
        if (audioBlob.size < 1000) {
          console.log('Audio too short, ignoring. Size:', audioBlob.size, 'bytes');
          setIsProcessing(false);
          return;
        }
        
        console.log('Processing audio of size:', audioBlob.size, 'bytes');
        
        console.log('Sending audio to Whisper API...');
        const transcriptionText = await transcribeAudio(audioBlob);

        // Check if transcription is empty
        if (!transcriptionText.trim()) {
          console.log('Empty transcription received, ignoring');
          setIsProcessing(false);
          return;
        }

        console.log('Transcription received:', transcriptionText);
        
        // Mark that the interview has started
        if (!hasStarted) {
          setHasStarted(true);
        }
        
        conversationRef.current.push({ role: 'user', content: transcriptionText });

        console.log('Sending to ChatGPT...');
        const fullResponse = await generateChatCompletion(
          conversationRef.current,
          (partialResponse) => setResponse(partialResponse)
        );

        console.log('Response received, speaking...');
        conversationRef.current.push({ role: 'assistant', content: fullResponse });
        
        speak(fullResponse);
      } catch (error) {
        console.error('Error processing audio:', error);
        alert('Error processing audio. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };
  }, [isProcessing, speak, stopRecording, hasStarted, setHasStarted]);
  
  // Function to start a new interview
  const startNewInterview = useCallback(() => {
    // Stop any ongoing processes
    if (isRecording) {
      stopRecording();
    }
    if (isSpeaking) {
      stopSpeaking();
    }
    
    // Reset the conversation
    conversationRef.current = [
      { role: 'system', content: SYSTEM_PROMPTS[interviewType] }
    ];
    
    setResponse('');
    setHasStarted(false);
  }, [interviewType, isRecording, isSpeaking, stopRecording, stopSpeaking]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-6">AI Interview Assistant</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Main application (authenticated)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Interview Assistant</h1>
      
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Conversation</h2>
          
          <div className="flex items-center space-x-4">
            <VoiceSelector
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              isSpeaking={isSpeaking}
              onStopSpeaking={stopSpeaking}
            />
            
            <UserProfile user={user} onLogout={logOut} />
          </div>
        </div>
        
        <InterviewTypeSelector 
          selectedType={interviewType}
          onTypeChange={setInterviewType}
          disabled={isRecording || isProcessing || isSpeaking || hasStarted}
        />
        
        {hasStarted && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={startNewInterview}
              disabled={isRecording || isProcessing}
              className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Start New Interview
            </button>
          </div>
        )}
        
        <ResponseDisplay response={response} />
        
        <RecordButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          onStartRecording={startRecording}
          onStopRecording={() => {
            if (handleTranscription.current) {
              handleTranscription.current();
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;