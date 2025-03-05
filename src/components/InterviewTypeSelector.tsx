import React from 'react';
import { InterviewType } from '../services/openai';
import { Code, Headphones } from 'lucide-react';

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
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Interview Type:
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onTypeChange('software-engineer')}
          disabled={disabled}
          className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            selectedType === 'software-engineer'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className={`p-2 rounded-md mr-3 ${selectedType === 'software-engineer' ? 'bg-blue-500' : 'bg-blue-100'}`}>
            <Code className={`w-5 h-5 ${selectedType === 'software-engineer' ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div className="text-left">
            <div className="font-medium">Software Engineer</div>
            <div className={`text-xs mt-1 ${selectedType === 'software-engineer' ? 'text-blue-100' : 'text-gray-500'}`}>
              Coding, system design, algorithms
            </div>
          </div>
        </button>
        
        <button
          onClick={() => onTypeChange('technical-product-support')}
          disabled={disabled}
          className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            selectedType === 'technical-product-support'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className={`p-2 rounded-md mr-3 ${selectedType === 'technical-product-support' ? 'bg-blue-500' : 'bg-blue-100'}`}>
            <Headphones className={`w-5 h-5 ${selectedType === 'technical-product-support' ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div className="text-left">
            <div className="font-medium">Technical Support</div>
            <div className={`text-xs mt-1 ${selectedType === 'technical-product-support' ? 'text-blue-100' : 'text-gray-500'}`}>
              Troubleshooting, customer service
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default InterviewTypeSelector; 