import React from 'react';

interface PanControlsProps {
  offsetX: number;
  offsetY: number;
  onPanChange: (axis: 'x' | 'y', value: number) => void;
}

export const PanControls: React.FC<PanControlsProps> = ({
  offsetX,
  offsetY,
  onPanChange,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium mb-2">Cell Offset Controls</h4>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm" htmlFor="pan-x">Offset X ({offsetX} cells)</label>
            <button 
              onClick={() => onPanChange('x', 0)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Reset
            </button>
          </div>
          <input
            id="pan-x"
            type="range"
            min="-50"
            max="50"
            step="1"
            value={offsetX}
            onChange={(e) => onPanChange('x', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm" htmlFor="pan-y">Offset Y ({offsetY} cells)</label>
            <button 
              onClick={() => onPanChange('y', 0)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Reset
            </button>
          </div>
          <input
            id="pan-y"
            type="range"
            min="-50"
            max="50"
            step="1"
            value={offsetY}
            onChange={(e) => onPanChange('y', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}; 