import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SYSTEM_PROMPTS, InterviewType, transcribeAudio, generateChatCompletion, generateInterviewFeedback } from './services/openai';
import useAudioRecorder from './hooks/useAudioRecorder';
import useSpeechSynthesis from './hooks/useSpeechSynthesis';
import useAuth from './hooks/useAuth';
import VoiceSelector from './components/VoiceSelector';
import ResponseDisplay from './components/ResponseDisplay';
import ConversationDisplay from './components/ConversationDisplay';
import RecordButton from './components/RecordButton';
import InterviewTypeSelector from './components/InterviewTypeSelector';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import FeedbackModal from './components/FeedbackModal';
import formatResponseWithCodeHighlighting from './utils/formatResponse';
import { 
  createSession, 
  updateSessionTokens, 
  completeSession, 
  getSessionData,
  listUserSessions
} from './services/firebase';

// Global variables to track session state
let GLOBAL_SESSION_ID: string | null = null;
let GLOBAL_TOTAL_TOKENS = 0;

function App() {
  const { user, loading: authLoading, logOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('software-engineer');
  const [hasStarted, setHasStarted] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  
  // Feedback state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  
  // Session tracking
  const sessionIdRef = useRef<string | null>(null);
  const totalTokensRef = useRef<number>(0);
  const sessionInitializedRef = useRef<boolean>(false);
  
  const conversationRef = useRef<{ 
    role: 'user' | 'assistant' | 'system', 
    content: string,
    originalContent?: string  // Add originalContent field
  }[]>([]);
  
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
  
  const [showConversation, setShowConversation] = useState(false);
  
  // Create a new session when starting a new interview
  const initializeSession = useCallback(async () => {
    // Only initialize the session once per interview
    if (sessionInitializedRef.current && sessionIdRef.current) {
      console.log('Session already initialized, using existing session ID:', sessionIdRef.current);
      return;
    }
    
    // If we have a global session ID, use it
    if (GLOBAL_SESSION_ID) {
      console.log('Using global session ID:', GLOBAL_SESSION_ID);
      sessionIdRef.current = GLOBAL_SESSION_ID;
      totalTokensRef.current = GLOBAL_TOTAL_TOKENS;
      sessionInitializedRef.current = true;
      return;
    }
    
    if (!user) return;
    
    try {
      console.log('Initializing new session for user:', user.email);
      
      // Create a new session in Firestore
      const sessionId = await createSession(
        user.uid,
        user.email || 'unknown@example.com',
        interviewType
      );
      
      // Store the session ID in refs and global variables
      sessionIdRef.current = sessionId;
      totalTokensRef.current = 0;
      sessionInitializedRef.current = true;
      
      // Set global variables
      GLOBAL_SESSION_ID = sessionId;
      GLOBAL_TOTAL_TOKENS = 0;
      
      console.log('Created new session with ID:', sessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
      
      // Create a local session ID as fallback
      const localSessionId = `local_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionIdRef.current = localSessionId;
      totalTokensRef.current = 0;
      sessionInitializedRef.current = true;
      
      // Set global variables
      GLOBAL_SESSION_ID = localSessionId;
      GLOBAL_TOTAL_TOKENS = 0;
      
      console.log('Using local session ID:', localSessionId);
    }
  }, [user, interviewType]);
  
  // Initialize or reset the conversation when interview type changes
  useEffect(() => {
    // Reset conversation with system prompt
    conversationRef.current = [
      { role: 'system', content: SYSTEM_PROMPTS[interviewType] }
    ];
    
    // If job description is provided, add it to the system prompt
    if (jobDescription.trim()) {
      conversationRef.current = [
        { 
          role: 'system', 
          content: `${SYSTEM_PROMPTS[interviewType]}\n\n### JOB DESCRIPTION ###\n${jobDescription}\n\nUse the above job description to tailor your interview questions and evaluate the candidate's responses in the context of this specific role.`
        }
      ];
    }
    
    // Reset hasStarted to false - user needs to click record first
    setHasStarted(false);
    
    // Reset feedback
    setFeedback('');
    setIsFeedbackModalOpen(false);
    
    // Reset response
    setResponse('');
    
    // Reset session tracking
    sessionInitializedRef.current = false;
    
  }, [interviewType, jobDescription]);
  
  // Generate feedback for the interview
  const generateFeedback = useCallback(async () => {
    // Remove the conversation length check
    setIsGeneratingFeedback(true);
    
    try {
      const result = await generateInterviewFeedback(conversationRef.current);
      setFeedback(result.feedback);
      
      // Update token count for feedback generation
      if (sessionIdRef.current) {
        try {
          await updateSessionTokens(sessionIdRef.current, result.usage.totalTokens);
          totalTokensRef.current += result.usage.totalTokens;
          
          // Update global token count
          GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
          
          console.log('Updated token count for feedback. New total:', totalTokensRef.current);
        } catch (error) {
          console.error('Failed to update session tokens for feedback, continuing:', error);
          // Still update the local token count
          totalTokensRef.current += result.usage.totalTokens;
          GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
        }
      }
      
      // Open the feedback modal
      setIsFeedbackModalOpen(true);
    } catch (error) {
      console.error('Error generating feedback:', error);
      alert('Failed to generate feedback. Please try again.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, []);
  
  // End the interview and generate feedback
  const endInterview = useCallback(async () => {
    // Stop any ongoing processes
    if (isRecording) {
      stopRecording();
    }
    if (isSpeaking) {
      stopSpeaking();
    }
    
    // Generate feedback
    await generateFeedback();
    
    // Mark the session as completed
    if (sessionIdRef.current) {
      try {
        await completeSession(sessionIdRef.current);
        console.log('Completed session:', sessionIdRef.current);
      } catch (error) {
        console.error('Error completing session, continuing:', error);
      }
    }
  }, [isRecording, isSpeaking, stopRecording, stopSpeaking, generateFeedback]);
  
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
        
        // Initialize session if this is the first interaction in this interview
        if (!hasStarted || !sessionInitializedRef.current) {
          try {
            await initializeSession();
            setHasStarted(true);
          } catch (error) {
            console.error('Failed to initialize session, continuing without tracking:', error);
            setHasStarted(true);
          }
        } else {
          console.log('Using existing session:', sessionIdRef.current);
        }
        
        console.log('Sending audio to Whisper API...');
        const transcriptionResult = await transcribeAudio(audioBlob);
        const transcriptionText = transcriptionResult.text;
        const originalTranscriptionText = transcriptionResult.originalText || '';

        // Check if transcription is empty
        if (!transcriptionText.trim()) {
          console.log('Empty transcription received, ignoring');
          setIsProcessing(false);
          return;
        }

        console.log('Transcription received:', transcriptionText);
        console.log('Original transcription received:', originalTranscriptionText);
        console.log('Transcription tokens:', transcriptionResult.usage.totalTokens);
        
        // Log differences between original and OpenAI transcription
        if (originalTranscriptionText && originalTranscriptionText !== transcriptionText) {
          console.log('Differences detected between original speech and OpenAI transcription:');
          console.log(`OpenAI: "${transcriptionText}"`);
          console.log(`Original: [${originalTranscriptionText}]`);
        }
        
        // Update token count for transcription
        if (sessionIdRef.current) {
          try {
            await updateSessionTokens(sessionIdRef.current, transcriptionResult.usage.totalTokens);
            totalTokensRef.current += transcriptionResult.usage.totalTokens;
            
            // Update global token count
            GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
            
            console.log('Updated token count. New total:', totalTokensRef.current);
          } catch (error) {
            console.error('Failed to update session tokens, continuing:', error);
            // Still update the local token count
            totalTokensRef.current += transcriptionResult.usage.totalTokens;
            GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
          }
        }
        
        // Add both transcriptions to the conversation
        conversationRef.current.push({ 
          role: 'user', 
          content: transcriptionText,
          originalContent: originalTranscriptionText 
        });

        console.log('Sending to ChatGPT...');
        const completionResult = await generateChatCompletion(
          conversationRef.current.map(msg => ({ role: msg.role, content: msg.content })),
          (partialResponse) => setResponse(partialResponse)
        );

        console.log('Response received, speaking...');
        console.log('Completion tokens:', completionResult.usage.totalTokens);
        
        // Update token count for completion
        if (sessionIdRef.current) {
          try {
            await updateSessionTokens(sessionIdRef.current, completionResult.usage.totalTokens);
            totalTokensRef.current += completionResult.usage.totalTokens;
            
            // Update global token count
            GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
            
            console.log('Updated token count. New total:', totalTokensRef.current);
          } catch (error) {
            console.error('Failed to update session tokens, continuing:', error);
            // Still update the local token count
            totalTokensRef.current += completionResult.usage.totalTokens;
            GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
          }
        }
        
        // Add the assistant's response to the conversation
        conversationRef.current.push({ role: 'assistant', content: completionResult.response });
        
        // Speak the response
        try {
          const speechResult = await speak(completionResult.response);
          
          // Update token count for speech synthesis
          if (sessionIdRef.current && speechResult?.usage) {
            try {
              await updateSessionTokens(sessionIdRef.current, speechResult.usage.totalTokens);
              totalTokensRef.current += speechResult.usage.totalTokens;
              
              // Update global token count
              GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
              
              console.log('Updated token count for speech. New total:', totalTokensRef.current);
            } catch (error) {
              console.error('Failed to update session tokens for speech, continuing:', error);
              // Still update the local token count
              totalTokensRef.current += speechResult.usage.totalTokens;
              GLOBAL_TOTAL_TOKENS = totalTokensRef.current;
            }
          }
        } catch (error) {
          console.error('Error speaking response:', error);
        }
        
        console.log('Total tokens used in this session:', totalTokensRef.current);
      } catch (error) {
        console.error('Error processing audio:', error);
        alert('Error processing audio. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };
  }, [isProcessing, stopRecording, hasStarted, speak, initializeSession]);
  
  // Function to start a new interview
  const startNewInterview = useCallback(async () => {
    // Stop any ongoing processes
    if (isRecording) {
      stopRecording();
    }
    if (isSpeaking) {
      stopSpeaking();
    }
    
    // Mark the current session as completed if it exists
    if (sessionIdRef.current) {
      try {
        await completeSession(sessionIdRef.current);
        console.log('Completed session:', sessionIdRef.current);
      } catch (error) {
        console.error('Error completing session, continuing:', error);
      }
    }
    
    // Reset the session ID and token count
    sessionIdRef.current = null;
    totalTokensRef.current = 0;
    sessionInitializedRef.current = false;
    
    // Reset global variables
    GLOBAL_SESSION_ID = null;
    GLOBAL_TOTAL_TOKENS = 0;
    
    // Reset the conversation with system prompt and job description if provided
    conversationRef.current = [
      { 
        role: 'system', 
        content: jobDescription.trim() 
          ? `${SYSTEM_PROMPTS[interviewType]}\n\n### JOB DESCRIPTION ###\n${jobDescription}\n\nUse the above job description to tailor your interview questions and evaluate the candidate's responses in the context of this specific role.`
          : SYSTEM_PROMPTS[interviewType]
      }
    ];
    
    // Reset feedback
    setFeedback('');
    setIsFeedbackModalOpen(false);
    
    setResponse('');
    setHasStarted(false);
  }, [interviewType, isRecording, isSpeaking, stopRecording, stopSpeaking, jobDescription]);

  // Debug functions
  const checkSessionData = async () => {
    if (!sessionIdRef.current) {
      console.log('No active session');
      return;
    }
    
    try {
      const sessionData = await getSessionData(sessionIdRef.current);
      console.log('Current session data:', sessionData);
    } catch (error) {
      console.error('Error checking session data:', error);
    }
  };

  const listAllSessions = async () => {
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    try {
      const sessions = await listUserSessions(user.uid);
      console.log('All sessions for current user:', sessions);
    } catch (error) {
      console.error('Error listing sessions:', error);
    }
  };

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
            
            {/* Job Description Input */}
            {!hasStarted && (
              <div className="mt-4 mb-6">
                <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description (optional):
                </label>
                <textarea
                  id="job-description"
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste the job description here to tailor the interview questions to the specific role."
                  disabled={isRecording || isProcessing || isSpeaking || hasStarted}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Adding a job description will help the AI interviewer ask more relevant questions for the specific role.
                </p>
              </div>
            )}
            
            {hasStarted && (
              <div className="mb-4 flex justify-between">
                <div className="text-sm text-gray-600">
                  {sessionIdRef.current && (
                    <div className="flex items-center">
                      <span>
                        Session ID: {sessionIdRef.current.split('_')[1] || 'local'} | 
                        Tokens: {totalTokensRef.current}
                      </span>
                      {process.env.NODE_ENV === 'development' && (
                        <div className="ml-2">
                          <button
                            onClick={checkSessionData}
                            className="text-xs text-blue-500 hover:text-blue-700 mr-2"
                            title="Check current session data in console"
                          >
                            (debug session)
                          </button>
                          <button
                            onClick={listAllSessions}
                            className="text-xs text-blue-500 hover:text-blue-700"
                            title="List all sessions in console"
                          >
                            (list all)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {response && (
                    <>
                      <button
                        onClick={endInterview}
                        disabled={isRecording || isProcessing || isGeneratingFeedback}
                        className="flex items-center text-sm px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        {isGeneratingFeedback ? 'Generating Feedback...' : 'End Interview'}
                      </button>
                      <button
                        onClick={startNewInterview}
                        disabled={isRecording || isProcessing || isGeneratingFeedback}
                        className="flex items-center text-sm px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Start New Interview
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowConversation(!showConversation)}
                    className="flex items-center text-sm px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {showConversation ? 'Hide Conversation' : 'Show Conversation'}
                  </button>
                </div>
              </div>
            )}
            
            {showConversation && conversationRef.current.length > 1 && (
              <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
                <ConversationDisplay messages={conversationRef.current} />
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
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        feedback={feedback}
        messages={conversationRef.current}
        interviewType={interviewType}
      />
    </div>
  );
}

export default App;