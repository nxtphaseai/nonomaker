import React, { useState } from 'react';
import { GridPreset } from './types';

interface NonogramGridProps {
  grid: string[][];
  currentPreset: GridPreset;
  zoom: number;
  offsetX: number;
  offsetY: number;
  isRKeyPressed: boolean;
  processing: boolean;
  shortcutsEnabled: boolean;
  onToggleCell: (row: number, col: number, overrideColor?: string) => void;
  selectedColor: string;
}

export const NonogramGrid: React.FC<NonogramGridProps> = ({
  grid,
  currentPreset,
  zoom,
  shortcutsEnabled,
  onToggleCell,
}) => {
  // Add state for tracking mouse.
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [lastCell, setLastCell] = useState<{ row: number; col: number } | null>(null);
  // Add state for grid visibility
  const [showGrid, setShowGrid] = useState(true);
  // Add state for hint visibility
  const [showHints, setShowHints] = useState(true);

  // Modify the key press handler
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!shortcutsEnabled) return;
      
      if (e.key.toLowerCase() === 't') {
        setShowGrid(prev => !prev);
      } else if (e.key.toLowerCase() === 'h') {
        setShowHints(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcutsEnabled]);

  // Handle mouse down event
  const handleMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (e.button === 0) { // Left click
      setIsDrawing(true);
      onToggleCell(row, col);
    } else if (e.button === 2) { // Right click
      setIsErasing(true);
      onToggleCell(row, col, 'none');
    }
    setLastCell({ row, col });
  };

  // Handle mouse enter event while drawing
  const handleMouseEnter = (row: number, col: number) => {
    if (lastCell?.row === row && lastCell?.col === col) return;
    
    if (isDrawing) {
      onToggleCell(row, col);
    } else if (isErasing) {
      onToggleCell(row, col, 'none');
    }
    setLastCell({ row, col });
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsErasing(false);
    setLastCell(null);
  };

  // Handle mouse leave event
  const handleMouseLeave = () => {
    setIsDrawing(false);
    setIsErasing(false);
    setLastCell(null);
  };

  // Group consecutive cells of the same color in a row
  const getRowHints = (row: number) => {
    if (!grid || !grid[row]) return [{ count: 0, color: 'black' }];
    const hints = [];
    let currentCount = 0;
    let currentColor: string | null = null;

    for (let col = 0; col < grid[row].length; col++) {
      const cellColor = grid[row][col];
      if (cellColor === 'none') {
        if (currentCount > 0 && currentColor) {
          hints.push({ count: currentCount, color: currentColor });
        }
        currentCount = 0;
        currentColor = null;
      } else {
        // If color changes mid-stream, push what we had
        if (currentColor && cellColor !== currentColor) {
          hints.push({ count: currentCount, color: currentColor });
          currentCount = 0;
        }
        currentColor = cellColor;
        currentCount++;
      }
    }

    // End of the row
    if (currentCount > 0 && currentColor) {
      hints.push({ count: currentCount, color: currentColor });
    }

    // If hints is empty, return [ {count: 0, color: 'black'} ]
    return hints.length ? hints : [{ count: 0, color: 'black' }];
  };

  // Group consecutive cells of the same color in a column
  const getColumnHints = (col: number) => {
    if (!grid) return [{ count: 0, color: 'black' }];
    const hints = [];
    let currentCount = 0;
    let currentColor: string | null = null;

    for (let row = 0; row < grid.length; row++) {
      const cellColor = grid[row][col];
      if (!cellColor || cellColor === 'none') {
        if (currentCount > 0 && currentColor) {
          hints.push({ count: currentCount, color: currentColor });
        }
        currentCount = 0;
        currentColor = null;
      } else {
        if (currentColor && cellColor !== currentColor) {
          hints.push({ count: currentCount, color: currentColor });
          currentCount = 0;
        }
        currentColor = cellColor;
        currentCount++;
      }
    }

    // End of the column
    if (currentCount > 0 && currentColor) {
      hints.push({ count: currentCount, color: currentColor });
    }

    return hints.length ? hints : [{ count: 0, color: 'black' }];
  };

  const maxRowHints = showHints ? Math.max(1, ...Array.from({ length: currentPreset.height }, (_, i) => getRowHints(i).length)) : 0;
  const maxColHints = showHints ? Math.max(1, ...Array.from({ length: currentPreset.width }, (_, i) => getColumnHints(i).length)) : 0;

  return (
    <div 
      className="flex flex-col gap-2"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
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
                
                // If hints are hidden and this is a hint cell, don't render anything
                if (!showHints && isHintCell) {
                  return null;
                }

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
                    return (
                      <div 
                        key={`${gridRow}-${gridCol}`} 
                        className="flex items-center justify-center"
                        style={{ 
                          width: `${zoom}rem`, 
                          height: `${zoom}rem`,
                          color: hints[hintIndex]?.color === 'none' ? 'black' : hints[hintIndex]?.color,
                          // Add contrast for light colors
                          textShadow: ['white', 'yellow', 'pink', 'cyan'].includes(hints[hintIndex]?.color) 
                            ? '0 0 1px black' 
                            : 'none'
                        }}
                      >
                        {hintIndex >= 0 && hintIndex < hints.length ? hints[hintIndex].count : ''}
                      </div>
                    );
                  }

                  if (isRowHint) {
                    const hints = getRowHints(row);
                    const hintIndex = gridCol - (maxRowHints - hints.length);
                    return (
                      <div 
                        key={`${gridRow}-${gridCol}`} 
                        className="flex items-center justify-center"
                        style={{ 
                          width: `${zoom}rem`, 
                          height: `${zoom}rem`,
                          color: hints[hintIndex]?.color === 'none' ? 'black' : hints[hintIndex]?.color,
                          // Add contrast for light colors
                          textShadow: ['white', 'yellow', 'pink', 'cyan'].includes(hints[hintIndex]?.color) 
                            ? '0 0 1px black' 
                            : 'none'
                        }}
                      >
                        {hintIndex >= 0 && hintIndex < hints.length ? hints[hintIndex].count : ''}
                      </div>
                    );
                  }
                }

                // Regular cell rendering - adjust row/col calculation when hints are hidden
                const actualRow = showHints ? row : gridRow;
                const actualCol = showHints ? col : gridCol;
                
                // Only render if within grid bounds
                if (actualRow >= 0 && actualRow < grid.length && 
                    actualCol >= 0 && actualCol < grid[0].length) {
                  const cellValue = grid[actualRow][actualCol];
                  const cellSize = `${zoom}rem`;
                  
                  return (
                    <div
                      key={`${gridRow}-${gridCol}`}
                      className={`relative cursor-pointer transition-colors ${showGrid ? 'border border-gray-200' : ''}`}
                      style={{ width: cellSize, height: cellSize, backgroundColor: cellValue === 'none' ? 'white' : cellValue }}
                      onMouseDown={(e) => handleMouseDown(actualRow, actualCol, e)}
                      onMouseEnter={() => handleMouseEnter(actualRow, actualCol)}
                    />
                  );
                }
                return null;
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="text-sm text-gray-500 text-left">
        <p>Ctrl+Z to undo • Ctrl+Shift+Z to redo • Click and drag to draw • Right click to delete • Press T to toggle grid • Press H to toggle hints</p>
      </div>
    </div>
  );
};