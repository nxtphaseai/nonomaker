import React, { useState, useEffect } from 'react';
import { GridPreset } from './types';

interface GridControlsProps {
  selectedPreset: number;
  presets: GridPreset[];
  processing: boolean;
  onPresetChange: (index: number) => void;
  onCustomSizeSet?: (width: number, height: number) => void;
  onClear: () => void;
  onInvert: () => void;
  customWidth: string;
  customHeight: string;
}

export const GridControls: React.FC<GridControlsProps> = ({
  selectedPreset,
  presets,
  processing,
  onPresetChange,
  onCustomSizeSet,
  onClear,
  onInvert,
  customWidth,
  customHeight,
}) => {
  const [localCustomWidth, setLocalCustomWidth] = useState(customWidth);
  const [localCustomHeight, setLocalCustomHeight] = useState(customHeight);

  useEffect(() => {
    setLocalCustomWidth(customWidth);
    setLocalCustomHeight(customHeight);
  }, [customWidth, customHeight]);

  const handleSetCustomSize = () => {
    const width = Math.min(Math.max(parseInt(localCustomWidth) || 20, 5), 100);
    const height = Math.min(Math.max(parseInt(localCustomHeight) || 20, 5), 100);
    onCustomSizeSet?.(width, height);
  };

  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
      <div className="flex gap-4 items-center w-full">
        <label htmlFor="grid-preset" className="sr-only">Grid Size</label>
        <select
          id="grid-preset"
          value={selectedPreset}
          onChange={(e) => onPresetChange(parseInt(e.target.value))}
          disabled={processing}
          className="flex-1 px-3 py-2 rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {presets.map((preset, index) => (
            <option key={preset.label} value={index}>
              {preset.label}
            </option>
          ))}
        </select>
        <button
          onClick={onInvert}
          disabled={processing}
          className="px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm whitespace-nowrap"
        >
          Invert Grid
        </button>
        <button
          onClick={onClear}
          disabled={processing}
          className="px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm whitespace-nowrap"
        >
          Clear Grid
        </button>
      </div>

      {selectedPreset === 0 && (
        <div className="flex gap-2 items-center mt-2">
          <input
            type="number"
            value={localCustomWidth}
            onChange={(e) => setLocalCustomWidth(e.target.value)}
            min="5"
            max="100"
            className="w-20 px-3 py-2 rounded-md border border-gray-200"
            placeholder="Width"
          />
          <span>×</span>
          <input
            type="number"
            value={localCustomHeight}
            onChange={(e) => setLocalCustomHeight(e.target.value)}
            min="5"
            max="100"
            className="w-20 px-3 py-2 rounded-md border border-gray-200"
            placeholder="Height"
          />
          <button
            onClick={handleSetCustomSize}
            disabled={processing}
            className="px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
          >
            Set
          </button>
        </div>
      )}
    </div>
  );
};
