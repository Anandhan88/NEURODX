import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, User, FileText, Activity, CheckCircle2, 
  AlertCircle, Image, ZoomIn, ZoomOut, RefreshCw, 
  ChevronRight, Sparkles, BrainCircuit, ShieldAlert
} from 'lucide-react';
import ThreeBrain from './ThreeBrain';
import './UploadForm.css';

const loadingSteps = [
  "Loading TensorFlow Model...",
  "Reading MRI Slices...",
  "Normalizing Image...",
  "Extracting Features...",
  "CNN Inference Running...",
  "Generating Heatmap...",
  "Creating Clinical Report...",
  "Prediction Complete"
];

const getBadgeClass = (tumorClass) => {
  switch (tumorClass) {
    case 'Glioma': return 'glioma';
    case 'Meningioma': return 'meningioma';
    case 'No Tumor': return 'no-tumor';
    case 'Pituitary': return 'pituitary';
    default: return '';
  }
};

function UploadForm({ onResult }) {
  // Patient details state
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  // Upload state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Loading steps animation loop
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => {
          if (prev < loadingSteps.length - 2) {
            return prev + 1;
          }
          return prev;
        });
      }, 900);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setZoomLevel(1);
      
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
      
      // Let the steps finish gracefully
      setLoadingStepIndex(loadingSteps.length - 2);
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingStepIndex(loadingSteps.length - 1);
      await new Promise(resolve => setTimeout(resolve, 500));

      setResult(response.data);
      await logScanToDatabase(response.data.class, response.data.confidence);
      
      onResult({
        ...response.data,
        patientName,
        patientId,
        patientAge,
        doctorNotes
      });
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
      setZoomLevel(1);
      
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
    setZoomLevel(1);
  };

  const handleZoom = (direction) => {
    setZoomLevel((prev) => {
      const next = direction === 'in' ? prev + 0.2 : prev - 0.2;
      return Math.min(Math.max(next, 0.8), 2.5);
    });
  };

  return (
    <div className="ndx-upload-grid">
      {/* LEFT COLUMN: Input form & controls */}
      <div className="ndx-upload-left">
        <form onSubmit={handleUpload} className="card ndx-analysis-form" autoComplete="off">
          <div className="ndx-form-header-row">
            <User size={18} className="form-title-icon" />
            <h3>Patient & Scan Parameters</h3>
          </div>

          <div className="ndx-form-row">
            <div className="form-group">
              <label htmlFor="patientName">Patient Full Name</label>
              <input
                type="text"
                id="patientName"
                className="input"
                placeholder="e.g. John Doe"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="patientId">Medical Record ID</label>
              <input
                type="text"
                id="patientId"
                className="input"
                placeholder="e.g. MR-90823"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="ndx-form-row">
            <div className="form-group">
              <label htmlFor="patientAge">Patient Age</label>
              <input
                type="number"
                id="patientAge"
                className="input"
                placeholder="e.g. 45"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="mriType">Imaging Modality</label>
              <input
                type="text"
                id="mriType"
                className="input"
                value="MRI - T1 weighted contrast"
                disabled
                autoComplete="off"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="doctorNotes">Diagnosis Observations / Notes</label>
            <textarea
              id="doctorNotes"
              className="input"
              rows="3"
              placeholder="Enter custom observation notes here (will be included in PDF report)..."
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              style={{ resize: 'none' }}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Brain MRI Imaging File</label>
            <div 
              className={`ndx-dropzone ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="ndx-upload-arrow" size={32} />
              <input
                type="file"
                id="file-input"
                className="file-input"
                onChange={handleFileChange}
                accept="image/*"
                disabled={loading}
              />
              <label htmlFor="file-input" className="btn btn-secondary">
                Choose MRI Scan
              </label>
              <p className="ndx-dropzone-text">
                or drag and drop your imaging file here
              </p>
            </div>
          </div>

          {file && (
            <div className="ndx-file-info">
              <div className="ndx-file-meta">
                <Image size={16} />
                <span>{file.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => { setFile(null); setPreview(null); }}
                className="ndx-remove-file"
                disabled={loading}
              >
                Remove
              </button>
            </div>
          )}

          <div className="ndx-form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !file}
              style={{ flex: 1 }}
            >
              {loading ? (
                <>
                  <RefreshCw className="spin-icon" size={16} />
                  <span>Analyzing Matrix...</span>
                </>
              ) : (
                <>
                  <Activity size={16} />
                  <span>Initiate AI Diagnosis</span>
                </>
              )}
            </button>
            {result && (
              <button 
                type="button" 
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Reset
              </button>
            )}
          </div>

          {/* Loading steps progress bar */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                className="ndx-loading-container"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="ndx-loading-header">
                  <BrainCircuit size={16} className="spin-icon" />
                  <span>{loadingSteps[loadingStepIndex]}</span>
                </div>
                <div className="ndx-progress-track">
                  <motion.div 
                    className="ndx-progress-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((loadingStepIndex + 1) / loadingSteps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="ndx-error-box">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      {/* RIGHT COLUMN: Large viewer & 3D projection */}
      <div className="ndx-upload-right">
        <div className="card ndx-viewer-card">
          <div className="ndx-viewer-header">
            <h3><Image size={16} /> MRI Medical Image Viewer</h3>
            {preview && (
              <div className="ndx-viewer-controls">
                <button type="button" onClick={() => handleZoom('out')} className="ndx-ctrl-btn" title="Zoom Out"><ZoomOut size={16} /></button>
                <span className="ndx-zoom-pct">{Math.round(zoomLevel * 100)}%</span>
                <button type="button" onClick={() => handleZoom('in')} className="ndx-ctrl-btn" title="Zoom In"><ZoomIn size={16} /></button>
              </div>
            )}
          </div>

          <div className="ndx-viewer-body">
            {preview ? (
              <div className="ndx-split-preview">
                <div className="ndx-image-viewport">
                  <img 
                    src={preview} 
                    alt="MRI Viewport" 
                    className="ndx-mri-view"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                </div>
                <div className="ndx-model-viewport">
                  <ThreeBrain tumorClass={result ? result.class : 'No Tumor'} />
                </div>
              </div>
            ) : (
              <div className="ndx-viewer-empty">
                <BrainCircuit size={48} className="ndx-empty-icon" />
                <h4>No MRI Scan Uploaded</h4>
                <p>Complete the patient form and upload a T1-weighted contrast scan to run spatial maps.</p>
              </div>
            )}
          </div>

          {result && (
            <motion.div 
              className="ndx-result-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="ndx-result-header">
                <div className="ndx-result-meta">
                  <Sparkles size={16} />
                  <span>AI Inference Result</span>
                </div>
                <span className={`tumor-badge ${getBadgeClass(result.class)}`}>
                  {result.class}
                </span>
              </div>
              <div className="ndx-result-stats-row">
                <div><span>Classification</span><strong>{result.class}</strong></div>
                <div><span>Confidence</span><strong>{result.confidence}%</strong></div>
                <div><span>Diagnosis Code</span><strong>DX-908A</strong></div>
              </div>
              <div className="ndx-disclaimer">
                <ShieldAlert size={14} />
                <span>Notice: Automated decision validation. Final signature sign-off required.</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadForm;
