import React, { useState } from 'react';
import ImagePreset from './ImagePreset';

function ImageGenerator() {
  const [selectedPreset, setSelectedPreset] = useState(null);

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
  };

  return (
    <div className="container">
      <div className="settings">
        <h3>Color Weight</h3>

        <ImagePreset 
          key={preset.name}
          preset={preset}
          selected={selectedPreset === preset}
          onSelect={handlePresetSelect}
        />

        <style jsx>{`
          .scale-controls {
            margin: 20px 0;
          }
          .scale-control {
            margin-bottom: 12px;
          }
          .scale-control label {
            display: block;
            margin-bottom: 4px;
          }
          .scale-control input {
            width: 100%;
          }
        `}</style>
      </div>
    </div>
  );
}

export default ImageGenerator; 