import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Upload, Save, FolderOpen } from 'lucide-react';

const GRID_PRESETS = [
  { label: '6×6', width: 6, height: 6 },
  { label: '12×12', width: 12, height: 12 },
  { label: '50x50', width: 50, height: 50 },
  { label: '60x60', width: 60, height: 60 },
  { label: '100x100', width: 100, height: 100 }
 
];

function createEmptyGrid(width: number, height: number): string[][] {
  return Array.from({ length: height }, () => 
    Array.from({ length: width }, () => 'none')
  );
}

interface GridStates {
  [key: number]: string[][];
}

// Add interface for the API response structure
interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface ProviderResponse {
  images: GeneratedImage[];
  // ... other provider response fields if needed
}

interface ApiResponse {
  provider_response: ProviderResponse;
  // ... other response fields if needed
}

const NonogramEditor = () => {
  const [selectedPreset, setSelectedPreset] = useState(3);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageData, setOriginalImageData] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [gridStates, setGridStates] = useState<GridStates>(() => {
    const initialStates: GridStates = {};
    GRID_PRESETS.forEach((preset, index) => {
      initialStates[index] = createEmptyGrid(preset.width, preset.height);
    });
    return initialStates;
  });

  // Add new state variables for image processing parameters
  const [imageParams, setImageParams] = useState({
    redWeight: 0.299,
    greenWeight: 0.587,
    blueWeight: 0.114,
    brightnessThreshold: 150,
    contrast: 1.0,
    zoom: 1.0,     // How much to zoom into the source image
    panX: 0.5,     // Horizontal pan position (0-1)
    panY: 0.5      // Vertical pan position (0-1)
  });

  // Add zoom state
  const [zoom, setZoom] = useState(1.5); // 1.5rem is the current default size

  const [generationText, setGenerationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Add new state for generated images
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Add state for tracking if 'r' key is pressed
  const [isRKeyPressed, setIsRKeyPressed] = useState(false);

  const currentPreset = GRID_PRESETS[selectedPreset];
  const grid = gridStates[selectedPreset];

  // Add effect to handle keydown/keyup events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        setIsRKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        setIsRKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const processImageToGrid = async (imageData: string, width: number, height: number) => {
    const img = new Image();
    return new Promise<string[][]>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        
        canvas.width = width;
        canvas.height = height;

        // Calculate source rectangle based on zoom and pan
        const sourceWidth = img.width / imageParams.zoom;
        const sourceHeight = img.height / imageParams.zoom;
        
        // Calculate source position based on pan values
        const maxX = img.width - sourceWidth;
        const maxY = img.height - sourceHeight;
        const sourceX = maxX * imageParams.panX;
        const sourceY = maxY * imageParams.panY;

        // Draw the zoomed and panned region
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
          0, 0, width, height                          // Destination rectangle
        );
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const newGrid = createEmptyGrid(width, height);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const brightness = (
              imageData.data[i] * imageParams.redWeight + 
              imageData.data[i + 1] * imageParams.greenWeight + 
              imageData.data[i + 2] * imageParams.blueWeight
            ) * imageParams.contrast;
            newGrid[y][x] = brightness < imageParams.brightnessThreshold ? 'black' : 'none';
          }
        }
        
        resolve(newGrid);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setProcessing(true);
    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          if (!e.target) reject(new Error('No target'));
          resolve(e.target?.result as string);
        };
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
    } catch (error: unknown) {
      console.error('Error processing image:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to process image. ' + message);
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
    } catch (error: unknown) {
      console.error('Error in save function:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to save the nonogram. ' + message);
    }
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const saveData = JSON.parse(e.target?.result as string);
        
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
      } catch (error: unknown) {
        console.error('Error loading file:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        alert('Failed to load the nonogram file. ' + message);
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

  const handlePresetChange = async (index: number) => {
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

  const toggleCell = (row: number, col: number) => {
    if (processing) return;
    
    setGridStates(prev => ({
      ...prev,
      [selectedPreset]: prev[selectedPreset].map((rowArray, rowIndex) =>
        rowIndex === row
          ? rowArray.map((cell, colIndex) => {
              if (colIndex !== col) return cell;
              if (cell === 'none') {
                return isRKeyPressed ? 'red' : 'black';
              }
              return 'none';
            })
          : rowArray
      )
    }));
  };

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

  const maxRowHints = Math.max(1, ...Array.from({ length: currentPreset.height }, (_, i) => getRowHints(i).length));
  const maxColHints = Math.max(1, ...Array.from({ length: currentPreset.width }, (_, i) => getColumnHints(i).length));

  // Add handler for parameter changes
  const handleParamChange = async (param: string, value: number) => {
    if (!originalImageData) return;
    
    const newParams = { ...imageParams, [param]: value };
    setImageParams(newParams);
    
    setProcessing(true);
    try {
      const newGrid = await processImageToGrid(
        originalImageData,
        currentPreset.width,
        currentPreset.height
      );
      setGridStates(prev => ({
        ...prev,
        [selectedPreset]: newGrid
      }));
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Update handleGenerate function
  const handleGenerate = async () => {
    if (!generationText.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('https://my.orq.ai/v2/deployments/invoke', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3Jrc3BhY2VJZCI6ImFkYTNkZjllLWY1YTUtNDE0Ni1hNTUzLWM3OTQxNmYyY2EwNCIsImlzcyI6Im9ycSIsImlhdCI6MTczODMzODE5Nn0.Cx31E198s2jIGN25zwE6FQdAk2cIWB71dAvVv8tQgg8',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          key: "keesing_nonomaker",
          context: {
            environments: ["1"]
          },
          inputs: {
            type: "outline",
            topic: generationText,
            resolution: `${currentPreset.width}x${currentPreset.height}px`
          },
          metadata: {
            'custom-field-name': 'custom-metadata-value'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('API Response :', data);
      


      // Now TypeScript knows the shape of the data
      const imageUrls = data.provider_response?.images?.map(img => img.url) || [];
      setGeneratedImages(imageUrls);
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate nonogram. Please try again...');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add handler for using generated image
  const handleUseGeneratedImage = async (imageUrl: string) => {
    setProcessing(true);
    try {
      // First fetch the image and convert to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      setOriginalImageData(base64Data);
      setImagePreview(base64Data);
      
      const newGrid = await processImageToGrid(
        base64Data,
        currentPreset.width,
        currentPreset.height
      );

      setGridStates(prev => ({
        ...prev,
        [selectedPreset]: newGrid
      }));
    } catch (error) {
      console.error('Error processing generated image:', error);
      alert('Failed to process the generated image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Add a helper function to determine hint color based on cells
  const getHintColor = (cells: string[]) => {
    // If all filled cells in the sequence are red, return red
    const filledCells = cells.filter(cell => cell !== 'none');
    return filledCells.length > 0 && filledCells.every(cell => cell === 'red') ? 'text-red-500' : 'text-black';
  };

  return (
    <Card className="w-full max-w-[90vw] mx-auto p-4">
      <CardHeader className="text-center">
        {/* Add logos container */}
        <div className="flex justify-between items-center mb-4">
          <img 
            src="assets/logo.svg" 
            alt="Logo" 
            className="h-12 object-contain"
          />
          <img 
            src="assets/keesing.jpg" 
            alt="Keesing Logo" 
            className="h-12 object-contain"
          />
        </div>
       
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex gap-8">
          {/* Controls Column - 1/4 width */}
          <div className="w-1/4 flex flex-col gap-4">
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

            {/* Zoom control */}
            <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-lg">
              <label className="text-sm font-medium">Grid Zoom:</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm">{Math.round(zoom * 100)}%</span>
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
                  onClick={handleSave}
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

            {/* Image Processing Controls - Collapsible */}
            {originalImageData && (
              <details className="bg-gray-50 rounded-lg">
                <summary className="p-4 font-medium cursor-pointer hover:bg-gray-100">
                  Image Processing Controls
                </summary>
                <div className="p-4 pt-2 border-t border-gray-200">
                  {/* Color Weights */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium mb-2">Color Weights</h4>
                    <label className="text-sm">Red Weight</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={imageParams.redWeight}
                      onChange={(e) => handleParamChange('redWeight', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <label className="text-sm">Green Weight</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={imageParams.greenWeight}
                      onChange={(e) => handleParamChange('greenWeight', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <label className="text-sm">Blue Weight</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={imageParams.blueWeight}
                      onChange={(e) => handleParamChange('blueWeight', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Image Adjustments */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium mb-2">Image Adjustments</h4>
                    <label className="text-sm">Brightness Threshold</label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={imageParams.brightnessThreshold}
                      onChange={(e) => handleParamChange('brightnessThreshold', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <label className="text-sm">Contrast</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={imageParams.contrast}
                      onChange={(e) => handleParamChange('contrast', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Image Position Controls */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium mb-2">Position & Scale</h4>
                    <label className="text-sm">Image Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={imageParams.zoom}
                      onChange={(e) => handleParamChange('zoom', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <label className="text-sm">Pan X</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={imageParams.panX}
                      onChange={(e) => handleParamChange('panX', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <label className="text-sm">Pan Y</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={imageParams.panY}
                      onChange={(e) => handleParamChange('panY', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </details>
            )}

            {/* Text Input Area */}
            <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
              <textarea 
                className="w-full p-2 border border-gray-200 rounded-md" 
                rows={5} 
                placeholder="Enter your text here..."
                value={generationText}
                onChange={(e) => setGenerationText(e.target.value)}
                disabled={isGenerating}
              />
              <button
                className={`px-4 py-2 bg-green-500 text-white rounded-md transition-colors shadow-sm ${
                  isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                }`}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>

              {/* Update Generated Images Display */}
              {generatedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {generatedImages.map((url, index) => (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => window.open(url, '_blank')}
                        />
                      </div>
                      
                      {/* Card Footer */}
                      <div className="p-3 border-t border-gray-100">
                        <button
                          onClick={() => handleUseGeneratedImage(url)}
                          disabled={processing}
                          className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md 
                            transition-colors shadow-sm text-sm font-medium
                            ${processing 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-blue-600'}`}
                        >
                          {processing ? 'Processing...' : 'Use this image'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid Column */}
          <div className="w-3/4 overflow-auto">
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
                      
                      // Find the cells that contribute to this hint
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
                      
                      // Find the cells that contribute to this hint
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
                        onClick={() => toggleCell(gameRow, gameCol)}
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
        </div>
      </CardContent>
    </Card>
    
  );
};

export default NonogramEditor;