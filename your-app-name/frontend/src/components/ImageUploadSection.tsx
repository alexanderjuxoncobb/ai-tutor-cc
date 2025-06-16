import React from 'react';

interface ImageUploadSectionProps {
  uploadedImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChooseImageClick: () => void;
  mathProblemAnalysis?: string | null;
}

export default function ImageUploadSection({ 
  uploadedImage, 
  fileInputRef, 
  onImageUpload, 
  onChooseImageClick,
  mathProblemAnalysis 
}: ImageUploadSectionProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          Math Problem
        </h2>
      </div>
      
      <div className="card-content">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="sr-only"
          id="math-problem-upload"
        />
        
        {!uploadedImage ? (
          <div 
            className="image-upload-area"
            onClick={onChooseImageClick}
          >
            <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }}>
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <h3 className="mb-2" style={{ color: 'var(--gray-700)' }}>Upload Math Problem</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--gray-500)' }}>
              Click to choose an image file or drag and drop
            </p>
            <button
              type="button"
              className="btn btn-primary"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Choose File
            </button>
            <p className="text-xs mt-2" style={{ color: 'var(--gray-400)' }}>
              Supports JPG, PNG, GIF up to 10MB
            </p>
          </div>
        ) : (
          <div className="image-upload-area has-image">
            <img
              src={uploadedImage}
              alt="Math problem"
              className="image-preview mb-4"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success-600)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Image uploaded successfully
              </div>
              <button
                onClick={onChooseImageClick}
                className="btn btn-outline"
                style={{ padding: 'var(--space-2) var(--space-3)' }}
              >
                Change
              </button>
            </div>
          </div>
        )}

        {mathProblemAnalysis && (
          <div className="status-message info mt-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-semibold mb-1">AI Analysis Complete</div>
              <div className="text-sm opacity-90">
                {mathProblemAnalysis}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}