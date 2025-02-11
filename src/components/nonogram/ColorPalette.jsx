import React from 'react';

const COLORS = [
  { name: 'white', value: 'none' },
  { name: 'black', value: 'black' },
  { name: 'red', value: 'red' },
  { name: 'blue', value: 'blue' },
  { name: 'green', value: 'green' },
  { name: 'yellow', value: 'yellow' },
  { name: 'purple', value: 'purple' },
  { name: 'orange', value: 'orange' },
  { name: 'pink', value: 'pink' },
  { name: 'brown', value: 'brown' },
  { name: 'gray', value: 'gray' },
  { name: 'cyan', value: 'cyan' },
  { name: 'magenta', value: 'magenta' }
];

function ColorPalette({ selectedColor, onColorSelect }) {
  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">Color:</label>
        <div className="flex gap-1 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => onColorSelect(color.value)}
              className={`
                w-6 h-6 rounded-sm border
                transition-all
                ${selectedColor === color.value ? 'border-blue-500 scale-110' : 'border-gray-200'}
                hover:scale-105
              `}
              style={{
                backgroundColor: color.value === 'none' ? 'white' : color.value,
                boxShadow: color.value === 'none' ? 'inset 0 0 0 1px #ddd' : 'none'
              }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ColorPalette; 