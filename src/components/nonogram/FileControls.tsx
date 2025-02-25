import React from 'react';
import { Upload, Save, FolderOpen, Download } from 'lucide-react';

interface FileControlsProps {
  imagePreview: string | null;
  exportUrl: string | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  resolution?: number;
}

export const FileControls: React.FC<FileControlsProps> = ({
  imagePreview,
  exportUrl,
  onFileUpload,
  onSave,
  onLoad,
  onExport,
  resolution = 32,
}) => {
  const handleDownload = () => {
    if (!exportUrl) return;
    
    const randomLetters = Array(4)
      .fill(0)
      .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      .join('');
    
    const downloadLink = document.createElement('a');
    downloadLink.href = exportUrl;
    downloadLink.download = `nonogram-${resolution}-${randomLetters}.bmp`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <label className="flex items-center cursor-pointer p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm">
            <Upload size={20} />
            <input
              type="file"
              accept="image/*"
              onChange={onFileUpload}
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
            onClick={onSave}
            className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-sm"
          >
            <Save size={20} />
          </button>
          <label className="flex items-center cursor-pointer p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors shadow-sm">
            <FolderOpen size={20} />
            <input
              type="file"
              accept=".nono"
              onChange={onLoad}
              className="hidden"
            />
          </label>
          <button
            onClick={onExport}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Download size={20} />
          </button>
        </div>

        {exportUrl && (
          <button
            onClick={handleDownload}
            className="text-sm text-blue-500 hover:text-blue-600 underline"
          >
            Click here to download BMP
          </button>
        )}
      </div>
    </div>
  );
};
