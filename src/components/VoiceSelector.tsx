import React from 'react';
import { VolumeX } from 'lucide-react';

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
        <label htmlFor="voice-select" className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Voice:</label>
        <select 
          id="voice-select"
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value as VoiceOption)}
          className="border rounded px-2 py-1 text-xs md:text-sm bg-gray-50 flex-grow md:flex-grow-0"
          disabled={isSpeaking}
        >
          <option value="alloy">Alloy</option>
          <option value="echo">Echo</option>
          <option value="fable">Fable</option>
          <option value="onyx">Onyx</option>
          <option value="nova">Nova</option>
          <option value="shimmer">Shimmer</option>
        </select>
      </div>
      
      {isSpeaking && (
        <button 
          onClick={onStopSpeaking}
          className="flex items-center space-x-1 text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 bg-red-50 text-xs md:text-sm w-full md:w-auto justify-center md:justify-start"
        >
          <VolumeX size={16} />
          <span>Stop</span>
        </button>
      )}
    </div>
  );
};

export default VoiceSelector; 