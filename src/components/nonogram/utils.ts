export function createEmptyGrid(width: number, height: number): string[][] {
  return Array.from({ length: height }, () => 
    Array.from({ length: width }, () => 'none')
  );
}

export async function processImageToGrid(
  imageData: string,
  width: number,
  height: number,
  imageParams: {
    redWeight: number;
    greenWeight: number;
    blueWeight: number;
    brightnessThreshold: number;
    contrast: number;
    zoom: number;
    panX: number;
    panY: number;
    stretchX: number;
    stretchY: number;
  }
): Promise<string[][]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  return new Promise<string[][]>((resolve, reject) => {
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        
        canvas.width = width;
        canvas.height = height;

        // Fill canvas with white first
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Calculate source rectangle based on zoom and stretch
        const sourceWidth = (img.width / imageParams.zoom) / imageParams.stretchX;
        const sourceHeight = (img.height / imageParams.zoom) / imageParams.stretchY;
        
        // Calculate source position based on pan values
        const maxX = img.width - sourceWidth;
        const maxY = img.height - sourceHeight;
        const sourceX = maxX * imageParams.panX;
        const sourceY = maxY * imageParams.panY;

        // Calculate destination rectangle to maintain aspect ratio
        let destWidth = width;
        let destHeight = height;
        let destX = 0;
        let destY = 0;

        // Adjust destination rectangle based on stretch values
        if (imageParams.stretchX > imageParams.stretchY) {
          // Horizontal stretch is larger, adjust height
          destHeight = height / imageParams.stretchX * imageParams.stretchY;
          destY = (height - destHeight) / 2;
        } else {
          // Vertical stretch is larger, adjust width
          destWidth = width / imageParams.stretchY * imageParams.stretchX;
          destX = (width - destWidth) / 2;
        }

        // Draw the zoomed, panned, and stretched region
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
          destX, destY, destWidth, destHeight          // Destination rectangle
        );
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const newGrid = createEmptyGrid(width, height);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const brightness = (
              imageData.data[i] * imageParams.redWeight + 
              imageData.data[i + 1] * imageParams.greenWeight + 
              imageData.data[i + 2] * imageParams.blueWeight
            ) * imageParams.contrast;
            newGrid[y][x] = brightness < imageParams.brightnessThreshold ? 'black' : 'none';
          }
        }
        
        resolve(newGrid);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      // If the image fails to load with CORS, try to proxy it
      console.log('error', error);
      if (!imageData.startsWith('data:')) {
        // Create a proxy URL using a CORS proxy service
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${imageData}`;
        img.src = proxyUrl;
      } else {
        reject(new Error('Failed to load image'));
      }
    };
    
    // Start loading the image
    img.src = imageData;
  });
}

export function exportGridToImage(
  grid: string[][]
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Set canvas size to match grid dimensions exactly (1 pixel per cell)
    const width = grid[0].length;
    const height = grid.length;
    canvas.width = width;
    canvas.height = height;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Draw cells at 1:1 pixel ratio
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cellValue = grid[y][x];
        if (cellValue !== 'none') {
          ctx.fillStyle = cellValue;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Convert canvas to data URL
    resolve(canvas.toDataURL('image/bmp'));
  });
}
