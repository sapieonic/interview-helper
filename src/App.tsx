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
import { formatResponseWithCodeHighlighting } from './utils/formatResponse';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <svg className="w-10 h-10 mr-3 text-blue-600" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 16C25.373 16 20 21.373 20 28C20 31.197 21.125 34.115 23 36.34V44L28.223 41.379C29.428 41.78 30.686 42 32 42C38.627 42 44 36.627 44 30C44 23.373 38.627 18 32 18V16Z" fill="currentColor"/>
              <path d="M32 48C41.941 48 50 39.941 50 30C50 20.059 41.941 12 32 12C22.059 12 14 20.059 14 30C14 34.764 15.805 39.122 18.837 42.362L16 52L25.638 49.163C27.661 49.708 29.795 50 32 50V48Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M26 28H38" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M26 34H34" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">AI Interview Assistant</h1>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
          
          <p className="text-gray-600 text-lg">Preparing your interview experience...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-4 pt-6 md:pt-10">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 16C25.373 16 20 21.373 20 28C20 31.197 21.125 34.115 23 36.34V44L28.223 41.379C29.428 41.78 30.686 42 32 42C38.627 42 44 36.627 44 30C44 23.373 38.627 18 32 18V16Z" fill="currentColor"/>
              <path d="M32 48C41.941 48 50 39.941 50 30C50 20.059 41.941 12 32 12C22.059 12 14 20.059 14 30C14 34.764 15.805 39.122 18.837 42.362L16 52L25.638 49.163C27.661 49.708 29.795 50 32 50V48Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M26 28H38" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M26 34H34" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">AI Interview Assistant</h1>
          </div>
          
          <UserProfile user={user} onLogout={logOut} />
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 md:px-6 md:py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-0">Interview Session</h2>
              
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                  isSpeaking={isSpeaking}
                  onStopSpeaking={stopSpeaking}
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
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
                  className="flex items-center text-sm px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start New Interview
                </button>
              </div>
            )}
            
            <ResponseDisplay response={formatResponseWithCodeHighlighting(response)} />
            
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
        
        <div className="text-center text-xs text-gray-500">
          <p>© 2023 AI Interview Assistant. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default App;