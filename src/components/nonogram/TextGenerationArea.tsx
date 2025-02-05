import React from 'react';

interface TextGenerationAreaProps {
  generationText: string;
  isGenerating: boolean;
  processing: boolean;
  generatedImages: string[];
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  onUseGeneratedImage: (imageUrl: string) => void;
}

export const TextGenerationArea: React.FC<TextGenerationAreaProps> = ({
  generationText,
  isGenerating,
  processing,
  generatedImages,
  onTextChange,
  onGenerate,
  onUseGeneratedImage,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
      <textarea 
        className="w-full p-2 border border-gray-200 rounded-md" 
        rows={5} 
        placeholder="Enter your text here..."
        value={generationText}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={isGenerating}
      />
      <button
        className={`px-4 py-2 bg-green-500 text-white rounded-md transition-colors shadow-sm ${
          isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
        }`}
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>

      {generatedImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
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
  );
};
