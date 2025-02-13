import { ImageParams } from './types';

export const ImageAdjustment: React.FC<{
  imageParams: ImageParams;
  onParamChange: (param: keyof ImageParams, value: number | boolean) => void;
}> = ({ imageParams, onParamChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm" htmlFor="brightness">Brightness</label>
        <input
          id="brightness"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={imageParams.brightnessThreshold}
          onChange={(e) => onParamChange('brightnessThreshold', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm" htmlFor="contrast">Contrast</label>
        <input
          id="contrast"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={imageParams.contrast}
          onChange={(e) => onParamChange('contrast', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}; 