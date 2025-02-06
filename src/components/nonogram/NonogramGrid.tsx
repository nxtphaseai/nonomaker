import React from 'react';
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

  const getHintColor = (cells: string[]) => {
    const filledCells = cells.filter(cell => cell !== 'none');
    return filledCells.length > 0 && filledCells.every(cell => cell === 'red') ? 'text-red-500' : 'text-black';
  };

  const maxRowHints = Math.max(1, ...Array.from({ length: currentPreset.height }, (_, i) => getRowHints(i).length));
  const maxColHints = Math.max(1, ...Array.from({ length: currentPreset.width }, (_, i) => getColumnHints(i).length));

  return (
    <div className="flex flex-col gap-2">
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
                    const columnCells = grid.map(row => row[col]);
                    const hints = getColumnHints(col);
                    const hintIndex = hints.length - (maxColHints - gridRow);
                    
                    let currentIndex = 0;
                    let currentCount = 0;
                    let hintCells: string[] = [];
                    
                    for (let i = 0; i < columnCells.length; i++) {
                      if (columnCells[i] !== 'none') {
                        currentCount++;
                        hintCells.push(columnCells[i]);
                      } else if (currentCount > 0) {
                        if (currentIndex === hintIndex) {
                          break;
                        }
                        currentIndex++;
                        currentCount = 0;
                        hintCells = [];
                      }
                    }
                    
                    const hintColor = getHintColor(hintCells);
                    
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
                    const rowCells = grid[row];
                    const hints = getRowHints(row);
                    const hintIndex = gridCol - (maxRowHints - hints.length);
                    
                    let startIndex = 0;
                    for (let i = 0; i < hintIndex; i++) {
                      startIndex += hints[i].count;
                    }
                    
                    const hintColor =
                      hintIndex >= 0 && hintIndex < hints.length
                        ? getHintColor(rowCells.slice(startIndex, startIndex + hints[hintIndex].count))
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
                      className="relative border border-gray-200 cursor-pointer transition-colors"
                      style={{ width: cellSize, height: cellSize }}
                      onClick={() => !processing && onToggleCell(row, col)}
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
      <div className="text-sm text-gray-500 text-center">
        <p>Press R for a red cell • Ctrl+Z to undo • Ctrl+X to redo</p>
      </div>
    </div>
  );
};