import React from 'react';
import { GridPreset } from './types';

interface GridControlsProps {
  selectedPreset: number;
  presets: GridPreset[];
  processing: boolean;
  onPresetChange: (index: number) => void;
  onClear: () => void;
}

export const GridControls: React.FC<GridControlsProps> = ({
  selectedPreset,
  presets,
  processing,
  onPresetChange,
  onClear,
}) => {
  return (
    <div className="flex gap-2 items-center bg-gray-50 p-4 rounded-lg">
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
          onClick={onClear}
          disabled={processing}
          className="px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm whitespace-nowrap"
        >
          Clear Grid
        </button>
      </div>
    </div>
  );
};
