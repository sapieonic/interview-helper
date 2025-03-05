import React from 'react';
import formatResponseWithCodeHighlighting from '../utils/formatResponse';

interface ResponseDisplayProps {
  response: string;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 min-h-[150px] md:min-h-[200px] max-h-[300px] md:max-h-[400px] overflow-y-auto text-sm md:text-base">
      {response ? (
        <div 
          className="whitespace-pre-wrap" 
          dangerouslySetInnerHTML={{ __html: formatResponseWithCodeHighlighting(response) }}
        />
      ) : (
        <div className="text-gray-400 italic text-sm md:text-base">
          The interviewer will respond here after you speak...
        </div>
      )}
    </div>
  );
};

export default ResponseDisplay; 