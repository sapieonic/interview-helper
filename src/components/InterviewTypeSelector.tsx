import React from 'react';
import { InterviewType } from '../services/openai';

interface InterviewTypeSelectorProps {
  selectedType: InterviewType;
  onTypeChange: (type: InterviewType) => void;
  disabled: boolean;
}

const InterviewTypeSelector: React.FC<InterviewTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Interview Type:
      </label>
      <div className="flex space-x-4">
        <button
          onClick={() => onTypeChange('software-engineer')}
          disabled={disabled}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedType === 'software-engineer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Software Engineer
        </button>
        <button
          onClick={() => onTypeChange('technical-product-support')}
          disabled={disabled}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedType === 'technical-product-support'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Technical Product Support
        </button>
      </div>
    </div>
  );
};

export default InterviewTypeSelector; 