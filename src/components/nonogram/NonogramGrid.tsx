import React, { useState, useEffect, useRef } from 'react';
import { GridPreset } from './types';
import { ImageParams } from './types';
import { toast } from "@/components/ui/use-toast";

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
  selectedTool: string;
  onToggleMultipleCells: (cells: [number, number][], color: string) => void;
  contentOffset?: { x: number, y: number };
  onContentOffsetChange?: (offset: { x: number, y: number }) => void;
}

export const NonogramGrid: React.FC<NonogramGridProps> = ({
  grid,
  currentPreset,
  zoom,
  shortcutsEnabled,
  onToggleCell,
  imageParams,
  onImageParamChange,
  selectedTool,
  selectedColor,
  onToggleMultipleCells,
  contentOffset: externalContentOffset,
  onContentOffsetChange,
}) => {
  // Add state for tracking mouse.
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [lastCell, setLastCell] = useState<{ row: number; col: number } | null>(null);
  // Add state for grid visibility
  const [showGrid, setShowGrid] = useState(true);
  // Add state for hint visibility
  const [showHints, setShowHints] = useState(false);
  // Add state for panning
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState<{ x: number, y: number } | null>(null);
  const [isModifierPressed, setIsModifierPressed] = useState(false);
  // Add state for viewport position
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [lastDragPosition, setLastDragPosition] = useState<{ x: number, y: number } | null>(null);
  // Add state for content offset
  const [internalContentOffset, setInternalContentOffset] = useState({ x: 0, y: 0 });
  const [isDraggingContent, setIsDraggingContent] = useState(false);
  // Add a buffer state to store cells that move outside the viewport
  const [offScreenBuffer, setOffScreenBuffer] = useState<Map<string, string>>(new Map());

  // Use external state if provided, otherwise use internal state
  const contentOffset = externalContentOffset || internalContentOffset;
  

  // Update the useEffect that handles content offset changes
  useEffect(() => {
    if (!externalContentOffset) return;
    
    // Ensure we have valid numbers
    const currentX = typeof externalContentOffset.x === 'number' ? externalContentOffset.x : 0;
    const currentY = typeof externalContentOffset.y === 'number' ? externalContentOffset.y : 0;
    
    // Only proceed if there's an actual change
    if (currentX === 0 && currentY === 0) return;
    
    // Store the current values before resetting
    const deltaX = currentX;
    const deltaY = currentY;
    
    // Apply the content shift
    shiftGridContent(deltaX, deltaY);
    
    // Reset the content offset after shifting
    // Use a small delay to avoid state update conflicts
    if (onContentOffsetChange) {
      setTimeout(() => {
        onContentOffsetChange({ x: 0, y: 0 });
      }, 50);
    }
    
  }, [externalContentOffset]);

  // Update the setContentOffset function to use the prop callback if available
  const setContentOffset = (newOffset: { x: number, y: number } | ((prev: { x: number, y: number }) => { x: number, y: number })) => {
    if (typeof newOffset === 'function') {
      const calculatedOffset = newOffset(contentOffset);
      if (onContentOffsetChange) {
        onContentOffsetChange(calculatedOffset);
      } else {
        setInternalContentOffset(calculatedOffset);
      }
    } else {
      if (onContentOffsetChange) {
        onContentOffsetChange(newOffset);
      } else {
        setInternalContentOffset(newOffset);
      }
    }
  };

  // Add toast notification to useEffect
  React.useEffect(() => {
    if (!shortcutsEnabled) return;
    
    // Show initial toast
    toast({
      title: "Keyboard Shortcuts Available",
      description: "ex: Press 'H' to toggle hints visibility, see more.",
      duration: 5000,
    });

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

  // Add fillArea function before the handleMouseDown
  const fillArea = (startX: number, startY: number, targetColor: string, newColor: string) => {
    if (targetColor === newColor) return;
    
    const cellsToFill: [number, number][] = [];
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = `${x},${y}`;

      if (
        x < 0 || x >= grid[0].length ||
        y < 0 || y >= grid.length ||
        visited.has(key) ||
        grid[y][x] !== targetColor
      ) {
        continue;
      }

      visited.add(key);
      cellsToFill.push([y, x]); // Note: [row, col] order

      queue.push(
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      );
    }

    // Update all cells at once
    onToggleMultipleCells(cellsToFill, selectedColor);
  };

  // Function to handle viewport movement
  const handleViewportDrag = (e: React.MouseEvent) => {
    if (!isDraggingViewport || !lastDragPosition) return;

    const deltaX = e.clientX - lastDragPosition.x;
    const deltaY = e.clientY - lastDragPosition.y;

    setViewportOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastDragPosition({ x: e.clientX, y: e.clientY });
  };

  // Add this function to your NonogramGrid component
  const fillCells = (startRow: number, startCol: number, targetColor: string, replacementColor: string) => {
    if (targetColor === replacementColor) return;
    if (!grid) return;
    
    // Create a copy of the grid to track changes
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    // Define a recursive flood fill function
    const floodFill = (row: number, col: number) => {
      // Check if we're out of bounds
      if (
        row < 0 || 
        row >= newGrid.length || 
        col < 0 || 
        col >= newGrid[row].length
      ) return;
      
      // Check if this cell is the target color
      if (newGrid[row][col] !== targetColor) return;
      
      // Fill this cell
      newGrid[row][col] = replacementColor;
      
      // Recursively fill adjacent cells
      floodFill(row + 1, col); // down
      floodFill(row - 1, col); // up
      floodFill(row, col + 1); // right
      floodFill(row, col - 1); // left
    };
    
    // Start the flood fill
    floodFill(startRow, startCol);
    
    // Apply all changes at once
    if (onToggleMultipleCells) {
      const cellsToToggle = [];
      
      for (let row = 0; row < newGrid.length; row++) {
        for (let col = 0; col < newGrid[row].length; col++) {
          if (newGrid[row][col] !== grid[row][col]) {
            cellsToToggle.push({ row, col, color: newGrid[row][col] });
          }
        }
      }
      
      onToggleMultipleCells(cellsToToggle, selectedColor);
    }
  };

  // Modify the handleMouseDown function to use the fill tool
  const handleMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only respond to left mouse button
    
    if (isPanning || isDraggingViewport) return;
    
    // Set isDraggingContent to true when starting to interact with content
    setIsDraggingContent(true);
    
    if (selectedTool === 'fill') {
      // Get the color of the clicked cell
      const targetColor = grid[row][col];
      // Fill with the selected color
      fillCells(row, col, targetColor, selectedColor);
      return;
    }
    
    // Existing drawing/erasing logic
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      onToggleCell?.(row, col, selectedColor);
    } else if (selectedTool === 'erase') {
      setIsErasing(true);
      onToggleCell?.(row, col, 'none');
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

  // Modify handleMouseMove to include viewport dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingViewport) {
      handleViewportDrag(e);
      return;
    }

    if (!isPanning || !lastPanPosition) return;

    const deltaX = (e.clientX - lastPanPosition.x) / 300;
    const deltaY = (e.clientY - lastPanPosition.y) / 300;

    const newPanX = Math.min(Math.max(imageParams.panX - deltaX, 0), 1);
    const newPanY = Math.min(Math.max(imageParams.panY - deltaY, 0), 1);

    onImageParamChange('panX', newPanX);
    onImageParamChange('panY', newPanY);

    setLastPanPosition({ x: e.clientX, y: e.clientY });
  };

  // Modify handleMouseUp to include viewport dragging
  const handleMouseUp = () => {
    setIsPanning(false);
    setLastPanPosition(null);
    setIsDrawing(false);
    setIsErasing(false);
    setLastCell(null);
    setIsDraggingViewport(false);
    setLastDragPosition(null);
    setIsDraggingContent(false); // Reset when mouse is released
  };

  // Modify handleMouseLeave to include viewport dragging
  const handleMouseLeave = () => {
    setIsPanning(false);
    setLastPanPosition(null);
    setIsDrawing(false);
    setIsErasing(false);
    setLastCell(null);
    setIsDraggingViewport(false);
    setLastDragPosition(null);
    setIsDraggingContent(false); // Reset when mouse leaves
  };

  // Group consecutive cells of the same color in a row
  const getRowHints = (row: number) => {
    if (!grid || !grid[row]) return [{ count: 0, color: 'black' }];
    const hints = [];
    let currentCount = 0;
    let currentColor: string | null = null;

    // Calculate visible range based on viewport offset and content offset
    const cellWidth = zoom * 16; // Convert rem to pixels (1rem = 16px)
    const effectiveOffsetX = viewportOffset.x + (contentOffset.x * cellWidth);
    const visibleStartCol = Math.max(0, Math.floor(-effectiveOffsetX / cellWidth));
    const visibleEndCol = Math.min(grid[row].length, Math.ceil((window.innerWidth - effectiveOffsetX) / cellWidth));

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

    // Calculate visible range based on viewport offset and content offset
    const cellHeight = zoom * 16; // Convert rem to pixels (1rem = 16px)
    const effectiveOffsetY = viewportOffset.y + (contentOffset.y * cellHeight);
    const visibleStartRow = Math.max(0, Math.floor(-effectiveOffsetY / cellHeight));
    const visibleEndRow = Math.min(grid.length, Math.ceil((window.innerHeight - effectiveOffsetY) / cellHeight));

    for (let row = 0; row < grid.length; row++) {
      if (!grid[row] || col >= grid[row].length) continue;
      
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

    // End of the column
    if (currentCount > 0 && currentColor) {
      hints.push({ count: currentCount, color: currentColor });
    }

    // If hints is empty, return [ {count: 0, color: 'black'} ]
    return hints.length ? hints : [{ count: 0, color: 'black' }];
  };

  // Add useEffect to recalculate hints when viewport changes
  useEffect(() => {
    // Force a re-render to update hints
    setShowHints(prev => {
      if (prev) {
        // Toggle off and on to force recalculation
        setTimeout(() => setShowHints(true), 0);
        return false;
      }
      return prev;
    });
  }, [viewportOffset]);

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

  // Add keyboard shortcut to reset viewport position
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        setViewportOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcutsEnabled]);

  // Update the shiftGridContent function to preserve off-screen content
  const shiftGridContent = (deltaX: number, deltaY: number) => {
    // Ensure we have valid delta values
    const dx = typeof deltaX === 'number' && !isNaN(deltaX) ? deltaX : 0;
    const dy = typeof deltaY === 'number' && !isNaN(deltaY) ? deltaY : 0;
    
    // Exit early if there's no actual movement or no grid
    if ((dx === 0 && dy === 0) || !grid || !onToggleMultipleCells || !Array.isArray(grid) || grid.length === 0) {
      return;
    }
    
    // Create array to track cell changes
    const cellsToToggle: { row: number; col: number; color: string }[] = [];
    
    // Create a new buffer for off-screen cells
    const newOffScreenBuffer = new Map(offScreenBuffer);
    
    // First pass: collect all filled cells (both from grid and buffer)
    const filledCells: { row: number; col: number; color: string }[] = [];
    
    // Add cells from the grid
    for (let row = 0; row < grid.length; row++) {
      const gridRow = grid[row];
      if (!gridRow || !Array.isArray(gridRow)) continue;
      
      for (let col = 0; col < gridRow.length; col++) {
        const cellColor = gridRow[col];
        if (cellColor && cellColor !== 'none') {
          filledCells.push({ row, col, color: cellColor });
          
          // Clear this cell in the grid
          cellsToToggle.push({ row, col, color: 'none' });
        }
      }
    }
    
    // Add cells from the off-screen buffer
    offScreenBuffer.forEach((color, key) => {
      const [rowStr, colStr] = key.split(',');
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);
      if (!isNaN(row) && !isNaN(col)) {
        filledCells.push({ row, col, color });
      }
    });
    
    // Clear the off-screen buffer as we're rebuilding it
    newOffScreenBuffer.clear();
    
    // Process each filled cell to its new position
    filledCells.forEach(cell => {
      const newRow = cell.row + dy;
      const newCol = cell.col + dx;
      
      // Check if the new position is within grid bounds
      if (newRow >= 0 && newRow < grid.length && 
          newCol >= 0 && grid[0] && newCol < grid[0].length) {
        // Add to grid changes
        cellsToToggle.push({ 
          row: newRow, 
          col: newCol, 
          color: cell.color 
        });
      } else {
        // Store in off-screen buffer
        newOffScreenBuffer.set(`${newRow},${newCol}`, cell.color);
      }
    });
    
    // Update the off-screen buffer
    setOffScreenBuffer(newOffScreenBuffer);
    
    // Apply all grid changes at once
    if (cellsToToggle.length > 0) {
      onToggleMultipleCells(cellsToToggle, selectedColor);
      
      // Force hint recalculation
      if (showHints) {
        setShowHints(false);
        setTimeout(() => setShowHints(true), 10);
      }
    }
  };

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center w-full h-full overflow-hidden nonogram-grid
        ${isPanning ? 'cursor-grabbing' : ''}
        ${isModifierPressed ? 'cursor-grab' : ''}
        ${isModifierPressed && isPanning ? 'cursor-grabbing' : ''}
        ${isDraggingViewport ? 'cursor-move' : ''}
        ${isDraggingContent ? 'cursor-all-scroll' : ''}
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
            transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) translate(${contentOffset.x * zoom * 16}px, ${contentOffset.y * zoom * 16}px)`,
            transition: isDraggingViewport || isDraggingContent ? 'none' : 'transform 0.1s ease-out'
          }}
          onMouseDown={(e) => {
            // Prevent default to avoid text selection
            e.preventDefault();
            if (e.button === 2) {
              e.preventDefault();
            }
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