import { useCallback, useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

interface WhiteboardProps {
  onElementsChange?: (elements: any[]) => void;
  onStrokeCompleted?: () => void;
}

export interface WhiteboardRef {
  addImageToCanvas: (imageDataUrl: string) => void;
}

const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(
  ({ onElementsChange, onStrokeCompleted }, ref) => {
    const lastElementCountRef = useRef(0);
    const isDrawingRef = useRef(false);
    const debounceTimerRef = useRef<number | null>(null);
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const handleChange = useCallback(
    (elements: readonly any[], _appState: any, _files: any) => {
      // Notify parent component of changes for AI analysis
      if (onElementsChange) {
        onElementsChange([...elements]); // Convert readonly to mutable array
      }

      // Detect stroke completion by monitoring element count changes
      const currentElementCount = elements.length;
      
      // If we're drawing and elements increased, a new stroke started
      if (currentElementCount > lastElementCountRef.current) {
        isDrawingRef.current = true;
        console.log('🖊️ Whiteboard: Drawing stroke detected');
      }
      
      // Update the last element count
      lastElementCountRef.current = currentElementCount;
    },
    [onElementsChange]
  );

  const handlePointerUp = useCallback(() => {
    // When pointer is lifted, start debouncing timer
    if (isDrawingRef.current && onStrokeCompleted) {
      console.log('✅ Whiteboard: Stroke completed - starting debounce timer');
      
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer for 1500ms debounce
      debounceTimerRef.current = setTimeout(() => {
        console.log('⏰ Whiteboard: Debounce timer completed - notifying parent');
        onStrokeCompleted();
        debounceTimerRef.current = null;
      }, 1500);
    }
    isDrawingRef.current = false;
  }, [onStrokeCompleted]);

  const handlePointerDown = useCallback(() => {
    // Reset drawing state when starting a new action
    isDrawingRef.current = false;
    
    // Cancel any pending debounced analysis when starting new stroke
    if (debounceTimerRef.current) {
      console.log('🚫 Whiteboard: Cancelling pending analysis - new stroke started');
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    addImageToCanvas: (imageDataUrl: string) => {
      console.log('🖼️ Whiteboard: Adding image to canvas', imageDataUrl.substring(0, 50) + '...');
      
      if (!excalidrawAPI) {
        console.error('❌ Whiteboard: Excalidraw API not available');
        return;
      }

      // Create a temporary Image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Calculate appropriate size (max 400px width, maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        const maxWidth = 400;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Generate unique file ID
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get current elements to preserve existing content
        const currentElements = excalidrawAPI.getSceneElements();

        // Smart positioning: avoid overlapping with existing elements
        let x = 50;
        let y = 50;
        
        // If there are existing elements, find a better position
        if (currentElements.length > 0) {
          const spacing = 20;
          let foundPosition = false;
          
          // Try positions in a grid pattern
          for (let row = 0; row < 5 && !foundPosition; row++) {
            for (let col = 0; col < 5 && !foundPosition; col++) {
              const testX = 50 + (col * (width + spacing));
              const testY = 50 + (row * (height + spacing));
              
              // Check if this position overlaps with existing elements
              const overlaps = currentElements.some((element: any) => {
                if (element.type === 'image' || element.type === 'rectangle' || element.type === 'text') {
                  const elementRight = element.x + element.width;
                  const elementBottom = element.y + element.height;
                  const testRight = testX + width;
                  const testBottom = testY + height;
                  
                  return !(testX > elementRight || testRight < element.x || 
                          testY > elementBottom || testBottom < element.y);
                }
                return false;
              });
              
              if (!overlaps) {
                x = testX;
                y = testY;
                foundPosition = true;
              }
            }
          }
          
          console.log(`🎯 Whiteboard: Positioned image at (${x}, ${y}) to avoid overlaps`);
        }

        // Create image element for Excalidraw
        const imageElement = {
          type: 'image',
          id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          x,
          y,
          width,
          height,
          angle: 0,
          strokeColor: '#000000',
          backgroundColor: 'transparent',
          fillStyle: 'solid',
          strokeWidth: 1,
          strokeStyle: 'solid',
          roundness: null,
          roughness: 0,
          opacity: 100,
          seed: Math.floor(Math.random() * 2 ** 31),
          version: 1,
          versionNonce: Math.floor(Math.random() * 2 ** 31),
          index: null,
          isDeleted: false,
          groupIds: [],
          frameId: null,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
          fileId,
          status: 'saved',
          scale: [1, 1],
          crop: null,
        };

        // Detect MIME type from data URL
        const mimeTypeMatch = imageDataUrl.match(/data:([^;]+);/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
        
        // Create file data with correct structure
        const timestamp = Date.now();
        const fileData = {
          [fileId]: {
            mimeType,
            id: fileId,
            dataURL: imageDataUrl,
            created: timestamp,
            lastRetrieved: timestamp,
          }
        };

        try {
          console.log('📁 Whiteboard: Adding file to cache:', {
            fileId,
            mimeType,
            dataURLLength: imageDataUrl.length,
            dataURLPrefix: imageDataUrl.substring(0, 50) + '...'
          });
          
          // First add the files to Excalidraw's file cache
          excalidrawAPI.addFiles(Object.values(fileData));
          
          console.log('📋 Whiteboard: Adding image element:', {
            x, y, width, height, fileId
          });
          
          // Then update scene with the image element
          excalidrawAPI.updateScene({
            elements: [...currentElements, imageElement],
          });
          
          console.log('✅ Whiteboard: Image added successfully');
        } catch (error) {
          console.error('❌ Whiteboard: Failed to add image', error);
          console.error('Error details:', error);
        }
      };
      
      img.onerror = () => {
        console.error('❌ Whiteboard: Failed to load image');
      };
      
      img.src = imageDataUrl;
    }
  }), [excalidrawAPI]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div 
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
      onPointerUp={handlePointerUp}
      onPointerDown={handlePointerDown}
    >
      <style>{`
        .excalidraw .Island:not(.App-toolbar) {
          transform: scale(0.8);
          transform-origin: top right;
        }
        .excalidraw {
          border-radius: 0.75rem;
        }
        /* Move main toolbar to right side and make it bigger */
        .excalidraw .Island.App-toolbar {
          left: auto !important;
          right: 20px !important;
          top: 20px !important;
          transform: scale(0.8) !important;
          transform-origin: top right !important;
        }
        /* Move secondary toolbars to right side as well */
        .excalidraw .Island:not(.App-toolbar) {
          left: auto !important;
          right: 20px !important;
        }
        /* Adjust transform origin for right-side positioning */
        .excalidraw .Island {
          transform-origin: top right !important;
        }
        /* Ensure proper spacing for stacked toolbars (adjusted for larger size) */
        .excalidraw .Island:not(.App-toolbar):nth-of-type(2) {
          top: 90px !important;
        }
        .excalidraw .Island:not(.App-toolbar):nth-of-type(3) {
          top: 160px !important;
        }
        /* Responsive adjustments for smaller screens */
        @media (max-width: 768px) {
          .excalidraw .Island {
            right: 10px !important;
          }
        }
      `}</style>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        initialData={{
          appState: {
            currentItemStrokeWidth: 1, // Set default stroke width to small (1)
            activeTool: {
              type: 'freedraw',
              customType: null,
              locked: true, // NOTE TO CLAUDE: Do not change this property - keeps selected tool active after drawing instead of switching back to selection tool
              lastActiveTool: null
            }
          }
        }}
      />
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';

export default Whiteboard;