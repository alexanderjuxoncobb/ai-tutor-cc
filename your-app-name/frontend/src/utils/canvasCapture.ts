import type { WhiteboardImageData } from '../core/types';

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

export function captureWhiteboardImage(): CaptureResult {
  try {
    const canvas = findWhiteboardCanvas();
    
    if (!canvas) {
      return {
        success: false,
        error: 'Could not find whiteboard canvas element'
      };
    }

    console.log("📷 Capturing whiteboard image...");
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1]; // Remove data:image/png;base64, prefix
    
    console.log("🖼️ Image data length:", dataUrl.length);
    
    return {
      success: true,
      imageData: {
        data: base64Data,
        mimeType: 'image/png'
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
  analyzeFunction: (imageData: WhiteboardImageData) => Promise<void>
): Promise<boolean> {
  const result = captureWhiteboardImage();
  
  if (!result.success || !result.imageData) {
    console.error("❌ Failed to capture whiteboard:", result.error);
    return false;
  }

  try {
    console.log("📤 Sending whiteboard image for analysis...");
    await analyzeFunction(result.imageData);
    console.log("✅ Whiteboard analysis completed");
    return true;
  } catch (error) {
    console.error("❌ Failed to analyze whiteboard:", error);
    return false;
  }
}