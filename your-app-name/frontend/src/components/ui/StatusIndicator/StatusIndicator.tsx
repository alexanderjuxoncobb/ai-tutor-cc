/**
 * Status indicator component for showing connection and activity states
 */

import React from 'react';
import type { StatusIndicatorProps } from '../../../types';
import './StatusIndicator.css';

const statusConfig = {
  idle: {
    icon: '⚪',
    label: 'Idle',
    className: 'status-indicator--idle'
  },
  connecting: {
    icon: '🔄',
    label: 'Connecting',
    className: 'status-indicator--connecting'
  },
  connected: {
    icon: '✅',
    label: 'Connected',
    className: 'status-indicator--connected'
  },
  error: {
    icon: '❌',
    label: 'Error',
    className: 'status-indicator--error'
  },
  recording: {
    icon: '🎤',
    label: 'Recording',
    className: 'status-indicator--recording'
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  className = '',
  children
}) => {
  const config = statusConfig[status];
  const allClasses = ['status-indicator', config.className, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={allClasses}>
      <span className="status-indicator__icon">{config.icon}</span>
      <span className="status-indicator__label">
        {message || config.label}
      </span>
      {children && (
        <span className="status-indicator__children">{children}</span>
      )}
    </div>
  );
};