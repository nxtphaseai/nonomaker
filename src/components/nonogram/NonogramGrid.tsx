import React, { useState, useEffect } from 'react';
import { GridPreset } from './types';

interface NonogramGridProps {
  grid: string[][];
  currentPreset: GridPreset;
  zoom: number;
  offsetX: number;
  offsetY: number;
  isRKeyPressed: boolean;
  processing: boolean;
  onToggleCell: (row: number, col: number) => void;
}

export const NonogramGrid: React.FC<NonogramGridProps> = ({
  grid,
  currentPreset,
  zoom,
  offsetX,
  offsetY,
  processing,
  onToggleCell,
}) => {
  // Add state for tracking mouse
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastCell, setLastCell] = useState<{ row: number; col: number } | null>(null);
  // Add state for grid visibility
  const [showGrid, setShowGrid] = useState(true);

  // Add effect for handling 'T' key press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't') {
        setShowGrid(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle mouse down event
  const handleMouseDown = (row: number, col: number) => {
    if (processing) return;
    setIsDrawing(true);
    onToggleCell(row, col);
    setLastCell({ row, col });
  };

  // Handle mouse enter event while drawing
  const handleMouseEnter = (row: number, col: number) => {
    if (!isDrawing || processing) return;
    
    // Only toggle if we're entering a new cell
    if (!lastCell || lastCell.row !== row || lastCell.col !== col) {
      onToggleCell(row, col);
      setLastCell({ row, col });
    }
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastCell(null);
  };

  // Handle mouse leave event
  const handleMouseLeave = () => {
    setIsDrawing(false);
    setLastCell(null);
  };

  const getRowHints = (row: number) => {
    if (!grid || !grid[row]) return [{ count: 0, color: 'black' }];
    
    const hints = [];
    let currentCount = 0;
    let currentColor = null;
    
    for (let x = 0; x < grid[row].length; x++) {
      const cell = grid[row][x];
      
      if (cell === 'none') {
        if (currentCount > 0) {
          hints.push({ count: currentCount, color: currentColor });
          currentCount = 0;
        }
      } else {
        if (currentCount > 0 && currentColor !== cell) {
          hints.push({ count: currentCount, color: currentColor });
          currentCount = 0;
        }
        currentColor = cell;
        currentCount++;
      }
    }
    
    // Handle remaining count at end of row
    if (currentCount > 0) {
      hints.push({ count: currentCount, color: currentColor });
    }
    
    return hints.length ? hints : [{ count: 0, color: 'black' }];
  };

  const getColumnHints = (col: number) => {
    if (!grid) return [{ count: 0, color: 'black' }];
    
    const hints = [];
    let currentCount = 0;
    let currentColor = null;
    
    for (let y = 0; y < grid.length; y++) {
      if (!grid[y]) continue;
      
      const cell = grid[y][col];
      
      if (cell === 'none') {
        if (currentCount > 0) {
          hints.push({ count: currentCount, color: currentColor });
          currentCount = 0;
        }
      } else {
        if (currentCount > 0 && currentColor !== cell) {
          hints.push({ count: currentCount, color: currentColor });
          currentCount = 0;
        }
        currentColor = cell;
        currentCount++;
      }
    }
    
    // Handle remaining count at end of column
    if (currentCount > 0) {
      hints.push({ count: currentCount, color: currentColor });
    }
    
    return hints.length ? hints : [{ count: 0, color: 'black' }];
  };

  

  const maxRowHints = Math.max(1, ...Array.from({ length: currentPreset.height }, (_, i) => getRowHints(i).length));
  const maxColHints = Math.max(1, ...Array.from({ length: currentPreset.width }, (_, i) => getColumnHints(i).length));

  return (
    <div 
      className="flex flex-col gap-2"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="overflow-auto">
        <div 
          className="grid gap-0 min-w-fit"
          style={{
            gridTemplateColumns: `repeat(${currentPreset.width + maxRowHints}, ${zoom}rem)`,
            gridTemplateRows: `repeat(${currentPreset.height + maxColHints}, ${zoom}rem)`,
          }}
        >
          {Array.from({ length: currentPreset.height + maxColHints }).map((_, gridRow) => (
            <React.Fragment key={gridRow}>
              {Array.from({ length: currentPreset.width + maxRowHints }).map((_, gridCol) => {
                const isHintCell = gridRow < maxColHints || gridCol < maxRowHints;
                const row = gridRow - maxColHints;
                const col = gridCol - maxRowHints;
                
                if (isHintCell) {
                  const isTopLeftCorner = gridRow < maxColHints && gridCol < maxRowHints;
                  const isColumnHint = gridRow < maxColHints && gridCol >= maxRowHints;
                  const isRowHint = gridRow >= maxColHints && gridCol < maxRowHints;
                  
                  if (isTopLeftCorner) {
                    return <div key={`${gridRow}-${gridCol}`} style={{ width: `${zoom}rem`, height: `${zoom}rem` }} />;
                  }
                  
                  if (isColumnHint) {
                    const hints = getColumnHints(col);
                    const hintIndex = hints.length - (maxColHints - gridRow);
                    
                    // Use the computed color from getColumnHints directly, similar to horizontal hints.
                    const hintColor =
                      hintIndex >= 0 && hintIndex < hints.length
                        ? (hints[hintIndex].color === 'red' ? 'text-red-500' : 'text-black')
                        : 'text-black';
                    
                    return (
                      <div 
                        key={`${gridRow}-${gridCol}`} 
                        className={`flex items-center justify-center ${hintColor}`}
                        style={{ width: `${zoom}rem`, height: `${zoom}rem` }}
                      >
                        {hintIndex >= 0 && hintIndex < hints.length ? hints[hintIndex].count : ''}
                      </div>
                    );
                  }

                  if (isRowHint) {
                    const hints = getRowHints(row);
                    const hintIndex = gridCol - (maxRowHints - hints.length);
                    
                    // Use the color already computed by getRowHints to determine the hint's style.
                    const hintColor =
                      hintIndex >= 0 && hintIndex < hints.length
                        ? (hints[hintIndex].color === 'red' ? 'text-red-500' : 'text-black')
                        : 'text-black';
                    
                    return (
                      <div 
                        key={`${gridRow}-${gridCol}`} 
                        className={`flex items-center justify-center ${hintColor}`}
                        style={{ width: `${zoom}rem`, height: `${zoom}rem` }}
                      >
                        {hintIndex >= 0 && hintIndex < hints.length ? hints[hintIndex].count : ''}
                      </div>
                    );
                  }
                } else {
                  const cellValue = grid[row][col];
                  const cellSize = `${zoom}rem`;
                  
                  return (
                    <div
                      key={`${gridRow}-${gridCol}`}
                      className={`relative cursor-pointer transition-colors ${showGrid ? 'border border-gray-200' : ''}`}
                      style={{ width: cellSize, height: cellSize }}
                      onMouseDown={() => handleMouseDown(row, col)}
                      onMouseEnter={() => handleMouseEnter(row, col)}
                    >
                      {cellValue !== 'none' && (
                        <div
                          className={`absolute ${cellValue === 'black' ? 'bg-black' : 'bg-red-500'}`}
                          style={{
                            width: cellSize,
                            height: cellSize,
                            left: `${offsetX * zoom}rem`,
                            top: `${offsetY * zoom}rem`,
                            transition: 'all 0.1s ease-out'
                          }}
                        />
                      )}
                    </div>
                  );
                }
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="text-sm text-gray-500 text-left">
        <p>Press R for a red cell • Ctrl+Z to undo • Ctrl+Shift+Z to redo • Click and drag to draw • Press T to toggle grid</p>
      </div>
    </div>
  );
};