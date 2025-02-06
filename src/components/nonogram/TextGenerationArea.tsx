import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TextGenerationAreaProps {
  generationText: string;
  isGenerating: boolean;
  processing: boolean;
  generatedImages: string[];
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  onUseGeneratedImage: (imageUrl: string) => void;
  onFocusChange: (focused: boolean) => void;
}

export const TextGenerationArea: React.FC<TextGenerationAreaProps> = ({
  generationText,
  isGenerating,
  processing,
  generatedImages,
  onTextChange,
  onGenerate,
  onUseGeneratedImage,
  onFocusChange,
}) => {
  const [isImagesExpanded, setIsImagesExpanded] = useState(true);

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <div className="space-y-2">
        <label htmlFor="generation-text" className="text-sm font-medium">
          Text to Image Generation
        </label>
        <textarea
          id="generation-text"
          value={generationText}
          onChange={(e) => onTextChange(e.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          disabled={isGenerating}
          className="w-full min-h-[100px] p-2 border rounded-md"
          placeholder="Enter your image description..."
        />
        <button
          onClick={onGenerate}
          disabled={isGenerating || !generationText}
          className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md 
            transition-colors shadow-sm text-sm font-medium
            ${(isGenerating || !generationText) 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-blue-600'}`}
        >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </button>
      </div>

      {generatedImages.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setIsImagesExpanded(!isImagesExpanded)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-600"
          >
            Generated Images ({generatedImages.length})
            {isImagesExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {isImagesExpanded && (
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((url, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                >
                  <div className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={() => onUseGeneratedImage(url)}
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
      )}
    </div>
  );
};
