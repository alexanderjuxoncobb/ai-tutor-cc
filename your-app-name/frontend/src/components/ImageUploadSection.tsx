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
    <section className="upload-section">
      <h2>📸 Upload Math Problem</h2>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        style={{ display: "none" }}
      />
      <button
        onClick={onChooseImageClick}
        className="upload-btn"
      >
        Choose Image
      </button>

      {uploadedImage && (
        <div className="uploaded-image">
          <img
            src={uploadedImage}
            alt="Math problem"
            style={{ maxWidth: "300px", maxHeight: "200px" }}
          />
        </div>
      )}

      {mathProblemAnalysis && (
        <div className="math-analysis-section" style={{ 
          margin: "15px 0",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#495057" }}>📊 AI Analysis</h3>
          <p style={{ 
            margin: "0",
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#6c757d"
          }}>
            {mathProblemAnalysis}
          </p>
        </div>
      )}
    </section>
  );
}