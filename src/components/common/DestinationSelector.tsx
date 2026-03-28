import React from 'react';
import { Send } from 'lucide-react';
import { DESTINATIONS } from '../../constants/destinations';
import { VisitStatus } from '../../types';

interface DestinationSelectorProps {
  selectedDestination: VisitStatus;
  onChange: (destination: VisitStatus) => void;
  label?: string;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({ 
  selectedDestination, 
  onChange,
  label = "ส่งต่อไปยังขั้นตอนถัดไป"
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
        <Send size={16} className="text-blue-600" />
        {label}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {DESTINATIONS.map((dest) => (
          <button
            key={dest.value}
            type="button"
            onClick={() => onChange(dest.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex flex-col gap-1 ${
              selectedDestination === dest.value
                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="opacity-70">ขั้นตอน:</span>
            <span className="font-bold">{dest.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
