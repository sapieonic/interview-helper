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
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <label htmlFor="voice-select" className="text-sm font-medium text-gray-700">Voice:</label>
        <select 
          id="voice-select"
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value as VoiceOption)}
          className="border rounded px-2 py-1 text-sm bg-gray-50"
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
          className="flex items-center space-x-1 text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 bg-red-50"
        >
          <VolumeX size={16} />
          <span className="text-sm">Stop</span>
        </button>
      )}
    </div>
  );
};

export default VoiceSelector; 