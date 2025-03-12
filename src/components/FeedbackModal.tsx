import React, { useState } from 'react';
import { generatePDF } from '../utils/pdfGenerator';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: string;
  messages: { role: 'user' | 'assistant' | 'system', content: string, originalContent?: string }[];
  interviewType: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  feedback, 
  messages,
  interviewType
}) => {
  const [showTranscriptions, setShowTranscriptions] = useState(false);
  
  if (!isOpen) return null;
  
  const handleDownloadPDF = async () => {
    try {
      await generatePDF(messages, feedback, interviewType);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };
  
  // Filter out system messages
  const visibleMessages = messages.filter(msg => msg.role !== 'system');
  
  // Count messages with differences between original and OpenAI transcription
  const messagesWithDifferences = visibleMessages.filter(
    msg => msg.role === 'user' && msg.originalContent && msg.originalContent !== msg.content
  ).length;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Interview Feedback</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {/* Toggle button for showing transcriptions */}
          <div className="mb-4 flex justify-between items-center">
            <div>
              {messagesWithDifferences > 0 && (
                <div className="text-sm text-blue-600">
                  <span className="font-medium">{messagesWithDifferences}</span> message{messagesWithDifferences !== 1 ? 's' : ''} with differences between original speech and AI transcription
                </div>
              )}
            </div>
            <button
              onClick={() => setShowTranscriptions(!showTranscriptions)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {showTranscriptions ? 'Hide Conversation' : 'Show Conversation'}
            </button>
          </div>
          
          {/* Conversation section */}
          {showTranscriptions && (
            <div className="mb-8 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Interview Conversation</h3>
              
              <div className="space-y-4">
                {visibleMessages.map((message, index) => (
                  <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
                    <div className="font-medium text-gray-700 mb-1">
                      {message.role === 'user' ? 'You:' : 'AI Interviewer:'}
                    </div>
                    
                    {message.role === 'user' ? (
                      <div>
                        {/* OpenAI transcription */}
                        <div className="text-gray-600 whitespace-pre-line">{message.content}</div>
                        
                        {/* Original speech in brackets */}
                        {message.originalContent && (
                          <div className="mt-1 text-gray-500 italic whitespace-pre-line">
                            [Original: {message.originalContent}]
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-600 whitespace-pre-line">{message.content}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Feedback section */}
          <h3 className="text-lg font-semibold mb-4">Feedback</h3>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: feedback.replace(/\n/g, '<br />') 
            }} 
          />
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal; 