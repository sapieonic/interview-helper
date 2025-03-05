import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            disabled={isProcessing}
            className={`bg-blue-600 text-white rounded-full p-4 md:p-6 hover:bg-blue-700 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? 
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" /> : 
              <Mic className="w-6 h-6 md:w-8 md:h-8" />
            }
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="bg-red-600 text-white rounded-full p-4 md:p-6 hover:bg-red-700 transition-colors"
          >
            <Square className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}
      </div>
      
      <div className="mt-3 md:mt-4 text-center text-xs md:text-sm text-gray-500">
        {isRecording ? (
          <div className="text-red-500 font-medium flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
            <span className="text-xs md:text-sm">Recording... (will auto-stop after silence)</span>
          </div>
        ) : (
          <div className="text-xs md:text-sm px-2">
            Click the microphone to start recording your answer, and the square to stop and process
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordButton; 