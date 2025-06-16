/**
 * Reusable image upload component with preview and validation
 */

import React, { useRef, useState } from 'react';
import { Button } from '../Button';
import type { BaseComponentProps } from '../../../types';
import './ImageUpload.css';

interface ImageUploadProps extends BaseComponentProps {
  onImageUpload: (imageData: string, fileName: string) => void;
  onImageClear?: () => void;
  acceptedFormats?: string[];
  maxFileSizeMB?: number;
  currentImage?: string | null;
  disabled?: boolean;
  label?: string;
  showPreview?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageClear,
  acceptedFormats = ['image/*'],
  maxFileSizeMB = 10,
  currentImage = null,
  disabled = false,
  label = 'Choose Image',
  showPreview = true,
  className = '',
  children
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      return `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size of ${maxFileSizeMB}MB`;
    }

    // Check file type
    const isValidType = acceptedFormats.some(format => {
      if (format === 'image/*') {
        return file.type.startsWith('image/');
      }
      return file.type === format;
    });

    if (!isValidType) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    return null;
  };

  const handleFileUpload = (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      onImageUpload(imageData, file.name);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const clearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
    onImageClear?.();
  };

  const allClasses = ['image-upload', className, dragActive && 'image-upload--drag-active']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={allClasses}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleInputChange}
        className="image-upload__input"
        disabled={disabled}
      />

      <div
        className="image-upload__dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {currentImage && showPreview ? (
          <div className="image-upload__preview">
            <img
              src={currentImage}
              alt="Uploaded image"
              className="image-upload__image"
            />
            <div className="image-upload__overlay">
              <Button
                variant="secondary"
                size="small"
                onClick={() => clearImage()}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="image-upload__placeholder">
            <span className="image-upload__icon">📸</span>
            <span className="image-upload__text">
              {dragActive ? 'Drop image here' : label}
            </span>
            <span className="image-upload__hint">
              Drag & drop or click to select
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="image-upload__error">
          ❌ {error}
        </div>
      )}

      {children}
    </div>
  );
};