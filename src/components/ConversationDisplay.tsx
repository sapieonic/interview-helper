import React from 'react';
import formatResponseWithCodeHighlighting from '../utils/formatResponse';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  originalContent?: string;
}

interface ConversationDisplayProps {
  messages: ConversationMessage[];
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ messages }) => {
  // Filter out system messages
  const visibleMessages = messages.filter(msg => msg.role !== 'system');
  
  if (visibleMessages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No conversation yet. Start speaking to begin the interview.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {visibleMessages.map((message, index) => (
        <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
          <div className="font-medium text-gray-700 mb-1">
            {message.role === 'user' ? 'You:' : 'AI Interviewer:'}
          </div>
          
          {message.role === 'user' ? (
            <div>
              {/* OpenAI transcription */}
              <div 
                className="text-gray-600 whitespace-pre-line"
                dangerouslySetInnerHTML={{ 
                  __html: formatResponseWithCodeHighlighting(message.content) 
                }}
              />
              
              {/* Original speech in brackets */}
              {message.originalContent && (
                <div className="mt-1 text-gray-500 italic whitespace-pre-line">
                  [Original: {message.originalContent}]
                </div>
              )}
            </div>
          ) : (
            <div 
              className="text-gray-600 whitespace-pre-line"
              dangerouslySetInnerHTML={{ 
                __html: formatResponseWithCodeHighlighting(message.content) 
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationDisplay; 