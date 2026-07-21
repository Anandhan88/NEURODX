import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Cpu, Activity, FileText, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import BrainLogo from './BrainLogo';
import './LandingPage.css';

const rotatingPhrases = [
  'Detecting Glioma Tumors',
  'Classifying Meningioma Cases',
  'Analyzing MRI Scan Slices',
  'Mapping Pituitary Adenomas',
  'Supporting Clinical Decisions',
  '96.2% Diagnostic Accuracy',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const LandingPage = ({ onEnterPortal }) => {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('inference');

  useEffect(() => {
    const phrase = rotatingPhrases[currentPhrase];
    let timeout;

    if (!isDeleting) {
      if (displayText.length < phrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(phrase.slice(0, displayText.length + 1));
        }, 50);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 25);
      } else {
        setIsDeleting(false);
        setCurrentPhrase((prev) => (prev + 1) % rotatingPhrases.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentPhrase]);

  return (
    <div className="landing-wrapper">
      {/* Grid Pattern Overlay */}
      <div className="landing-grid-overlay" />

      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo-container">
          <BrainLogo size={38} showText={true} />
        </div>
        <motion.button 
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          onClick={onEnterPortal}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Access Portal
          <ArrowRight size={16} />
        </motion.button>
      </header>

      {/* PAGE 1: HERO SECTION */}
      <main className="landing-page-flow landing-hero">
        <motion.div 
          className="landing-hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="landing-badge" variants={itemVariants}>
            <span className="status-dot online" />
            <span>Enterprise Clinical Decision Support</span>
          </motion.div>

          <motion.h1 className="landing-title" variants={itemVariants}>
            Next-Generation AI <br />
            <span className="gradient-text">Neuro-Oncology Portal</span>
          </motion.h1>

          <motion.div className="landing-typewriter" variants={itemVariants}>
            <span className="typewriter-prefix">AI Engine:</span>
            <span className="typewriter-text">{displayText}</span>
            <span className="typewriter-cursor">|</span>
          </motion.div>

          <motion.p className="landing-subtitle" variants={itemVariants}>
            A secure, clinical-grade platform designed for radiologists and neurologists. 
            Accelerate MRI scan analysis with high-precision deep learning classification 
            and real-time 3D lesion mapping.
          </motion.p>

          <motion.div className="landing-actions" variants={itemVariants}>
            <button className="btn btn-primary btn-lg" onClick={onEnterPortal}>
              Enter Diagnostics Portal
              <ArrowRight size={18} />
            </button>
            <a href="#interactive-demo" className="btn btn-secondary btn-lg">
              Live Demo Preview
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* INTERACTIVE DEMO PREVIEW SECTION */}
      <section id="interactive-demo" className="landing-page-flow landing-interactive-preview">
        <div className="section-header">
          <span className="section-pre">Interactive Explorer</span>
          <h2>Experience the Portal In Action</h2>
          <p>Click the features below to preview the NeuroDX AI clinical workspace.</p>
        </div>

        <div className="interactive-tabs-container">
          <div className="interactive-tab-buttons">
            <button 
              className={`tab-btn ${activePreviewTab === 'inference' ? 'active' : ''}`}
              onClick={() => setActivePreviewTab('inference')}
            >
              <Cpu size={16} />
              <span>1. CNN Inference Classifier</span>
            </button>
            <button 
              className={`tab-btn ${activePreviewTab === '3d' ? 'active' : ''}`}
              onClick={() => setActivePreviewTab('3d')}
            >
              <Activity size={16} />
              <span>2. 3D Spatial Projection</span>
            </button>
            <button 
              className={`tab-btn ${activePreviewTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setActivePreviewTab('pdf')}
            >
              <FileText size={16} />
              <span>3. Standardized PDF Reports</span>
            </button>
          </div>

          <div className="interactive-tab-content card">
            <AnimatePresence mode="wait">
              {activePreviewTab === 'inference' && (
                <motion.div 
                  key="inference"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="tab-panel-inner"
                >
                  <div className="panel-visual">
                    <div className="mock-scanner-ui">
                      <div className="mock-scanner-mri-circle">
                        <div className="mri-scan-line-anim" />
                        <BrainLogo size={80} />
                      </div>
                      <div className="mock-scanner-bars">
                        <div className="mock-bar-row"><span>Glioma</span><div className="bar-track"><div className="bar-fill" style={{ width: '84%', background: 'var(--primary)' }} /></div><span>84.2%</span></div>
                        <div className="mock-bar-row"><span>Meningioma</span><div className="bar-track"><div className="bar-fill" style={{ width: '8%', background: 'var(--secondary)' }} /></div><span>8.1%</span></div>
                        <div className="mock-bar-row"><span>Pituitary</span><div className="bar-track"><div className="bar-fill" style={{ width: '5%', background: 'var(--accent)' }} /></div><span>5.4%</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="panel-desc">
                    <h3>Real-Time CNN Inference</h3>
                    <p>Upload a standard T1-weighted contrast MRI image. The classifier automatically resizes the grid and runs feed-forward calculations to render categorical confidence scores in under 2 seconds.</p>
                    <ul className="capability-list">
                      <li><CheckCircle2 size={16} /> Multi-class diagnostics validation</li>
                      <li><CheckCircle2 size={16} /> High accuracy performance profiles</li>
                      <li><CheckCircle2 size={16} /> Verified Normal margins (No Tumor)</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === '3d' && (
                <motion.div 
                  key="3d"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="tab-panel-inner"
                >
                  <div className="panel-visual">
                    <div className="mock-three-viewport">
                      <div className="mesh-brain-cube">
                        <BrainLogo size={90} className="glow-spinning" />
                      </div>
                      <span className="coordinate-indicator"> Lesion coordinates mapped: X: 45.2, Y: 89.1, Z: -12.4</span>
                    </div>
                  </div>
                  <div className="panel-desc">
                    <h3>Spatial lesion coordinates projection</h3>
                    <p>WebGL-accelerated spatial indicators map classification output onto a rotating 3D neural mesh structure. Zoom, rotate, and measure coordinate borders dynamically.</p>
                    <ul className="capability-list">
                      <li><CheckCircle2 size={16} /> WebGL hardware acceleration</li>
                      <li><CheckCircle2 size={16} /> Highlighted tumor class positioning</li>
                      <li><CheckCircle2 size={16} /> Dynamic zoom & orientation controls</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === 'pdf' && (
                <motion.div 
                  key="pdf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="tab-panel-inner"
                >
                  <div className="panel-visual">
                    <div className="mock-pdf-layout">
                      <div className="pdf-header-stripe" />
                      <div className="pdf-body-mock">
                        <div className="pdf-title-line" />
                        <div className="pdf-grid-row"><div className="grid-cell" /><div className="grid-cell" /></div>
                        <div className="pdf-text-paragraph" />
                        <div className="pdf-signature-line" />
                      </div>
                    </div>
                  </div>
                  <div className="panel-desc">
                    <h3>Clinical report outputs</h3>
                    <p>Build, review, and print standardized diagnostic PDF documents incorporating patient record metrics, confidence parameters, and custom physician remarks.</p>
                    <ul className="capability-list">
                      <li><CheckCircle2 size={16} /> Click-and-export clinical files</li>
                      <li><CheckCircle2 size={16} /> Visual probability chart inclusions</li>
                      <li><CheckCircle2 size={16} /> Sign-off fields for clinical auditing</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* PAGE 2: CAPABILITIES SECTION */}
      <section id="capabilities" className="landing-page-flow landing-capabilities">
        <div className="section-header">
          <span className="section-pre">Diagnostic Framework</span>
          <h2>Platform Capabilities</h2>
          <p>Clinical-grade intelligence, visualization, and documentation built for modern healthcare settings.</p>
        </div>

        <div className="capabilities-grid">
          <div className="capability-card-flat">
            <div className="capability-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Cpu size={28} />
            </div>
            <h3>Advanced CNN Classifier</h3>
            <p>Runs convolutional neural networks to evaluate T1-contrast brain scan images with optimized inference latency.</p>
          </div>

          <div className="capability-card-flat">
            <div className="capability-icon" style={{ background: 'rgba(0, 195, 137, 0.1)', color: 'var(--secondary)' }}>
              <Activity size={28} />
            </div>
            <h3>3D Spatial Scan Projection</h3>
            <p>Translates flat scan slice coordinates into anatomical spatial representations using hardware-accelerated WebGL.</p>
          </div>

          <div className="capability-card-flat">
            <div className="capability-icon" style={{ background: 'rgba(0, 184, 217, 0.1)', color: 'var(--accent)' }}>
              <FileText size={28} />
            </div>
            <h3>Clinical PDF Reports</h3>
            <p>Generates standardized, exportable clinical records including metadata, visual distribution charts, and observer logs.</p>
          </div>
        </div>
      </section>

      {/* PAGE 3: CLINICAL WORKFLOW TIMELINE */}
      <section className="landing-page-flow landing-workflow">
        <div className="section-header">
          <span className="section-pre">Operation Protocol</span>
          <h2>Clinical Workflow Process</h2>
          <p>A seamless, three-step integration designed to save clinician time and structure patient logs.</p>
        </div>

        <div className="timeline-grid">
          <div className="timeline-step">
            <div className="step-circle">1</div>
            <h3>Patient Parameter Logging</h3>
            <p>Enter patient name, age, medical record ID, and clinical observations. This ensures all history log audits and exported PDF files link correctly.</p>
          </div>

          <div className="timeline-step">
            <div className="step-circle">2</div>
            <h3>Automated CNN Diagnostics</h3>
            <p>Upload a brain MRI scan image. The system resizes the matrix and runs automated forward propagation calculations in the backend.</p>
          </div>

          <div className="timeline-step">
            <div className="step-circle">3</div>
            <h3>Analysis Review & Export</h3>
            <p>Examine the diagnostic probability charts and rotating 3D lesion mapping projections. Add doctor notes and download clinical PDF reports.</p>
          </div>
        </div>
      </section>

      {/* PAGE 4: TRUST & QUALITY */}
      <section className="landing-page-flow landing-trust">
        <div className="trust-content-flat">
          <div className="section-header">
            <span className="section-pre">Safety & Security</span>
            <h2>Clinical Trust & Security</h2>
            <p>A platform designed with absolute transparency, tracing, and data encryption.</p>
          </div>
          <div className="trust-grid">
            <div className="trust-item-flat">
              <Award size={36} className="trust-icon" />
              <h4>Clinically Calibrated</h4>
              <p>Model evaluated and tuned against standard clinical MRI datasets to ensure high sensitivity and reliability.</p>
            </div>
            <div className="trust-item-flat">
              <ShieldAlert size={36} className="trust-icon" />
              <h4>Secure Audit Logs</h4>
              <p>MongoDB backed history log ensures full trace audits of diagnostic results, clinical observers, and timestamp events.</p>
            </div>
          </div>

          <div className="landing-cta-banner">
            <h3>Ready to access the diagnostic space?</h3>
            <button className="btn btn-primary btn-lg" onClick={onEnterPortal}>
              Access Clinical Portal
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <span>NeuroDX AI Platform © 2026</span>
          <span className="footer-divider">•</span>
          <span>Lead AI Developer: Anand (anand.settu2006@gmail.com)</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
