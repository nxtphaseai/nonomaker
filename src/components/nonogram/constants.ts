export const GRID_PRESETS = [
  { label: 'Custom', width: 40, height: 40 },
  { label: '15×15', width: 15, height: 15 },
  { label: '15×20', width: 15, height: 20 },
  { label: '20×15', width: 20, height: 15 },
  { label: '20×20', width: 20, height: 20 },
  { label: '20×30', width: 20, height: 30 },
  { label: '30×20', width: 30, height: 20 },
  { label: '25×25', width: 25, height: 25 },
  { label: '25×35', width: 25, height: 35 },
  { label: '30×30', width: 30, height: 30 },
  { label: '30×40', width: 30, height: 40 },
  { label: '35×35', width: 35, height: 35 },
  { label: '35×45', width: 35, height: 45 },
  { label: '40×50', width: 40, height: 50 },
  { label: '45×45', width: 45, height: 45 },
  { label: '50×50', width: 50, height: 50 },
  { label: '50×55', width: 50, height: 55 },
  { label: '50×60', width: 50, height: 60 },
  { label: '55×55', width: 55, height: 55 },
  { label: '70×35', width: 70, height: 35 },
  { label: '80×50', width: 80, height: 50 }
];

export const DEFAULT_IMAGE_PARAMS = {
  redWeight: 0.299,
  greenWeight: 0.587,
  blueWeight: 0.114,
  brightnessThreshold: 150,
  contrast: 1.0,
  zoom: 1.0,
  panX: 0.5,
  panY: 0.5,
  stretchX: 1.0,
  stretchY: 1.0
} as const;

export const API_ENDPOINT = 'https://my.orq.ai/v2/deployments/invoke';
export const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3Jrc3BhY2VJZCI6ImFkYTNkZjllLWY1YTUtNDE0Ni1hNTUzLWM3OTQxNmYyY2EwNCIsImlzcyI6Im9ycSIsImlhdCI6MTczODMzODE5Nn0.Cx31E198s2jIGN25zwE6FQdAk2cIWB71dAvVv8tQgg8';
