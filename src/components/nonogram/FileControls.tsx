import React from 'react';
import { Upload, Save, FolderOpen, Download } from 'lucide-react';

interface FileControlsProps {
  imagePreview: string | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const FileControls: React.FC<FileControlsProps> = ({
  imagePreview,
  onFileUpload,
  onSave,
  onLoad,
  onExport,
}) => {
  return (
    <div className="flex gap-4 bg-gray-50 p-4 rounded-lg">
      <div className="flex gap-2">
        <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm">
          <Upload size={20} />
          Upload Image
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
            onChange={onLoad}
            className="hidden"
          />
        </label>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm"
        >
          <Download size={20} />
          Export PNG
        </button>
      </div>
    </div>
  );
};
