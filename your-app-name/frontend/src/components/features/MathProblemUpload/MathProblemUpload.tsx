/**
 * Math problem upload component with analysis display
 */

import React from 'react';
import { ImageUpload } from '../../ui';
import type { BaseComponentProps } from '../../../types';
import './MathProblemUpload.css';

interface MathProblemUploadProps extends BaseComponentProps {
  uploadedImage: string | null;
  mathProblemAnalysis: string | null;
  onImageUpload: (imageData: string, fileName: string) => void;
  onImageClear: () => void;
  onAnalyze?: (imageData: string) => void;
  isAnalyzing?: boolean;
  disabled?: boolean;
}

export const MathProblemUpload: React.FC<MathProblemUploadProps> = ({
  uploadedImage,
  mathProblemAnalysis,
  onImageUpload,
  onImageClear,
  onAnalyze,
  isAnalyzing = false,
  disabled = false,
  className = '',
  children
}) => {
  const handleImageUpload = (imageData: string, fileName: string) => {
    onImageUpload(imageData, fileName);
    
    // Automatically analyze if handler is provided
    if (onAnalyze) {
      onAnalyze(imageData);
    }
  };

  const allClasses = ['math-problem-upload', className].filter(Boolean).join(' ');

  return (
    <section className={allClasses}>
      <h2 className="math-problem-upload__title">📸 Upload Math Problem</h2>
      
      <div className="math-problem-upload__content">
        <ImageUpload
          onImageUpload={handleImageUpload}
          onImageClear={onImageClear}
          currentImage={uploadedImage}
          disabled={disabled}
          label="Choose Math Problem Image"
          acceptedFormats={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
          maxFileSizeMB={20}
          className="math-problem-upload__uploader"
        />

        {isAnalyzing && (
          <div className="math-problem-upload__analyzing">
            <span className="math-problem-upload__spinner">🔄</span>
            <span>Analyzing math problem...</span>
          </div>
        )}

        {mathProblemAnalysis && (
          <div className="math-problem-upload__analysis">
            <h3 className="math-problem-upload__analysis-title">
              📊 AI Analysis
            </h3>
            <div className="math-problem-upload__analysis-content">
              {mathProblemAnalysis.split('\n').map((line, index) => (
                <p key={index} className="math-problem-upload__analysis-line">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {children}
      </div>
    </section>
  );
};