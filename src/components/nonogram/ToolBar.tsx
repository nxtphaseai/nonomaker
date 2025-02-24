import React from 'react';
import { Pencil, Eraser } from 'lucide-react';

export type Tool = 'draw' | 'erase';

interface ToolBarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
      <label className="text-sm font-medium">Tools:</label>
      <div className="flex gap-2">
        <button
          onClick={() => onToolSelect('draw')}
          className={`
            p-2 rounded-md transition-all
            ${selectedTool === 'draw' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white border border-gray-200 hover:bg-gray-50'
            }
          `}
          title="Draw Tool (D)"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onToolSelect('erase')}
          className={`
            p-2 rounded-md transition-all
            ${selectedTool === 'erase' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white border border-gray-200 hover:bg-gray-50'
            }
          `}
          title="Erase Tool (E)"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}; 