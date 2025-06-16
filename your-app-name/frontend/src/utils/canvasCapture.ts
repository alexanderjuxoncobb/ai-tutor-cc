import type { WhiteboardImageData } from '../core/types';

// Coordinate-based update detection for simple strokes
export interface StrokeCoordinates {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface SimpleStroke {
  coordinates: StrokeCoordinates[];
  type: 'draw' | 'erase';
  isComplete: boolean;
}

// Simple stroke detection for coordinate-based updates
export function detectSimpleStroke(elements: any[]): SimpleStroke | null {
  if (!elements || elements.length === 0) return null;
  
  const lastElement = elements[elements.length - 1];
  
  // Check if it's a simple path that can be represented as coordinates
  if (lastElement.type === 'freedraw' && lastElement.points) {
    const coordinates: StrokeCoordinates[] = lastElement.points.map((point: any, index: number) => ({
      x: point[0],
      y: point[1],
      pressure: point[2] || 1.0,
      timestamp: Date.now() + index
    }));
    
    return {
      coordinates,
      type: 'draw',
      isComplete: true
    };
  }
  
  return null;
}

const POSSIBLE_CANVAS_SELECTORS = [
  'canvas[data-testid="canvas"]',
  '.excalidraw__canvas canvas', 
  '.excalidraw canvas',
  'canvas'
];

export interface CaptureResult {
  success: boolean;
  imageData?: WhiteboardImageData;
  error?: string;
}

export interface CaptureOptions {
  quality?: number; // 0.1 to 1.0 for JPEG quality (PNG ignores this)
  format?: 'png' | 'jpeg';
  maxWidth?: number;
  maxHeight?: number;
  realTime?: boolean; // true for real-time updates, false for high-quality capture
}

export function findWhiteboardCanvas(): HTMLCanvasElement | null {
  for (const selector of POSSIBLE_CANVAS_SELECTORS) {
    const canvas = document.querySelector(selector) as HTMLCanvasElement;
    if (canvas) {
      console.log("✅ Found canvas with selector:", selector);
      return canvas;
    }
  }
  
  console.warn("⚠️ Could not find whiteboard canvas element");
  console.log("🔍 Available canvas elements:", document.querySelectorAll('canvas'));
  return null;
}

export function captureWhiteboardImage(options: CaptureOptions = {}): CaptureResult {
  try {
    const canvas = findWhiteboardCanvas();
    
    if (!canvas) {
      return {
        success: false,
        error: 'Could not find whiteboard canvas element'
      };
    }

    // Apply optimization settings
    const format = options.format || (options.realTime ? 'jpeg' : 'png');
    const quality = options.quality || (options.realTime ? 0.5 : 1.0);
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    console.log(`📷 Capturing whiteboard image (${format}, quality: ${quality})...`);
    
    let captureCanvas = canvas;
    
    // If size limits are specified, create a scaled version
    if (options.maxWidth || options.maxHeight) {
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d')!;
      
      const scale = Math.min(
        options.maxWidth ? options.maxWidth / canvas.width : 1,
        options.maxHeight ? options.maxHeight / canvas.height : 1,
        1 // Never scale up
      );
      
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;
      
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      captureCanvas = tempCanvas;
      
      console.log(`🔄 Scaled canvas from ${canvas.width}x${canvas.height} to ${tempCanvas.width}x${tempCanvas.height}`);
    }
    
    const dataUrl = format === 'jpeg' 
      ? captureCanvas.toDataURL('image/jpeg', quality)
      : captureCanvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1]; // Remove data:image/[format];base64, prefix
    
    console.log(`🖼️ Image data length: ${dataUrl.length} (${Math.round(dataUrl.length / 1024)}KB)`);
  
  // Log performance metrics for real-time captures
  if (options.realTime) {
    console.log(`⚡ Real-time capture: ${format} at ${Math.round(quality * 100)}% quality`);
  }
    
    return {
      success: true,
      imageData: {
        data: base64Data,
        mimeType: mimeType
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Failed to capture whiteboard image:", error);
    
    return {
      success: false,
      error: `Failed to capture whiteboard: ${errorMessage}`
    };
  }
}

export async function captureAndAnalyzeWhiteboard(
  analyzeFunction: (imageData: WhiteboardImageData) => Promise<void>,
  options: CaptureOptions = {}
): Promise<boolean> {
  // Use more aggressive optimization for real-time analysis
  const captureOptions = {
    realTime: true,
    format: 'jpeg' as const,
    quality: 0.5,  // Reduced from 0.7 to 0.5 (50% quality)
    maxWidth: 600,  // Reduced from 800 to 600
    maxHeight: 450, // Reduced from 600 to 450
    ...options
  };
  
  const result = captureWhiteboardImage(captureOptions);
  
  if (!result.success || !result.imageData) {
    console.error("❌ Failed to capture whiteboard:", result.error);
    return false;
  }

  try {
    console.log("📤 Sending whiteboard image for analysis...");
    // Use background processing for analysis to avoid blocking UI
    const analysisPromise = analyzeFunction(result.imageData);
    
    if (options.realTime) {
      // Don't wait for analysis in real-time mode - let it run in background
      analysisPromise.catch(error => {
        console.error("❌ Background whiteboard analysis failed:", error);
      });
      console.log("🔄 Whiteboard analysis started in background");
      return true;
    } else {
      // Wait for analysis in manual/high-quality mode
      await analysisPromise;
      console.log("✅ Whiteboard analysis completed");
      return true;
    }
  } catch (error) {
    console.error("❌ Failed to analyze whiteboard:", error);
    return false;
  }
}

// High-quality capture for manual analysis
export async function captureAndAnalyzeWhiteboardHighQuality(
  analyzeFunction: (imageData: WhiteboardImageData) => Promise<void>
): Promise<boolean> {
  return captureAndAnalyzeWhiteboard(analyzeFunction, {
    realTime: false,
    format: 'png',
    quality: 1.0
  });
}