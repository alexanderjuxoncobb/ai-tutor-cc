import { forwardRef } from 'react';
import Whiteboard, { type WhiteboardRef } from './Whiteboard';

interface WhiteboardSectionProps {
  onElementsChange: (elements: any[]) => void;
  onStrokeCompleted: () => void;
}

const WhiteboardSection = forwardRef<WhiteboardRef, WhiteboardSectionProps>(
  ({ onElementsChange, onStrokeCompleted }, ref) => {
    return (
      <div className="whiteboard-section">
        <Whiteboard 
          ref={ref}
          onElementsChange={onElementsChange} 
          onStrokeCompleted={onStrokeCompleted}
        />
      </div>
    );
  }
);

WhiteboardSection.displayName = 'WhiteboardSection';

export default WhiteboardSection;