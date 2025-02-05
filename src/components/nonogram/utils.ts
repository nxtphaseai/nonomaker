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

        // Calculate source rectangle based on zoom and pan
        const sourceWidth = img.width / imageParams.zoom;
        const sourceHeight = img.height / imageParams.zoom;
        
        // Calculate source position based on pan values
        const maxX = img.width - sourceWidth;
        const maxY = img.height - sourceHeight;
        const sourceX = maxX * imageParams.panX;
        const sourceY = maxY * imageParams.panY;

        // Draw the zoomed and panned region
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
          0, 0, width, height                          // Destination rectangle
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
