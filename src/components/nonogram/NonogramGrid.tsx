import React, { useState, useEffect } from 'react';
import { GridPreset } from './types';
import { ImageParams } from './types';

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
  imageParams: ImageParams;
  onImageParamChange: (param: keyof ImageParams, value: number | boolean) => void;
}

export const NonogramGrid: React.FC<NonogramGridProps> = ({
  grid,
  currentPreset,
  zoom,
  shortcutsEnabled,
  onToggleCell,
  imageParams,
  onImageParamChange,
}) => {
  // Add state for tracking mouse.
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [lastCell, setLastCell] = useState<{ row: number; col: number } | null>(null);
  // Add state for grid visibility
  const [showGrid, setShowGrid] = useState(true);
  // Add state for hint visibility
  const [showHints, setShowHints] = useState(true);
  // Add state for panning
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState<{ x: number, y: number } | null>(null);
  const [isModifierPressed, setIsModifierPressed] = useState(false);

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

  // Helper function to check if modifier key is pressed
  const isModifierKeyPressed = (e: React.MouseEvent | KeyboardEvent) => {
    return e.ctrlKey || e.metaKey; // Check for both Ctrl (Windows) and Command (Mac)
  };

  // Add useEffect to track modifier key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModifierKeyPressed(e)) {
        setIsModifierPressed(true);
        document.querySelector('.nonogram-grid')?.classList.add('can-pan');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isModifierKeyPressed(e)) {
        setIsModifierPressed(false);
        document.querySelector('.nonogram-grid')?.classList.remove('can-pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle mouse down event
  const handleMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (isModifierKeyPressed(e) && grid.length > 0) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      return;
    }

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

  // Handle mouse move for panning
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !lastPanPosition) return;

    const deltaX = (e.clientX - lastPanPosition.x) / 300; // Adjusted sensitivity
    const deltaY = (e.clientY - lastPanPosition.y) / 300;

    const newPanX = Math.min(Math.max(imageParams.panX - deltaX, 0), 1);
    const newPanY = Math.min(Math.max(imageParams.panY - deltaY, 0), 1);

    onImageParamChange('panX', newPanX);
    onImageParamChange('panY', newPanY);

    setLastPanPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    setIsPanning(false);
    setLastPanPosition(null);
    setIsDrawing(false);
    setIsErasing(false);
    setLastCell(null);
  };

  // Handle mouse leave event
  const handleMouseLeave = () => {
    setIsPanning(false);
    setLastPanPosition(null);
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

  // Add wheel handler for zoom control
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Only handle zoom if we have content
    if (!grid || grid.length === 0) return;
    
    // Calculate new zoom value with increased sensitivity
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(Math.max(imageParams.zoom + delta, 1), 10); // Match the zoom range from ImageProcessingControls
    
    // Update zoom if changed
    if (newZoom !== imageParams.zoom) {
      onImageParamChange('zoom', newZoom);
    }
  }, [grid, imageParams.zoom, onImageParamChange]);

  // Add useEffect to prevent default scroll behavior
  React.useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (e.target instanceof Element && e.target.closest('.nonogram-grid')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventScroll, { passive: false });
    return () => window.removeEventListener('wheel', preventScroll);
  }, []);

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center w-full h-full overflow-hidden nonogram-grid
        ${isPanning ? 'cursor-grabbing' : ''}
        ${isModifierPressed ? 'cursor-grab' : ''}
        ${isModifierPressed && isPanning ? 'cursor-grabbing' : ''}
      `}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
    >
      <style>
        {`
          .nonogram-grid.can-pan {
            cursor: grab !important;
          }
          .nonogram-grid.can-pan:active {
            cursor: grabbing !important;
          }
        `}
      </style>
      <div className="overflow-hidden">
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
                      className={`
                        relative cursor-pointer overflow-hidden
                        ${showGrid ? 'border border-gray-200' : ''}
                        before:absolute before:inset-0 before:opacity-0 before:transition-opacity
                        hover:before:opacity-10 before:bg-black
                      `}
                      style={{ 
                        width: cellSize, 
                        height: cellSize, 
                        backgroundColor: cellValue === 'none' ? 'white' : cellValue
                      }}
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
    </div>
  );
};