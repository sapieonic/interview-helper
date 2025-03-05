import React from 'react';
import formatResponseWithCodeHighlighting from '../utils/formatResponse';

interface ResponseDisplayProps {
  response: string;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[200px] max-h-[400px] overflow-y-auto">
      {response ? (
        <div 
          className="whitespace-pre-wrap" 
          dangerouslySetInnerHTML={{ __html: formatResponseWithCodeHighlighting(response) }}
        />
      ) : (
        <div className="text-gray-400 italic">
          The interviewer will respond here after you speak...
        </div>
      )}
    </div>
  );
};

export default ResponseDisplay; 