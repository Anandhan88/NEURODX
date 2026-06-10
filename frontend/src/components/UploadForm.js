import React, { useState } from 'react';
import axios from 'axios';
import { FiUpload, FiUser, FiFileText, FiActivity, FiCheckCircle, FiAlertCircle, FiImage } from 'react-icons/fi';
import ThreeBrain from './ThreeBrain';
import './UploadForm.css';

function UploadForm({ onResult }) {
  // Patient Details State
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  // Upload State
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const logScanToDatabase = async (predictionClass, confidenceScore) => {
    try {
      const record = {
        patient_name: patientName || "Anonymous Patient",
        patient_id: patientId || `P-${Math.floor(10000 + Math.random() * 90000)}`,
        patient_age: patientAge || "N/A",
        doctor_notes: doctorNotes || "",
        tumor_class: predictionClass,
        confidence: confidenceScore,
      };
      await axios.post('/history', record);
    } catch (err) {
      console.error("Failed to save scan record to database:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload an MRI imaging scan to run the diagnosis.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/predict', formData);
      setResult(response.data);
      
      // Save result in MongoDB history database
      await logScanToDatabase(response.data.class, response.data.confidence);
      
      // Trigger parent callback
      onResult(response.data);
    } catch (err) {
      console.error('Scan prediction error:', err);
      setError(err.response?.data?.error || "Analysis failed. Please verify the image file and check server logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setPatientName('');
    setPatientId('');
    setPatientAge('');
    setDoctorNotes('');
    setError(null);
  };

  return (
    <div className="upload-deck animate-fade-in">
      
      {/* Left Column: Form & Drag-Drop */}
      <form onSubmit={handleUpload} className="upload-card">
        <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiUser style={{ color: 'var(--accent-cyan)' }} />
          Patient & Scan Parameters
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="patientName">Patient Full Name</label>
            <input
              type="text"
              id="patientName"
              placeholder="e.g. John Doe"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="patientId">Medical Record ID</label>
            <input
              type="text"
              id="patientId"
              placeholder="e.g. MR-90823"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="patientAge">Patient Age</label>
            <input
              type="number"
              id="patientAge"
              placeholder="e.g. 45"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="mriType">Imaging Type</label>
            <input
              type="text"
              id="mriType"
              value="MRI - T1 weighted contrast"
              disabled
              style={{ background: 'rgba(255, 255, 255, 0.01)', color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="doctorNotes">Diagnosis Observations / Notes</label>
          <textarea
            id="doctorNotes"
            rows="3"
            placeholder="Enter custom observation notes here (will be printed on the clinical PDF report)..."
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        <div className="form-group">
          <label>Brain MRI Imaging File</label>
          <div 
            className="drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <FiUpload className="upload-icon" />
            <input
              type="file"
              id="file-input"
              className="file-input"
              onChange={handleFileChange}
              accept="image/*"
            />
            <label htmlFor="file-input" className="file-label">
              Choose MRI Scan
            </label>
            <p className="drop-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              or drag and drop your imaging file here
            </p>
          </div>
        </div>

        {file && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-color)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>{file.name}</span>
            <button 
              type="button" 
              onClick={() => { setFile(null); setPreview(null); }}
              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
            >
              Remove
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            className="action-btn"
            disabled={loading || !file}
          >
            {loading ? 'Analyzing Scan Matrix...' : 'Initiate AI Diagnosis'}
          </button>
          {result && (
            <button 
              type="button" 
              onClick={resetForm}
              className="gradient-border-btn"
              style={{
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '0.9rem'
              }}
            >
              Reset Form
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-box">
            <FiActivity className="spin-icon" style={{ animation: 'spin 1.5s linear infinite' }} />
            <span>Running neural matrix calculations... This will take a few seconds.</span>
          </div>
        )}

        {error && (
          <div className="error-box">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="result-card">
            <h3>
              <FiCheckCircle />
              Diagnosis Outcome Complete
            </h3>
            <div className="result-row">
              <strong>Clinical Outcome:</strong>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{result.class}</span>
            </div>
            <div className="result-row">
              <strong>Model Confidence Rating:</strong>
              <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{result.confidence}%</span>
            </div>
            <div className="clinical-disclaimer">
              <strong>Clinical Notice:</strong> This computed output is for clinical research validation.
              Final medical decision mapping must be conducted by certified neuro-oncologists.
            </div>
          </div>
        )}
      </form>

      {/* Right Column: 3D Visualization / Preview Deck */}
      <div className="preview-deck">
        {preview ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <FiImage style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              MRI Scan Preview & 3D Projection
            </h4>
            <img src={preview} alt="MRI Preview" className="mri-preview-img" />
            
            {/* Show interactive 3D model reflecting the current classification */}
            <div style={{ width: '100%', height: '300px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
              <ThreeBrain tumorClass={result ? result.class : 'No Tumor'} />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '100%', height: '320px' }}>
              <ThreeBrain tumorClass="No Tumor" />
            </div>
            <h4 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Patient Scans Diagnostic Space</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
              Upload a brain MRI scan and enter the clinical details to view the 3D lesion mapping projections.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default UploadForm;
