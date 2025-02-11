import React, { useState } from 'react';

function Grid({ numRows, numCols, running, setGrid }) {
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [rightMouseIsPressed, setRightMouseIsPressed] = useState(false);

  const handleMouseDown = (row, col, e) => {
    // Prevent default right-click menu
    e.preventDefault();
    
    if (e.button === 0) { // Left click
      setMouseIsPressed(true);
      setGrid(g => {
        const newGrid = g.map(row => [...row]);
        newGrid[row][col] = 1;
        return newGrid;
      });
    } else if (e.button === 2) { // Right click
      setRightMouseIsPressed(true);
      setGrid(g => {
        const newGrid = g.map(row => [...row]);
        newGrid[row][col] = 0;
        return newGrid;
      });
    }
  };

  const handleMouseEnter = (row, col, e) => {
    if (mouseIsPressed) { // Draw cells when left mouse is pressed
      setGrid(g => {
        const newGrid = g.map(row => [...row]);
        newGrid[row][col] = 1;
        return newGrid;
      });
    } else if (rightMouseIsPressed) { // Clear cells when right mouse is pressed
      setGrid(g => {
        const newGrid = g.map(row => [...row]);
        newGrid[row][col] = 0;
        return newGrid;
      });
    }
  };

  const handleMouseUp = (e) => {
    if (e.button === 0) {
      setMouseIsPressed(false);
    } else if (e.button === 2) {
      setRightMouseIsPressed(false);
    }
  };

  return (
    <div 
      className="grid"
      onContextMenu={(e) => e.preventDefault()} // Disable context menu for the entire grid
      onMouseLeave={() => {
        setMouseIsPressed(false);
        setRightMouseIsPressed(false);
      }}
    >
      {/* ... existing grid rendering code ... */}
    </div>
  );
}

export default Grid; 