import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Save, FolderOpen } from 'lucide-react';

const GRID_PRESETS = [
  { label: '6×6', width: 6, height: 6 },
  { label: '12×12', width: 12, height: 12 },
  { label: '24×24', width: 24, height: 24 },
  { label: '32×32', width: 32, height: 32 },
  { label: '20×32', width: 32, height: 20 }
];

function createEmptyGrid(width, height) {
  return Array(height).fill().map(() => Array(width).fill(false));
}

const NonogramEditor = () => {
  const [selectedPreset, setSelectedPreset] = useState(3);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImageData, setOriginalImageData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [gridStates, setGridStates] = useState(() => {
    const initialStates = {};
    GRID_PRESETS.forEach((preset, index) => {
      initialStates[index] = createEmptyGrid(preset.width, preset.height);
    });
    return initialStates;
  });

  const currentPreset = GRID_PRESETS[selectedPreset];
  const grid = gridStates[selectedPreset];

  const processImageToGrid = async (imageData, width, height) => {
    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const newGrid = createEmptyGrid(width, height);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const brightness = (
              imageData.data[i] * 0.299 + 
              imageData.data[i + 1] * 0.587 + 
              imageData.data[i + 2] * 0.114
            );
            newGrid[y][x] = brightness < 150;
          }
        }
        
        resolve(newGrid);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    setProcessing(true);
    try {
      const reader = new FileReader();
      const imageData = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setOriginalImageData(imageData);
      setImagePreview(imageData);

      const newGrid = await processImageToGrid(
        imageData,
        currentPreset.width,
        currentPreset.height
      );

      setGridStates(prev => ({
        ...prev,
        [selectedPreset]: newGrid
      }));
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = () => {
    console.log('Save button clicked');
    console.log('Current grid state:', grid);
    console.log('Current preset:', selectedPreset);

    try {
      // First create the save data object
      const saveData = {
        version: 1,
        timestamp: new Date().toISOString(),
        preset: selectedPreset,
        grid: grid,
        imageData: originalImageData
      };

      console.log('Save data created:', saveData);

      // Convert to JSON string
      const jsonString = JSON.stringify(saveData, null, 2);
      console.log('JSON string created:', jsonString);

      // Create blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      console.log('Blob created');

      // Create download
      const downloadUrl = window.URL.createObjectURL(blob);
      console.log('Download URL created:', downloadUrl);

      // Create and configure link
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `nonogram_${currentPreset.width}x${currentPreset.height}.nono`;
      downloadLink.style.display = 'none';
      console.log('Download link created with filename:', downloadLink.download);

      // Trigger download
      document.body.appendChild(downloadLink);
      console.log('Link appended to document');
      downloadLink.click();
      console.log('Click triggered');
      document.body.removeChild(downloadLink);
      console.log('Link removed');

      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);
      console.log('URL revoked, save complete');
    } catch (error) {
      console.error('Error in save function:', error);
      alert('Failed to save the nonogram. Error: ' + error.message);
    }
  };

  const handleLoad = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const saveData = JSON.parse(e.target.result);
        
        // Load the preset
        if (typeof saveData.preset === 'number' && saveData.grid) {
          setSelectedPreset(saveData.preset);
          setGridStates(prev => ({
            ...prev,
            [saveData.preset]: saveData.grid
          }));
        }

        // Load image if it exists
        if (saveData.imageData) {
          setOriginalImageData(saveData.imageData);
          setImagePreview(saveData.imageData);
        }
      } catch (error) {
        console.error('Error loading file:', error);
        alert('Failed to load the nonogram file. Please ensure it\'s a valid .nono file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setGridStates(prev => ({
      ...prev,
      [selectedPreset]: createEmptyGrid(currentPreset.width, currentPreset.height)
    }));
    setImagePreview(null);
    setOriginalImageData(null);
  };

  const handlePresetChange = async (index) => {
    if (index === selectedPreset) return;
    
    // Store current grid state before switching
    setGridStates(prev => ({
      ...prev,
      [selectedPreset]: grid
    }));
    
    setSelectedPreset(index);
    
    // If we have an image, process it for the new size if not already processed
    if (originalImageData && !gridStates[index]) {
      setProcessing(true);
      try {
        const newGrid = await processImageToGrid(
          originalImageData,
          GRID_PRESETS[index].width,
          GRID_PRESETS[index].height
        );
        setGridStates(prev => ({
          ...prev,
          [index]: newGrid
        }));
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setProcessing(false);
      }
    }
  };

  const toggleCell = (row, col) => {
    if (processing) return;
    
    setGridStates(prev => ({
      ...prev,
      [selectedPreset]: prev[selectedPreset].map((rowArray, rowIndex) =>
        rowIndex === row
          ? rowArray.map((cell, colIndex) => 
              colIndex === col ? !cell : cell
            )
          : rowArray
      )
    }));
  };

  const getRowHints = (row) => {
    if (!grid || !grid[row]) return [0];
    
    const hints = [];
    let count = 0;
    
    for (let x = 0; x < grid[row].length; x++) {
      if (grid[row][x]) {
        count++;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
    if (count > 0) hints.push(count);
    return hints.length ? hints : [0];
  };

  const getColumnHints = (col) => {
    if (!grid) return [0];
    
    const hints = [];
    let count = 0;
    
    for (let y = grid.length - 1; y >= 0; y--) {
      if (grid[y] && grid[y][col]) {
        count++;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
    if (count > 0) hints.push(count);
    return hints.length ? hints : [0];
  };

  const maxRowHints = Math.max(1, ...Array(currentPreset.height).fill().map((_, i) => getRowHints(i).length));
  const maxColHints = Math.max(1, ...Array(currentPreset.width).fill().map((_, i) => getColumnHints(i).length));

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <CardHeader className="text-center">
        <CardTitle>Nonomaker</CardTitle>
        <CardDescription>beta v0.3</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Grid Controls */}
            <div className="flex gap-2 items-center bg-gray-50 p-4 rounded-lg">
              <div className="flex gap-2">
                {GRID_PRESETS.map((preset, index) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetChange(index)}
                    disabled={processing}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      selectedPreset === index
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white hover:bg-gray-100  border-gray-200'
                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2" />
              <button
                onClick={handleClear}
                disabled={processing}
                className="px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                Clear Grid
              </button>
            </div>

            {/* File Controls */}
            <div className="flex gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm">
                  <Upload size={20} />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-10 h-10 object-contain border rounded-md"
                  />
                )}
              </div>

              <div className="h-full w-px bg-gray-200" />

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('Save button clicked in UI');
                    handleSave();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-sm"
                >
                  <Save size={20} />
                  Save
                </button>
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors shadow-sm">
                  <FolderOpen size={20} />
                  Load
                  <input
                    type="file"
                    accept=".nono"
                    onChange={handleLoad}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${currentPreset.width + maxRowHints}, 1.5rem)`,
              gridTemplateRows: `repeat(${currentPreset.height + maxColHints}, 1.5rem)`
            }}
          >
            {Array(currentPreset.height + maxColHints).fill().map((_, gridRow) => (
              <React.Fragment key={`row-${gridRow}`}>
                {Array(currentPreset.width + maxRowHints).fill().map((_, gridCol) => {
                  const isTopLeftCorner = gridRow < maxColHints && gridCol < maxRowHints;
                  const isColumnHint = gridRow < maxColHints && gridCol >= maxRowHints;
                  const isRowHint = gridRow >= maxColHints && gridCol < maxRowHints;
                  
                  const gameRow = gridRow - maxColHints;
                  const gameCol = gridCol - maxRowHints;
                  
                  if (isTopLeftCorner) {
                    return <div key={`cell-${gridRow}-${gridCol}`} className="w-6 h-6" />;
                  }
                  
                  if (isColumnHint) {
                    const hints = getColumnHints(gameCol);
                    const hintIndex = hints.length - (maxColHints - gridRow);
                    return (
                      <div key={`cell-${gridRow}-${gridCol}`} className="w-6 h-6 flex items-center justify-center">
                        {hintIndex >= 0 && hintIndex < hints.length && (
                          <span className="text-xs font-mono">{hints[hintIndex]}</span>
                        )}
                      </div>
                    );
                  }
                  
                  if (isRowHint) {
                    const hints = getRowHints(gameRow);
                    const hintIndex = hints.length - (maxRowHints - gridCol);
                    return (
                      <div key={`cell-${gridRow}-${gridCol}`} className="w-6 h-6 flex items-center justify-center">
                        {hintIndex >= 0 && hintIndex < hints.length && (
                          <span className="text-xs font-mono">{hints[hintIndex]}</span>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={`cell-${gridRow}-${gridCol}`}
                      className={`w-6 h-6 border border-gray-200 cursor-pointer ${
                        grid[gameRow][gameCol] ? 'bg-black' : 'bg-white'
                      } hover:bg-gray-300`}
                      onClick={() => toggleCell(gameRow, gameCol)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NonogramEditor;