import React from 'react';
import { GridPreset } from './types';

interface NonogramGridProps {
  grid: string[][];
  currentPreset: GridPreset;
  zoom: number;
  isRKeyPressed: boolean;
  processing: boolean;
  onToggleCell: (row: number, col: number) => void;
}

export const NonogramGrid: React.FC<NonogramGridProps> = ({
  grid,
  currentPreset,
  zoom,
  isRKeyPressed,
  processing,
  onToggleCell,
}) => {
  const getRowHints = (row: number) => {
    if (!grid || !grid[row]) return [0];
    
    const hints = [];
    let count = 0;
    
    for (let x = 0; x < grid[row].length; x++) {
      if (grid[row][x] !== 'none') {
        count++;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
    if (count > 0) hints.push(count);
    return hints.length ? hints : [0];
  };

  const getColumnHints = (col: number) => {
    if (!grid) return [0];
    
    const hints = [];
    let count = 0;
    
    for (let y = 0; y < grid.length; y++) {
      if (grid[y] && grid[y][col] !== 'none') {
        count++;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
    if (count > 0) hints.push(count);
    return hints.length ? hints : [0];
  };

  const getHintColor = (cells: string[]) => {
    const filledCells = cells.filter(cell => cell !== 'none');
    return filledCells.length > 0 && filledCells.every(cell => cell === 'red') ? 'text-red-500' : 'text-black';
  };

  const maxRowHints = Math.max(1, ...Array.from({ length: currentPreset.height }, (_, i) => getRowHints(i).length));
  const maxColHints = Math.max(1, ...Array.from({ length: currentPreset.width }, (_, i) => getColumnHints(i).length));

  return (
    <div className="overflow-auto">
      <div className="grid gap-0 min-w-fit"
        style={{
          gridTemplateColumns: `repeat(${currentPreset.width + maxRowHints}, ${zoom}rem)`,
          gridTemplateRows: `repeat(${currentPreset.height + maxColHints}, ${zoom}rem)`
        }}
      >
        {Array.from({ length: currentPreset.height + maxColHints }).map((_, gridRow) => (
          <React.Fragment key={`row-${gridRow}`}>
            {Array.from({ length: currentPreset.width + maxRowHints }).map((_, gridCol) => {
              const isTopLeftCorner = gridRow < maxColHints && gridCol < maxRowHints;
              const isColumnHint = gridRow < maxColHints && gridCol >= maxRowHints;
              const isRowHint = gridRow >= maxColHints && gridCol < maxRowHints;
              
              const gameRow = gridRow - maxColHints;
              const gameCol = gridCol - maxRowHints;
              
              if (isTopLeftCorner) {
                return <div key={`cell-${gridRow}-${gridCol}`} style={{ width: `${zoom}rem`, height: `${zoom}rem` }} />;
              }
              
              if (isColumnHint) {
                const columnCells = grid.map(row => row[gameCol]);
                const hints = getColumnHints(gameCol);
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
                  <div key={`cell-${gridRow}-${gridCol}`} 
                    style={{ width: `${zoom}rem`, height: `${zoom}rem` }}
                    className="flex items-center justify-center"
                  >
                    {hintIndex >= 0 && hintIndex < hints.length && (
                      <span className={`text-xs font-mono ${hintColor}`}>
                        {hints[hintIndex]}
                      </span>
                    )}
                  </div>
                );
              }
              
              if (isRowHint) {
                const rowCells = grid[gameRow];
                const hints = getRowHints(gameRow);
                const hintIndex = hints.length - (maxRowHints - gridCol);
                
                let currentIndex = 0;
                let currentCount = 0;
                let hintCells: string[] = [];
                
                for (let i = 0; i < rowCells.length; i++) {
                  if (rowCells[i] !== 'none') {
                    currentCount++;
                    hintCells.push(rowCells[i]);
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
                  <div key={`cell-${gridRow}-${gridCol}`} 
                    style={{ width: `${zoom}rem`, height: `${zoom}rem` }}
                    className="flex items-center justify-center"
                  >
                    {hintIndex >= 0 && hintIndex < hints.length && (
                      <span className={`text-xs font-mono ${hintColor}`}>
                        {hints[hintIndex]}
                      </span>
                    )}
                  </div>
                );
              }
              
              return (
                <div
                  key={`cell-${gridRow}-${gridCol}`}
                  style={{ width: `${zoom}rem`, height: `${zoom}rem` }}
                  className={`border border-gray-200 cursor-pointer ${
                    grid[gameRow][gameCol] === 'black' ? 'bg-black' :
                    grid[gameRow][gameCol] === 'red' ? 'bg-red-500' :
                    'bg-white'
                  } hover:bg-gray-300`}
                  onClick={() => onToggleCell(gameRow, gameCol)}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-500 italic">
        Hold R + Click for red pixels
      </div>
    </div>
  );
};
