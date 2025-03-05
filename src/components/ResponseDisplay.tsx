import React from 'react';
import formatResponseWithCodeHighlighting from '../utils/formatResponse';

interface ResponseDisplayProps {
  response: string;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 md:p-4 mb-6 min-h-[150px] md:min-h-[200px] max-h-[300px] md:max-h-[400px] overflow-y-auto text-sm md:text-base">
      {response ? (
        <div 
          className="whitespace-pre-wrap" 
          dangerouslySetInnerHTML={{ __html: formatResponseWithCodeHighlighting(response) }}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Ready for your interview</p>
          <p className="text-gray-400 text-sm mt-2">Click the microphone button below to start speaking</p>
        </div>
      )}
    </div>
  );
};

export default ResponseDisplay; 