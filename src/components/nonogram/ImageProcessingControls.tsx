import React from 'react';
import { ImageParams } from './types';

interface ImageProcessingControlsProps {
  imageParams: ImageParams;
  onParamChange: (param: keyof ImageParams, value: number) => Promise<void>;
  show: boolean;
  processing: boolean;
}

export const ImageProcessingControls: React.FC<ImageProcessingControlsProps> = ({
  imageParams,
  onParamChange,
  show,
}) => {
  if (!show) return null;

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium mb-2">Image Processing</h4>

      {/* Image Position Controls */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium mb-2">Position & Scale</h4>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="zoom">Zoom</label>
          <input
            id="zoom"
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={imageParams.zoom}
            onChange={(e) => onParamChange('zoom', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm" htmlFor="pan-x">Pan X</label>
              <input
                id="pan-x"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={imageParams.panX}
                onChange={(e) => onParamChange('panX', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm" htmlFor="pan-y">Pan Y</label>
              <input
                id="pan-y"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={imageParams.panY}
                onChange={(e) => onParamChange('panY', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm" htmlFor="stretch-x">Stretch X</label>
            <input
              id="stretch-x"
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={imageParams.stretchX}
              onChange={(e) => onParamChange('stretchX', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm" htmlFor="stretch-y">Stretch Y</label>
            <input
              id="stretch-y"
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={imageParams.stretchY}
              onChange={(e) => onParamChange('stretchY', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Image Adjustments */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium mb-2">Image Adjustments</h4>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="brightness-threshold">Brightness Threshold</label>
          <input
            id="brightness-threshold"
            type="range"
            min="0"
            max="255"
            value={imageParams.brightnessThreshold}
            onChange={(e) => onParamChange('brightnessThreshold', parseInt(e.target.value))}
            className="w-full"
          />
          <label className="text-sm" htmlFor="contrast">Contrast</label>
          <input
            id="contrast"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={imageParams.contrast}
            onChange={(e) => onParamChange('contrast', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Color Weights */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium mb-2">Color Weights</h4>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="red-weight">Red Weight</label>
          <input
            id="red-weight"
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={imageParams.redWeight}
            onChange={(e) => onParamChange('redWeight', parseFloat(e.target.value))}
            className="w-full"
          />
          <label className="text-sm" htmlFor="green-weight">Green Weight</label>
          <input
            id="green-weight"
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={imageParams.greenWeight}
            onChange={(e) => onParamChange('greenWeight', parseFloat(e.target.value))}
            className="w-full"
          />
          <label className="text-sm" htmlFor="blue-weight">Blue Weight</label>
          <input
            id="blue-weight"
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={imageParams.blueWeight}
            onChange={(e) => onParamChange('blueWeight', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
