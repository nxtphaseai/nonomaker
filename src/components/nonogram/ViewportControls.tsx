import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface ContentMoveControlsProps {
  contentOffset: { x: number, y: number };
  onContentOffsetChange: (offset: { x: number, y: number }) => void;
}

export const ViewportControls: React.FC<ContentMoveControlsProps> = ({
  contentOffset,
  onContentOffsetChange,
}) => {
  // Ensure contentOffset is always a valid object
  const safeOffset = contentOffset || { x: 0, y: 0 };
  
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {

    
    // Create a new object to avoid mutation
    let newOffset = { 
      x: typeof safeOffset.x === 'number' ? safeOffset.x : 0,
      y: typeof safeOffset.y === 'number' ? safeOffset.y : 0
    };
    
    switch (direction) {
      case 'up':
        newOffset.y = -1; // Move content up
        break;
      case 'down':
        newOffset.y = 1; // Move content down
        break;
      case 'left':
        newOffset.x = -1; // Move content left
        break;
      case 'right':
        newOffset.x = 1; // Move content right
        break;
    }
    
    // Ensure we're passing a valid object to the callback
    if (typeof onContentOffsetChange === 'function') {
      onContentOffsetChange(newOffset);
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Move Content</h4>
      </div>
      
      <div className="flex flex-col items-center gap-1">
        <div className="flex justify-center">
          <button
            onClick={() => handleMove('up')}
            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            title="Move content up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex justify-center gap-1">
          <button
            onClick={() => handleMove('left')}
            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            title="Move content left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {/* Empty space where the middle icon was */}
          <div className="w-10 h-10"></div>
          
          <button
            onClick={() => handleMove('right')}
            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            title="Move content right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => handleMove('down')}
            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            title="Move content down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}; 