import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: 'Ctrl+Z', description: 'Undo' },
  { key: 'Ctrl+Shift+Z', description: 'Redo' },
  { key: 'Click and drag', description: 'Draw' },
  { key: 'Right click', description: 'Delete' },
  { key: 'T', description: 'Toggle grid' },
  { key: 'H', description: 'Toggle hints' },
  { key: 'Ctrl+↑↓←→', description: 'Add row/column in direction' },
  { key: 'Ctrl+Shift+↑↓←→', description: 'Remove row/column in direction' }
];

export const ShortcutsDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors shadow-lg">
          <Keyboard className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 