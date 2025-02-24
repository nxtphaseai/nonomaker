export interface GridPreset {
  label: string;
  width: number;
  height: number;
}

export interface ImageParams {
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
  inverted: boolean;
  flipped: boolean;
}

export interface GridStates {
  [key: number]: string[][];
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

export interface ProviderResponse {
  images: GeneratedImage[];
}

export interface ApiResponse {
  provider_response: ProviderResponse;
}

export interface GridParams {
  offsetX: number;
  offsetY: number;
}

export type Tool = 'draw' | 'erase' | 'fill';
