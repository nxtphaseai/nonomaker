import React from 'react';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const ZoomControl: React.FC<ZoomControlProps> = ({
  zoom,
  onZoomChange,
}) => {
  return (
    <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-lg">
      <label htmlFor="grid-zoom" className="text-sm font-medium">Grid Zoom:</label>
      <input
        id="grid-zoom"
        type="range"
        min="0.5"
        max="3"
        step="0.1"
        value={zoom}
        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        className="w-32"
      />
      <span className="text-sm">{Math.round(zoom * 100)}%</span>
    </div>
  );
};
