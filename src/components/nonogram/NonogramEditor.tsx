import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GridControls } from './GridControls';
import { ZoomControl } from './ZoomControl';
import { TextGenerationArea } from './TextGenerationArea';
import { FileControls } from './FileControls';
import { ImageProcessingControls } from './ImageProcessingControls';
import { NonogramGrid } from './NonogramGrid';
import { createEmptyGrid, processImageToGrid, exportGridToImage } from './utils';
import { GRID_PRESETS, DEFAULT_IMAGE_PARAMS, API_ENDPOINT, API_KEY } from './constants';
import { GridStates, ImageParams, ApiResponse, GridParams } from './types';
import ColorPalette from './ColorPalette';

// Add this interface after GridStates import
interface UndoRedoState {
  past: HistoryState[];
  present: HistoryState;
  future: HistoryState[];
}

// Update HistoryState interface to include imageParams and gridParams
interface HistoryState {
  gridStates: GridStates;
  selectedPreset: number;
  imageParams: ImageParams;
  gridParams: GridParams;
}

// Add this constant near your other constants
const DEFAULT_GRID_PARAMS: GridParams = {
  offsetX: 0,
  offsetY: 0
};

// Add this helper function before the NonogramEditor component
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const NonogramEditor: React.FC = () => {
  // Update initial state to include imageParams and gridParams
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>(() => {
    const initialGridStates: GridStates = {};
    GRID_PRESETS.forEach((preset, index) => {
      initialGridStates[index] = createEmptyGrid(preset.width, preset.height);
    });
    return {
      past: [],
      present: {
        gridStates: initialGridStates,
        selectedPreset: 3,
        imageParams: DEFAULT_IMAGE_PARAMS,
        gridParams: DEFAULT_GRID_PARAMS
      },
      future: []
    };
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageData, setOriginalImageData] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [generationText, setGenerationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('black');
  const [isRKeyPressed, setIsRKeyPressed] = useState(false);

  const currentPreset = GRID_PRESETS[undoRedoState.present.selectedPreset];

  // Define handlers before useEffect
  const handleUndo = useCallback(() => {
    setExportUrl(null); // Clear export URL on undo
    setUndoRedoState(currentState => {
      const { past, present, future } = currentState;
      if (past.length === 0) return currentState;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future]
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setExportUrl(null); // Clear export URL on redo
    setUndoRedoState(currentState => {
      const { past, present, future } = currentState;
      if (future.length === 0) return currentState;

      const next = future[0];
      const newFuture = future.slice(1);

      return {
        past: [...past, present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  // Now use the handlers in useEffect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add undo/redo keyboard shortcuts
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setIsRKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setExportUrl(null); // Clear export URL when uploading a new image
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      setImagePreview(dataUrl);
      handleUseGeneratedImage(dataUrl);
    } catch (error) {
      console.error('Error reading file:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = () => {
    try {
      const saveData = {
        version: 1,
        timestamp: new Date().toISOString(),
        preset: undoRedoState.present.selectedPreset,
        grid: undoRedoState.present.gridStates[undoRedoState.present.selectedPreset],
        imageData: originalImageData
      };

      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `nonogram_${currentPreset.width}x${currentPreset.height}.nono`;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(downloadUrl);
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
        
        if (typeof saveData.preset === 'number' && saveData.grid) {
          setUndoRedoState(currentState => ({
            past: [...currentState.past, currentState.present],
            present: {
              gridStates: {
                ...currentState.present.gridStates,
                [saveData.preset]: saveData.grid
              },
              selectedPreset: saveData.preset,
              imageParams: currentState.present.imageParams,
              gridParams: currentState.present.gridParams || DEFAULT_GRID_PARAMS
            },
            future: []
          }));
        }

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
    setExportUrl(null); // Clear export URL when grid is cleared
    const currentPreset = GRID_PRESETS[undoRedoState.present.selectedPreset];
    const emptyGrid = Array(currentPreset.height).fill(null).map(() =>
      Array(currentPreset.width).fill('none')
    );

    setUndoRedoState(currentState => ({
      past: [...currentState.past, currentState.present],
      present: {
        ...currentState.present,
        gridStates: {
          ...currentState.present.gridStates,
          [currentState.present.selectedPreset]: emptyGrid
        }
      },
      future: []
    }));
  };

  const handlePresetChange = (presetIndex: number) => {
    setExportUrl(null); // Clear export URL when grid size changes
    setUndoRedoState(currentState => {
      // If the grid doesn't exist for this preset, create it
      if (!currentState.present.gridStates[presetIndex]) {
        const preset = GRID_PRESETS[presetIndex];
        currentState.present.gridStates[presetIndex] = createEmptyGrid(
          preset.width,
          preset.height
        );
      }

      return {
        past: [...currentState.past, currentState.present],
        present: {
          ...currentState.present,
          selectedPreset: presetIndex,
          gridParams: currentState.present.gridParams || DEFAULT_GRID_PARAMS
        },
        future: []
      };
    });
  };

  const toggleCell = useCallback(
    (row: number, col: number, overrideColor?: string) => {
      setExportUrl(null);
      setUndoRedoState((currentState: any) => {
        const currentGrid = currentState.present.gridStates[currentState.present.selectedPreset];
        const newGrid = currentGrid.map((r: string[], i: number) =>
          i === row
            ? r.map((cell: string, j: number) =>
                j === col ? (overrideColor ?? selectedColor) : cell
              )
            : r
        );

        return {
          past: [...currentState.past, currentState.present],
          present: {
            ...currentState.present,
            gridStates: {
              ...currentState.present.gridStates,
              [currentState.present.selectedPreset]: newGrid
            },
            gridParams: currentState.present.gridParams || DEFAULT_GRID_PARAMS
          },
          future: []
        };
      });
    },
    [selectedColor]
  );

  const handleParamChange = async (param: keyof ImageParams, value: number) => {
    if (!originalImageData) return;

    setProcessing(true);
    try {
      const currentPreset = GRID_PRESETS[undoRedoState.present.selectedPreset];
      const newImageParams = {
        ...undoRedoState.present.imageParams,
        [param]: value
      };

      const newGrid = await processImageToGrid(
        originalImageData,
        currentPreset.width,
        currentPreset.height,
        newImageParams
      );

      setUndoRedoState(currentState => ({
        past: [...currentState.past, currentState.present],
        present: {
          ...currentState.present,
          gridStates: {
            ...currentState.present.gridStates,
            [currentState.present.selectedPreset]: newGrid
          },
          imageParams: newImageParams,
          gridParams: currentState.present.gridParams || DEFAULT_GRID_PARAMS
        },
        future: []
      }));
    } catch (error) {
      console.error('Error updating image parameters:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!generationText.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
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
      const imageUrls = data.provider_response?.images?.map(img => img.url) || [];
      setGeneratedImages(imageUrls);
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate nonogram. Please try again...');
    } finally {
      setIsGenerating(false);
    }
  };

  const convertUrlToDataUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting URL to data URL:', error);
      return url; // Fall back to original URL if conversion fails
    }
  };

  const handleUseGeneratedImage = async (imageUrl: string) => {
    setProcessing(true);
    setExportUrl(null); // Clear export URL when using a new generated image
    try {
      const dataUrl = await convertUrlToDataUrl(imageUrl);
      const currentPreset = GRID_PRESETS[undoRedoState.present.selectedPreset];
      const newGrid = await processImageToGrid(
        dataUrl,
        currentPreset.width,
        currentPreset.height,
        undoRedoState.present.imageParams
      );

      setUndoRedoState(currentState => ({
        past: [...currentState.past, currentState.present],
        present: {
          ...currentState.present,
          gridStates: {
            ...currentState.present.gridStates,
            [currentState.present.selectedPreset]: newGrid
          },
          gridParams: currentState.present.gridParams || DEFAULT_GRID_PARAMS
        },
        future: []
      }));

      setOriginalImageData(imageUrl);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      const currentGrid = undoRedoState.present.gridStates[undoRedoState.present.selectedPreset];
      const dataUrl = await exportGridToImage(currentGrid);
      setExportUrl(dataUrl);
    } catch (error) {
      console.error('Error exporting grid:', error);
      alert('Failed to export the nonogram as image.');
    }
  };

  return (
    <Card className="w-full max-w-[90vw] mx-auto p-4">
      <CardHeader className="text-center">
        <div className="flex justify-between items-center mb-4">
          <img 
            src="https://nxtphase.ai/images/logo.svg" 
            alt="Logo" 
            className="h-12 object-contain"
          />
          <img 
            src="https://www.keesing.com/wp-content/uploads/2024/02/logo-keesing-white.svg" 
            alt="Keesing Logo" 
            className="h-12 object-contain"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Controls Column */}
          <div className="w-1/4 flex flex-col gap-4 h-[calc(100vh-6rem)] overflow-y-auto">
            <GridControls
              selectedPreset={undoRedoState.present.selectedPreset}
              presets={GRID_PRESETS}
              processing={processing}
              onPresetChange={handlePresetChange}
              onClear={handleClear}
            />

            <ZoomControl
              zoom={zoom}
              onZoomChange={setZoom}
            />

            <ColorPalette
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />

            <TextGenerationArea
              generationText={generationText}
              isGenerating={isGenerating}
              processing={processing}
              generatedImages={generatedImages}
              onTextChange={setGenerationText}
              onGenerate={handleGenerate}
              onUseGeneratedImage={handleUseGeneratedImage}
              onFocusChange={setTextareaFocused}
            />

            <FileControls
              imagePreview={imagePreview}
              exportUrl={exportUrl}
              onFileUpload={handleFileUpload}
              onSave={handleSave}
              onLoad={handleLoad}
              onExport={handleExport}
            />

            {originalImageData && (
              <ImageProcessingControls
                show={true}
                imageParams={undoRedoState.present.imageParams}
                onParamChange={handleParamChange}
                processing={processing}
              />
            )}
          </div>

          {/* Grid Column */}
          <div className="w-3/4 sticky top-4">
            <NonogramGrid
              grid={undoRedoState.present.gridStates[undoRedoState.present.selectedPreset]}
              currentPreset={GRID_PRESETS[undoRedoState.present.selectedPreset]}
              zoom={zoom}
              offsetX={undoRedoState.present.gridParams?.offsetX || 0}
              offsetY={undoRedoState.present.gridParams?.offsetY || 0}
              processing={processing}
              shortcutsEnabled={!textareaFocused}
              onToggleCell={toggleCell}
              selectedColor={selectedColor}
              isRKeyPressed={isRKeyPressed}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
