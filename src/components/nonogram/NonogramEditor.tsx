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
import { GridStates, ImageParams, ApiResponse, GridParams, Tool } from './types';
import ColorPalette from './ColorPalette';
import { ChevronLeft, ChevronRight, GripVertical, Pencil, Eraser, Droplet } from "lucide-react";
import { ShortcutsDialog } from './ShortcutsDialog';
import { Toaster } from "@/components/ui/toaster";
import { ViewportControls } from './ViewportControls';

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
        selectedPreset: 0,
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

  // Introduce a separate state to hold the dropdown's selected value.
  // This prevents updating the grid resolution immediately when "Custom" is chosen.
  const [dropdownPreset, setDropdownPreset] = useState<number>(0);

  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [controlsWidth, setControlsWidth] = useState(20); // Store width as percentage
  const minWidth = 15; // Minimum width percentage
  const maxWidth = 40; // Maximum width percentage

  const currentPreset = GRID_PRESETS[undoRedoState.present.selectedPreset];

  // Add this state declaration with the other state declarations
  const [selectedTool, setSelectedTool] = useState<Tool>('draw');

  // Add state for content offset
  const [contentOffset, setContentOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

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

  /**
   * Handles preset changes from the dropdown.
   * - For non-custom presets: resizing happens immediately (with grid content preserved).
   * - For the custom preset (index 0): only the dropdown state is updated; the grid remains unchanged.
   */
  const handlePresetChange = (presetIndex: number) => {
    if (presetIndex !== 0) {
      // For non-custom presets, update both the dropdown and grid state.
      setDropdownPreset(presetIndex);
      setExportUrl(null); // Clear export URL when grid size changes.
      setUndoRedoState(currentState => {
        const currentGrid = currentState.present.gridStates[currentState.present.selectedPreset];
        const newPreset = GRID_PRESETS[presetIndex];
        const oldPreset = GRID_PRESETS[currentState.present.selectedPreset];
        
        // Build a new grid while preserving existing content from the old grid.
        const newGrid = Array(newPreset.height)
          .fill(null)
          .map((_, y) =>
            Array(newPreset.width)
              .fill(null)
              .map((_, x) => {
                if (y < oldPreset.height && x < oldPreset.width) {
                  return currentGrid[y][x];
                }
                return 'none';
              })
          );
        
        return {
          past: [...currentState.past, currentState.present],
          present: {
            ...currentState.present,
            selectedPreset: presetIndex,
            gridParams: currentState.present.gridParams || DEFAULT_GRID_PARAMS,
            gridStates: {
              ...currentState.present.gridStates,
              [presetIndex]: newGrid
            }
          },
          future: []
        };
      });
    } else {
      // For the Custom preset, update only the dropdown selection.
      // The grid remains unchanged until the user clicks the "Set" button.
      setDropdownPreset(presetIndex);
    }
  };

  /**
   * Applies a custom grid size when the "Set" button is clicked.
   * Resizes the grid according to the provided width and height,
   * preserving any existing content (the top-left portion is retained).
   */
  const handleCustomSizeSet = (width: number, height: number) => {
    setExportUrl(null);
    setUndoRedoState(currentState => {
      const currentGrid = currentState.present.gridStates[currentState.present.selectedPreset];
      const oldPreset = GRID_PRESETS[currentState.present.selectedPreset];
      
      // Create a custom grid using the new dimensions.
      const newGrid = Array(height)
        .fill(null)
        .map((_, y) =>
          Array(width)
            .fill(null)
            .map((_, x) => {
              if (y < oldPreset.height && x < oldPreset.width) {
                return currentGrid[y][x];
              }
              return 'none';
            })
        );
      
      // Update the custom preset dimensions.
      GRID_PRESETS[0].width = width;
      GRID_PRESETS[0].height = height;
      
      return {
        past: [...currentState.past, currentState.present],
        present: {
          ...currentState.present,
          selectedPreset: 0,
          gridStates: {
            ...currentState.present.gridStates,
            0: newGrid // Save the custom grid.
          }
        },
        future: []
      };
    });
    // Also reflect the custom preset selection in the dropdown.
    setDropdownPreset(0);
  };

  const toggleCell = useCallback(
    (row: number, col: number, overrideColor?: string) => {
      setExportUrl(null);
      setUndoRedoState((currentState: any) => {
        const currentGrid = currentState.present.gridStates[currentState.present.selectedPreset];
        const newGrid = currentGrid.map((r: string[], i: number) =>
          i === row
            ? r.map((cell: string, j: number) =>
                j === col 
                  ? (selectedTool === 'erase' || overrideColor === 'none' 
                      ? 'none' 
                      : selectedColor)
                : cell
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
    [selectedColor, selectedTool]
  );

  const toggleMultipleCells = (cells: { row: number; col: number; color?: string }[], color: string) => {
    // Ensure cells is an array
    if (!Array.isArray(cells) || cells.length === 0) {
      return; // Exit early if there's nothing to toggle
    }

    // Create a deep copy of the current grid state
    const currentGridState = undoRedoState.present.gridStates[undoRedoState.present.selectedPreset];
    
    // Ensure we have a valid grid to work with
    if (!currentGridState || !Array.isArray(currentGridState) || currentGridState.length === 0) {
      return; // Exit if grid is invalid
    }
    
    const newGrid = currentGridState.map(row => [...row]);

    // Process each cell to toggle with defensive checks
    cells.forEach(cell => {
      // Ensure cell has valid row and col properties
      if (typeof cell.row !== 'number' || typeof cell.col !== 'number') {
        return; // Skip invalid cells
      }
      
      // Ensure the row and column are within bounds
      if (cell.row < 0 || cell.row >= newGrid.length || 
          cell.col < 0 || !newGrid[cell.row] || cell.col >= newGrid[cell.row].length) {
        return; // Skip out-of-bounds cells
      }
      
      // Toggle the cell using either the cell's color or the provided color parameter
      newGrid[cell.row][cell.col] = cell.color || color;
    });

    // Update the state with the new grid
    setUndoRedoState(prev => ({
      past: [...prev.past, prev.present],
      present: {
        ...prev.present,
        gridStates: {
          ...prev.present.gridStates,
          [prev.present.selectedPreset]: newGrid
        },
        gridParams: prev.present.gridParams || DEFAULT_GRID_PARAMS
      },
      future: []
    }));
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

  const handleInvert = () => {
    setUndoRedoState(currentState => {
      const currentGrid = currentState.present.gridStates[currentState.present.selectedPreset];
      const invertedGrid = currentGrid.map(row => 
        row.map(cell => cell === 'none' ? 'black' : 'none')
      );
      
      return {
        past: [...currentState.past, currentState.present],
        present: {
          ...currentState.present,
          gridStates: {
            ...currentState.present.gridStates,
            [currentState.present.selectedPreset]: invertedGrid
          }
        },
        future: []
      };
    });
  };

  /**
   * Global keydown listener for grid resizing shortcuts:
   *
   * Available modifiers for triggering a resize are:
   *   - Control, or
   *   - Meta (Command), or
   *   - Alt.
   *
   * When combined with an Arrow key:
   *   - Without Shift: Add a row or column.
   *   - With Shift: Remove a row or column.
   *
   * The handler checks the modifier keys using getModifierState.
   */
  useEffect(() => {
    const handleGridResizeKeyDown = (event: KeyboardEvent) => {
      // Log key details for debugging.
      console.log(
        "Grid resize key pressed:",
        event.key,
        "Control:",
        event.getModifierState("Control"),
        "Meta:",
        event.getModifierState("Meta"),
        "Alt:",
        event.getModifierState("Alt"),
        "Shift:",
        event.getModifierState("Shift")
      );

      // Only process arrow keys.
      if (!event.key.startsWith("Arrow")) return;

      // Check if at least one of the desired modifier keys is pressed.
      const hasAcceptedModifier =
        event.getModifierState("Control") ||
        event.getModifierState("Meta") ||
        event.getModifierState("Alt");

      if (!hasAcceptedModifier) return;

      // Prevent default behavior (such as scrolling) and stop propagation.
      event.preventDefault();
      event.stopPropagation();

      // If Shift is held, then we're in removal mode.
      const isRemoving = event.shiftKey;

      setUndoRedoState((currentState) => {
        // Get the current grid from the currently selected preset.
        const currentPreset = currentState.present.selectedPreset;
        const currentGrid = currentState.present.gridStates[currentPreset];
        if (!currentGrid || currentGrid.length === 0) return currentState;

        const currentHeight = currentGrid.length;
        const currentWidth = currentGrid[0].length;
        let newGrid = currentGrid;
        let newHeight = currentHeight;
        let newWidth = currentWidth;

        if (event.key === "ArrowUp") {
          if (isRemoving) {
            // Remove the top row if possible.
            if (currentHeight > 1) {
              newGrid = currentGrid.slice(1);
              newHeight = currentHeight - 1;
            }
          } else {
            // Add an empty row at the top.
            const emptyRow = new Array(currentWidth).fill("none");
            newGrid = [emptyRow, ...currentGrid];
            newHeight = currentHeight + 1;
          }
        } else if (event.key === "ArrowDown") {
          if (isRemoving) {
            // Remove the bottom row if possible.
            if (currentHeight > 1) {
              newGrid = currentGrid.slice(0, currentHeight - 1);
              newHeight = currentHeight - 1;
            }
          } else {
            // Add an empty row at the bottom.
            const emptyRow = new Array(currentWidth).fill("none");
            newGrid = [...currentGrid, emptyRow];
            newHeight = currentHeight + 1;
          }
        } else if (event.key === "ArrowLeft") {
          if (isRemoving) {
            // Remove the leftmost column if possible.
            if (currentWidth > 1) {
              newGrid = currentGrid.map((row) => row.slice(1));
              newWidth = currentWidth - 1;
            }
          } else {
            // Add an empty column at the left.
            newGrid = currentGrid.map((row) => ["none", ...row]);
            newWidth = currentWidth + 1;
          }
        } else if (event.key === "ArrowRight") {
          if (isRemoving) {
            // Remove the rightmost column if possible.
            if (currentWidth > 1) {
              newGrid = currentGrid.map((row) => row.slice(0, currentWidth - 1));
              newWidth = currentWidth - 1;
            }
          } else {
            // Add an empty column at the right.
            newGrid = currentGrid.map((row) => [...row, "none"]);
            newWidth = currentWidth + 1;
          }
        }

        // Update the custom preset dimensions so that the custom size fields are kept in sync.
        GRID_PRESETS[0].width = newWidth;
        GRID_PRESETS[0].height = newHeight;

        return {
          past: [...currentState.past, currentState.present],
          present: {
            ...currentState.present,
            selectedPreset: 0, // Force the grid into the custom preset.
            gridStates: {
              ...currentState.present.gridStates,
              0: newGrid,
            },
          },
          future: [],
        };
      });

      // Also update the dropdown to display the custom preset.
      setDropdownPreset(0);
    };

    document.addEventListener("keydown", handleGridResizeKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGridResizeKeyDown);
    };
  }, [setUndoRedoState, setDropdownPreset]);

  const handleResize = useCallback((e: MouseEvent) => {
    const windowWidth = window.innerWidth;
    const newWidth = (e.clientX / windowWidth) * 100;
    
    // Clamp the width between min and max values
    const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
    setControlsWidth(clampedWidth);
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      handleResize(e);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
  }, [handleResize]);

  const handleImageParamChange = async (param: keyof ImageParams, value: number | boolean) => {
    // Update the image params in the undo/redo state
    setUndoRedoState(prev => ({
      ...prev,
      present: {
        ...prev.present,
        imageParams: {
          ...prev.present.imageParams,
          [param]: value
        }
      }
    }));

    // If we have an image loaded, process it with the new params
    if (originalImageData) {
      setProcessing(true);
      try {
        const newGrid = await processImageToGrid(
          originalImageData,
          GRID_PRESETS[undoRedoState.present.selectedPreset].width,
          GRID_PRESETS[undoRedoState.present.selectedPreset].height,
          {
            ...undoRedoState.present.imageParams,
            [param]: value
          }
        );
        
        // Update the grid state in the undo/redo state
        setUndoRedoState(prev => ({
          ...prev,
          present: {
            ...prev.present,
            gridStates: {
              ...prev.present.gridStates,
              [prev.present.selectedPreset]: newGrid
            }
          }
        }));
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <Card className="w-full h-screen flex flex-col">
      <Toaster />
      {/* Header with logos */}
      <CardHeader className="border-b">
        <div className="flex justify-between items-center px-4">
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

      {/* Main content area */}
      <CardContent className="flex-1 flex overflow-hidden">
        {/* Controls Column - Resizable */}
        <div 
          className={`${isControlsOpen ? '' : 'w-0'} relative border-r overflow-y-auto p-4 flex flex-col gap-4`}
          style={{ 
            width: isControlsOpen ? `${controlsWidth}%` : '0%',
            minWidth: isControlsOpen ? `${minWidth}%` : '0%',
            maxWidth: `${maxWidth}%`,
            transition: isControlsOpen ? 'none' : 'width 300ms' // Only animate when collapsing/expanding
          }}
        >
          {isControlsOpen && (
            <>
              <GridControls
                selectedPreset={dropdownPreset}
                presets={GRID_PRESETS}
                processing={processing}
                onPresetChange={handlePresetChange}
                onCustomSizeSet={handleCustomSizeSet}
                onClear={handleClear}
                onInvert={handleInvert}
                customWidth={GRID_PRESETS[0].width.toString()}
                customHeight={GRID_PRESETS[0].height.toString()}
              />

              <div className="flex flex-col gap-4">
                <ZoomControl
                  zoom={zoom}
                  onZoomChange={setZoom}
                />

                <ViewportControls
                  contentOffset={contentOffset || { x: 0, y: 0 }}
                  onContentOffsetChange={(newOffset) => {
                    if (newOffset && typeof newOffset.x === 'number' && typeof newOffset.y === 'number') {
                      setContentOffset(newOffset);
                    }
                  }}
                />

                <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-medium">Tools:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTool('draw')}
                      className={`
                        p-2 rounded-md transition-all
                        ${selectedTool === 'draw' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                      title="Draw Tool (D)"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedTool('erase')}
                      className={`
                        p-2 rounded-md transition-all
                        ${selectedTool === 'erase' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                      title="Erase Tool (E)"
                    >
                      <Eraser className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedTool('fill')}
                      className={`
                        p-2 rounded-md transition-all
                        ${selectedTool === 'fill' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                      title="Fill Tool (F)"
                    >
                      <Droplet className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <ColorPalette
                  selectedColor={selectedColor}
                  onColorSelect={setSelectedColor}
                />

                {originalImageData && (
                  <ImageProcessingControls
                    show={true}
                    imageParams={undoRedoState.present.imageParams}
                    onParamChange={handleImageParamChange}
                    processing={processing}
                  />
                )}

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
              </div>
            </>
          )}

          {/* Resize Handle */}
          {isControlsOpen && (
            <div
              className="absolute right-0 top-0 h-full w-1 cursor-ew-resize group"
              onMouseDown={startResize}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 transform opacity-0 group-hover:opacity-100">
                <GripVertical className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Collapse/Expand Handle */}
        <button
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className="absolute top-1/2 -translate-y-1/2 transform z-10 bg-gray-200 hover:bg-gray-300 rounded-r-md p-1 shadow-md"
          style={{
            left: isControlsOpen ? `${controlsWidth}%` : '0%',
            transition: isControlsOpen ? 'none' : 'left 300ms' // Only animate when collapsing/expanding
          }}
        >
          {isControlsOpen ? (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Grid Column - Adjusts to remaining space */}
        <div 
          className="p-4 flex items-center justify-center"
          style={{ 
            width: isControlsOpen ? `${100 - controlsWidth}%` : '100%',
            transition: isControlsOpen ? 'none' : 'width 300ms' // Only animate when collapsing/expanding
          }}
        >
          <div className="flex flex-col gap-2 overflow-hidden">
            <NonogramGrid
              grid={undoRedoState.present.gridStates[undoRedoState.present.selectedPreset]}
              currentPreset={GRID_PRESETS[undoRedoState.present.selectedPreset]}
              zoom={zoom}
              offsetX={undoRedoState.present.gridParams?.offsetX || 0}
              offsetY={undoRedoState.present.gridParams?.offsetY || 0}
              processing={processing}
              shortcutsEnabled={!textareaFocused}
              onToggleCell={toggleCell}
              onToggleMultipleCells={(cells) => toggleMultipleCells(cells, selectedColor)}
              selectedTool={selectedTool}
              selectedColor={selectedColor}
              imageParams={undoRedoState.present.imageParams}
              onImageParamChange={handleImageParamChange}
              isRKeyPressed={isRKeyPressed}
              contentOffset={contentOffset}
              onContentOffsetChange={(newOffset) => {
                if (newOffset && typeof newOffset.x === 'number' && typeof newOffset.y === 'number') {
                  setContentOffset(newOffset);
                }
              }}
            />
          </div>
        </div>
      </CardContent>
      <ShortcutsDialog />
    </Card>
  );
};