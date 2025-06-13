import { useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

interface WhiteboardProps {
  onElementsChange?: (elements: any[]) => void;
  onStrokeCompleted?: () => void;
}

export default function Whiteboard({ onElementsChange, onStrokeCompleted }: WhiteboardProps) {
  const lastElementCountRef = useRef(0);
  const isDrawingRef = useRef(false);

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, _files: any) => {
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
    // When pointer is lifted, check if we were drawing
    if (isDrawingRef.current && onStrokeCompleted) {
      console.log('✅ Whiteboard: Stroke completed - notifying parent');
      // Small delay to ensure the element is fully committed
      setTimeout(() => {
        onStrokeCompleted();
      }, 100);
    }
    isDrawingRef.current = false;
  }, [onStrokeCompleted]);

  const handlePointerDown = useCallback(() => {
    // Reset drawing state when starting a new action
    isDrawingRef.current = false;
  }, []);

  return (
    <div 
      style={{ height: '500px', width: '100%' }}
      onPointerUp={handlePointerUp}
      onPointerDown={handlePointerDown}
    >
      <Excalidraw
        onChange={handleChange}
      />
    </div>
  );
}