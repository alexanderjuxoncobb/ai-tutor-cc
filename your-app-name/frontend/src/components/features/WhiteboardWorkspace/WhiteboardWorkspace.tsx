/**
 * Whiteboard workspace component with integrated capture and debugging
 */

import React, { useState } from 'react';
import Whiteboard from '../../Whiteboard';
import { Button } from '../../ui';
import type { BaseComponentProps } from '../../../types';
import './WhiteboardWorkspace.css';

interface WhiteboardWorkspaceProps extends BaseComponentProps {
  onElementsChange: (elements: any[]) => void;
  onStrokeCompleted: () => void;
  onManualCapture?: () => void;
  debugImage?: string | null;
  onDebugImageClose?: () => void;
  isSessionActive?: boolean;
  title?: string;
  showManualCapture?: boolean;
  showDebugSection?: boolean;
}

export const WhiteboardWorkspace: React.FC<WhiteboardWorkspaceProps> = ({
  onElementsChange,
  onStrokeCompleted,
  onManualCapture,
  debugImage = null,
  onDebugImageClose,
  isSessionActive = false,
  title = '📝 Work Space',
  showManualCapture = true,
  showDebugSection = true,
  className = '',
  children
}) => {
  const [elementCount, setElementCount] = useState(0);

  const handleElementsChange = (elements: any[]) => {
    setElementCount(elements.length);
    onElementsChange(elements);
  };

  const allClasses = ['whiteboard-workspace', className].filter(Boolean).join(' ');

  return (
    <section className={allClasses}>
      <div className="whiteboard-workspace__header">
        <h2 className="whiteboard-workspace__title">{title}</h2>
        
        <div className="whiteboard-workspace__info">
          <span className="whiteboard-workspace__element-count">
            Elements: {elementCount}
          </span>
          {isSessionActive && (
            <span className="whiteboard-workspace__auto-analysis">
              🤖 Auto-analysis enabled
            </span>
          )}
        </div>
      </div>

      <div className="whiteboard-workspace__content">
        {/* Manual capture controls */}
        {showManualCapture && onManualCapture && (
          <div className="whiteboard-workspace__controls">
            <Button
              variant="warning"
              onClick={onManualCapture}
              disabled={!isSessionActive}
              className="whiteboard-workspace__capture-btn"
            >
              📷 Capture & Send to AI
            </Button>
            <small className="whiteboard-workspace__capture-hint">
              Click to manually send your current drawing to the AI for analysis
            </small>
          </div>
        )}

        {/* Whiteboard component */}
        <div className="whiteboard-workspace__board">
          <Whiteboard
            onElementsChange={handleElementsChange}
            onStrokeCompleted={onStrokeCompleted}
          />
        </div>

        {/* Debug section */}
        {showDebugSection && debugImage && (
          <div className="whiteboard-workspace__debug">
            <div className="whiteboard-workspace__debug-header">
              <h3 className="whiteboard-workspace__debug-title">
                🔍 Debug: What AI Sees
              </h3>
              <Button
                variant="secondary"
                size="small"
                onClick={onDebugImageClose}
                className="whiteboard-workspace__debug-close"
              >
                ❌ Close
              </Button>
            </div>
            
            <p className="whiteboard-workspace__debug-description">
              This is the exact image being sent to the AI:
            </p>
            
            <div className="whiteboard-workspace__debug-image-container">
              <img
                src={debugImage}
                alt="Debug preview of image sent to AI"
                className="whiteboard-workspace__debug-image"
              />
            </div>
          </div>
        )}

        {children}
      </div>
    </section>
  );
};