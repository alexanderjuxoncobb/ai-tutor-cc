/**
 * Reusable Button component with consistent styling and behavior
 */

import React from 'react';
import type { ButtonProps } from '../../../types';
import './Button.css';

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'button';
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  const stateClasses = [
    disabled && 'button--disabled',
    loading && 'button--loading'
  ].filter(Boolean).join(' ');

  const allClasses = [baseClasses, variantClass, sizeClass, stateClasses, className]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className="button__spinner">🔄</span>}
      <span className="button__content">{children}</span>
    </button>
  );
};