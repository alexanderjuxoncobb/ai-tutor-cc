import Whiteboard from './Whiteboard';

interface WhiteboardSectionProps {
  onElementsChange: (elements: any[]) => void;
  onStrokeCompleted: () => void;
}

export default function WhiteboardSection({ 
  onElementsChange, 
  onStrokeCompleted 
}: WhiteboardSectionProps) {
  return (
    <div className="whiteboard-section">
      <Whiteboard 
        onElementsChange={onElementsChange} 
        onStrokeCompleted={onStrokeCompleted}
      />
    </div>
  );
}