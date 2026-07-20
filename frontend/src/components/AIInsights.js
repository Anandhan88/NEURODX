import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Activity, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import './AIInsights.css';

const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }
  })
};

const AIInsights = () => {
  return (
    <div className="ndx-insights-container animate-fade-in">
      
      {/* Overview Intro card */}
      <motion.div 
        className="card ndx-insight-hero"
        variants={cardVariants}
        custom={0}
        initial="initial"
        animate="animate"
      >
        <div className="ndx-hero-icon-badge">
          <Brain size={24} />
        </div>
        <div className="ndx-hero-text">
          <h2>Clinical AI Explanations & Model Insights</h2>
          <p>
            NeuroDX AI utilizes deep convolutional networks trained on high-contrast MRI scans to classify tumor signatures. 
            Understanding the underlying model weights and spatial classification criteria aids clinical accuracy.
          </p>
        </div>
      </motion.div>

      {/* Grid of Explanation Cards */}
      <div className="ndx-insights-grid">
        
        {/* CNN Feature Extraction */}
        <motion.div 
          className="card" 
          variants={cardVariants} 
          custom={1}
          initial="initial"
          animate="animate"
        >
          <div className="ndx-card-title-row">
            <Sparkles size={16} className="insight-blue" />
            <h3>Feature Extraction Process</h3>
          </div>
          <p className="ndx-insight-p">
            The neural network process starts by scaling the 3-channel input matrix to 150×150 pixels. 
            Convolutional kernels process these dimensions to detect edges, tissue density changes, and contrast anomalies.
          </p>
          <ul className="ndx-insight-list">
            <li><CheckCircle2 size={13} /> Pooling layers reduce spatial dimensions</li>
            <li><CheckCircle2 size={13} /> Dropout regularization prevents over-fitting</li>
            <li><CheckCircle2 size={13} /> Activation maps spotlight lesion boundaries</li>
          </ul>
        </motion.div>

        {/* Tumor Pathology Guide */}
        <motion.div 
          className="card" 
          variants={cardVariants} 
          custom={2}
          initial="initial"
          animate="animate"
        >
          <div className="ndx-card-title-row">
            <Activity size={16} className="insight-green" />
            <h3>Pathology Classification Logic</h3>
          </div>
          <p className="ndx-insight-p">
            The network classifies scans into one of four distinct outcome classes with individual probability arrays:
          </p>
          <div className="ndx-pathology-item">
            <strong>Glioma:</strong> Originates in glial cells. Often shows irregular boundaries and surround edema.
          </div>
          <div className="ndx-pathology-item">
            <strong>Meningioma:</strong> Arises from outer protective membranes. Generates visible mass effects.
          </div>
          <div className="ndx-pathology-item">
            <strong>Pituitary:</strong> Develops near optic nerve junctions. Key factor in baseline hormonal screens.
          </div>
        </motion.div>

        {/* Clinical Safe Harbor Disclaimer */}
        <motion.div 
          className="card ndx-full-row-card" 
          variants={cardVariants} 
          custom={3}
          initial="initial"
          animate="animate"
        >
          <div className="ndx-card-title-row">
            <ShieldAlert size={16} className="insight-warning" />
            <h3>Quality Assurance & Clinical Guidelines</h3>
          </div>
          <p className="ndx-insight-p">
            All AI-assisted outputs are designed solely to support radiological review workflow. 
            Automated classifications do not replace primary patient physical evaluation or surgical tissue biopsies.
          </p>
          <div className="ndx-trust-bullets">
            <div className="ndx-trust-bullet">
              <FileText size={16} />
              <div>
                <strong>Archived Scan Logs</strong>
                <span>Every inference run is locked with patient MRN timestamps in our clinical database for tracking verification.</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AIInsights;
