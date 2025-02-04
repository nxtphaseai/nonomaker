import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GridControls } from './GridControls';
import { ZoomControl } from './ZoomControl';
import { TextGenerationArea } from './TextGenerationArea';
import { FileControls } from './FileControls';
import { ImageProcessingControls } from './ImageProcessingControls';
import { NonogramGrid } from './NonogramGrid';
import { createEmptyGrid, processImageToGrid } from './utils';
import { GRID_PRESETS, DEFAULT_IMAGE_PARAMS, API_ENDPOINT, API_KEY } from './constants';
import { GridStates, ImageParams, ApiResponse } from './types';

export const NonogramEditor: React.FC = () => {
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

  const [imageParams, setImageParams] = useState<ImageParams>(DEFAULT_IMAGE_PARAMS);
  const [zoom, setZoom] = useState(1.5);
  const [generationText, setGenerationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isRKeyPressed, setIsRKeyPressed] = useState(false);

  const currentPreset = GRID_PRESETS[selectedPreset];
  const grid = gridStates[selectedPreset];

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
        currentPreset.height,
        imageParams
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
    try {
      const saveData = {
        version: 1,
        timestamp: new Date().toISOString(),
        preset: selectedPreset,
        grid: grid,
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
          setSelectedPreset(saveData.preset);
          setGridStates(prev => ({
            ...prev,
            [saveData.preset]: saveData.grid
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
    setGridStates(prev => ({
      ...prev,
      [selectedPreset]: createEmptyGrid(currentPreset.width, currentPreset.height)
    }));
    setImagePreview(null);
    setOriginalImageData(null);
  };

  const handlePresetChange = async (index: number) => {
    if (index === selectedPreset) return;
    
    setGridStates(prev => ({
      ...prev,
      [selectedPreset]: grid
    }));
    
    setSelectedPreset(index);
    
    if (originalImageData && !gridStates[index]) {
      setProcessing(true);
      try {
        const newGrid = await processImageToGrid(
          originalImageData,
          GRID_PRESETS[index].width,
          GRID_PRESETS[index].height,
          imageParams
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

  const handleParamChange = async (param: keyof ImageParams, value: number) => {
    if (!originalImageData) return;
    
    const newParams = { ...imageParams, [param]: value };
    setImageParams(newParams);
    
    setProcessing(true);
    try {
      const newGrid = await processImageToGrid(
        originalImageData,
        currentPreset.width,
        currentPreset.height,
        newParams
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

  const handleUseGeneratedImage = async (imageUrl: string) => {
    setProcessing(true);
    try {
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
        currentPreset.height,
        imageParams
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

  return (
    <Card className="w-full max-w-[90vw] mx-auto p-4">
      <CardHeader className="text-center">
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
            <GridControls
              selectedPreset={selectedPreset}
              presets={GRID_PRESETS}
              processing={processing}
              onPresetChange={handlePresetChange}
              onClear={handleClear}
            />

            <ZoomControl
              zoom={zoom}
              onZoomChange={setZoom}
            />

            <TextGenerationArea
              generationText={generationText}
              isGenerating={isGenerating}
              processing={processing}
              generatedImages={generatedImages}
              onTextChange={setGenerationText}
              onGenerate={handleGenerate}
              onUseGeneratedImage={handleUseGeneratedImage}
            />

            <FileControls
              imagePreview={imagePreview}
              onFileUpload={handleFileUpload}
              onSave={handleSave}
              onLoad={handleLoad}
            />

            <ImageProcessingControls
              imageParams={imageParams}
              onParamChange={handleParamChange}
              show={!!originalImageData}
            />
          </div>

          {/* Grid Column */}
          <div className="w-3/4">
            <NonogramGrid
              grid={grid}
              currentPreset={currentPreset}
              zoom={zoom}
              isRKeyPressed={isRKeyPressed}
              processing={processing}
              onToggleCell={toggleCell}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
