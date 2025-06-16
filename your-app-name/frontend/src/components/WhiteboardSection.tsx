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
    <section className="whiteboard-section">
      <h2>📝 Work Space</h2>
      <Whiteboard 
        onElementsChange={onElementsChange} 
        onStrokeCompleted={onStrokeCompleted}
      />
    </section>
  );
}