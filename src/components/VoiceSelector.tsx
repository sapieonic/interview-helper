import React from 'react';
import { VolumeX, Volume2 } from 'lucide-react';

type VoiceOption = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onVoiceChange,
  isSpeaking,
  onStopSpeaking
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-3 space-y-2 md:space-y-0 w-full md:w-auto">
      <div className="flex items-center space-x-2 w-full md:w-auto">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-2 py-1 w-full md:w-auto">
          <Volume2 className="w-4 h-4 text-blue-500 mr-2" />
          <select 
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value as VoiceOption)}
            className="text-sm bg-transparent border-none focus:ring-0 focus:outline-none py-1 pr-6 pl-0 flex-grow md:flex-grow-0"
            disabled={isSpeaking}
          >
            <option value="alloy">Alloy Voice</option>
            <option value="echo">Echo Voice</option>
            <option value="fable">Fable Voice</option>
            <option value="onyx">Onyx Voice</option>
            <option value="nova">Nova Voice</option>
            <option value="shimmer">Shimmer Voice</option>
          </select>
        </div>
      </div>
      
      {isSpeaking && (
        <button 
          onClick={onStopSpeaking}
          className="flex items-center space-x-1 text-red-600 hover:text-red-800 px-3 py-1 rounded-md border border-red-200 bg-red-50 text-xs md:text-sm w-full md:w-auto justify-center md:justify-start transition-colors hover:bg-red-100"
        >
          <VolumeX size={16} />
          <span>Stop Speaking</span>
        </button>
      )}
    </div>
  );
};

export default VoiceSelector; 