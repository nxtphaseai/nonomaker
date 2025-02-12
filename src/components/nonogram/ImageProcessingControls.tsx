import React, { useState } from 'react';
import { ImageParams } from './types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ImageProcessingControlsProps {
  imageParams: ImageParams;
  onParamChange: (param: string, value: number | boolean) => void;
  show: boolean;
  processing?: boolean;
}

export const ImageProcessingControls: React.FC<ImageProcessingControlsProps> = ({
  imageParams,
  onParamChange,
  show,
  processing = false,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    positionScale: true,
    imageAdjustments: true,
    colorWeights: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!show) return null;

  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium mb-2">Image Processing</h4>

      {/* Position & Scale Section */}
      <Collapsible open={expandedSections.positionScale}>
        <CollapsibleTrigger 
          className="flex w-full items-center justify-between text-sm font-medium mb-2"
          onClick={() => toggleSection('positionScale')}
        >
          <span>Position & Scale</span>
          {expandedSections.positionScale ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Image Adjustments Section */}
      <Collapsible open={expandedSections.imageAdjustments}>
        <CollapsibleTrigger 
          className="flex w-full items-center justify-between text-sm font-medium mb-2"
          onClick={() => toggleSection('imageAdjustments')}
        >
          <span>Image Adjustments</span>
          {expandedSections.imageAdjustments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => onParamChange('inverted', !imageParams.inverted)}
              disabled={processing}
              className={`px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${imageParams.inverted 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {imageParams.inverted ? 'Normal' : 'Invert'}
            </button>
            
            <button
              onClick={() => onParamChange('flipped', !imageParams.flipped)}
              disabled={processing}
              className={`px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${imageParams.flipped 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {imageParams.flipped ? 'Normal' : 'Flip'}
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Color Weights Section */}
      <Collapsible open={expandedSections.colorWeights}>
        <CollapsibleTrigger 
          className="flex w-full items-center justify-between text-sm font-medium mb-2"
          onClick={() => toggleSection('colorWeights')}
        >
          <span>Color Weights</span>
          {expandedSections.colorWeights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
