import React from 'react';
import { Droplet } from 'lucide-react';
import { Tool } from './types';

interface FillToolProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

export const FillTool: React.FC<FillToolProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  return (
    <button
      onClick={() => onToolSelect('fill')}
      className={`
        p-2 rounded-md transition-all
        ${selectedTool === 'fill' 
          ? 'bg-blue-500 text-white' 
          : 'bg-white border border-gray-200 hover:bg-gray-50'
        }
      `}
      title="Fill Tool (F)"
    >
      <Droplet className="w-5 h-5" />
    </button>
  );
}; 