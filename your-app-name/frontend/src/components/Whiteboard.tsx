import { useCallback, useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

interface WhiteboardProps {
  onElementsChange?: (elements: any[]) => void;
  onStrokeCompleted?: () => void;
}

export default function Whiteboard({ onElementsChange, onStrokeCompleted }: WhiteboardProps) {
  const lastElementCountRef = useRef(0);
  const isDrawingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

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
      style={{ height: '85vh', width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
      onPointerUp={handlePointerUp}
      onPointerDown={handlePointerDown}
    >
      <style>{`
        .excalidraw .Island:not(.App-toolbar) {
          transform: scale(0.6);
          transform-origin: top left;
        }
        .excalidraw {
          border-radius: 0.75rem;
        }
      `}</style>
      <Excalidraw
        onChange={handleChange}
        initialData={{
          appState: {
            currentItemStrokeWidth: 1, // Set default stroke width to small (1)
            activeTool: {
              locked: true // NOTE TO CLAUDE: Do not change this property - keeps selected tool active after drawing instead of switching back to selection tool
            }
          }
        }}
      />
    </div>
  );
}