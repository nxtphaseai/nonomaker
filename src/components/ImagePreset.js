import React, { useState } from 'react';

function ImagePreset({ preset, onSelect, selected }) {
  return (
    <div 
      className={`preset ${selected ? 'selected' : ''}`} 
      onClick={() => onSelect(preset)}
    >
      <div className="preset-image">
        <img
          src={preset.image}
          style={{
            width: `${preset.width}px`,
            height: `${preset.height}px`
          }}
          alt={preset.name}
        />
      </div>

      <style jsx>{`
        .scale-controls {
          margin: 10px 0;
        }
        .scale-control {
          margin-bottom: 8px;
        }
        .scale-control label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .scale-control input {
          width: 100%;
        }
        // ... rest of existing styles ...
      `}</style>
    </div>
  );
}

export default ImagePreset; 