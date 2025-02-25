import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, CornerUpLeft } from 'lucide-react';

interface ContentMoveControlsProps {
  contentOffset: { x: number, y: number };
  onContentOffsetChange: (offset: { x: number, y: number }) => void;
}

export const ViewportControls: React.FC<ContentMoveControlsProps> = ({
  contentOffset,
  onContentOffsetChange,
}) => {
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 1; // Move by 1 cell at a time
    
    let newOffset = { ...contentOffset };
    
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
    
    onContentOffsetChange(newOffset);
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
          
          <div className="w-10 h-10 flex items-center justify-center">
            <button
              onClick={() => onContentOffsetChange({ x: 0, y: 0 })}
              className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              title="Reset content position"
            >
              <CornerUpLeft className="w-4 h-4" />
            </button>
          </div>
          
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