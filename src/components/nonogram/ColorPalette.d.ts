interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

declare const ColorPalette: React.FC<ColorPaletteProps>;
export default ColorPalette; 