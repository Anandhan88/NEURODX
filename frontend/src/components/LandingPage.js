import React from 'react';
import { FiActivity, FiCpu, FiFileText, FiArrowRight } from 'react-icons/fi';
import logoImage from '../assets/logo.png';
import bgImage from '../assets/medical_bg.png';
import './LandingPage.css';

const LandingPage = ({ onEnterPortal }) => {
  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="landing-wrapper"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="landing-overlay" />

      {/* Persistent Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src={logoImage} alt="NeuroDiagnostics Logo" className="landing-logo-img" />
          <span>NEURODX</span>
        </div>
        <button className="landing-nav-btn" onClick={onEnterPortal}>
          Access Portal
        </button>
      </header>

      {/* SECTION 1: HERO FOLD (NO BOX) */}
      <main className="landing-hero-fold">
        <h1>FUZZY DEEP LEARNING NEURO-ONCOLOGY PORTAL</h1>
        
        <p className="subtitle">
          Next-generation clinical decision-support space for medical professionals. Run automated brain MRI analysis with high-accuracy classification and 3D spatial visualization.
        </p>

        <div style={{ marginTop: '0.5rem' }}>
          <button className="cta-btn" onClick={onEnterPortal}>
            Enter Clinical Portal
            <FiArrowRight />
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator" onClick={scrollToFeatures}>
          <span>Scroll down to explore features</span>
          <div style={{ fontSize: '1.2rem', marginTop: '4px' }}>↓</div>
        </div>
      </main>

      {/* SECTION 2: CAPABILITIES GALLERY (FOLD 2) */}
      <section className="landing-section section-dark" id="features-section">
        <div className="section-header-centered">
          <h2>Platform Capabilities</h2>
          <p>Explore the clinical-grade AI analysis, visualization, and documentation tools built directly into the NeuroDiagnostics portal.</p>
        </div>

        <div className="features-grid-vertical">
          <div className="feature-large-card">
            <div className="feature-large-icon">
              <FiCpu />
            </div>
            <h3>Advanced CNN Classifier</h3>
            <p>Runs convolutional diagnostic filters to evaluate T1-contrast brain scan images. Our neural model identifies structural borders to classify tumors.</p>
            <ul className="feature-bullet-list">
              <li>96.2% validation accuracy on clinical test sets</li>
              <li>Detects Glioma, Meningioma, and Pituitary adenomas</li>
              <li>Establishes reliable normal findings (No Tumor detected)</li>
              <li>Real-time forwarding latency (under 2 seconds)</li>
            </ul>
          </div>

          <div className="feature-large-card">
            <div className="feature-large-icon">
              <FiActivity />
            </div>
            <h3>3D Spatial Scan Projection</h3>
            <p>Translates class diagnostics into anatomical mapping visuals. An interactive Three.js neural mesh brain model helps pinpoint structural lesions.</p>
            <ul className="feature-bullet-list">
              <li>Interactive 3D model rotation and zoom</li>
              <li>Color-coded tumor region highlighting</li>
              <li>Pulsating lesion coordinate mapping indicators</li>
              <li>WebGL accelerated hardware rendering</li>
            </ul>
          </div>

          <div className="feature-large-card">
            <div className="feature-large-icon">
              <FiFileText />
            </div>
            <h3>Clinical PDF Reports</h3>
            <p>Generates print-ready diagnostic documentation. Integrates visual probability charts, classification percentages, patient files, and observer notes.</p>
            <ul className="feature-bullet-list">
              <li>Basic clinical report layout template</li>
              <li>Detailed report including diagnostic recharts graphs</li>
              <li>Custom patient metadata and doctor observations</li>
              <li>Sign-off margins for clinician validation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3: SYSTEM WORKFLOW (FOLD 3) */}
      <section className="landing-section section-darker">
        <div className="section-header-centered">
          <h2>Clinical Workflow Process</h2>
          <p>A seamless, three-step workflow designed to save oncologists time and structure patient diagnostic logs.</p>
        </div>

        <div className="steps-timeline">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Patient Parameter Logging</h3>
            <p>Enter patient name, age, medical record ID, and clinical observations. This ensures all historical database logs and exported PDF files link correctly to the patient file.</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Automated CNN Diagnostics</h3>
            <p>Upload a high-resolution brain MRI scan image. The system resizes the matrix to 150x150 pixels and runs automated forward propagation calculations in the TensorFlow backend.</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Analysis Review & Export</h3>
            <p>Examine the diagnostic probability charts and rotating 3D lesion mapping projections. Add diagnosis summary logs, download clinical PDF reports, and retrieve records in the Patient Directory.</p>
          </div>
        </div>

        <div className="landing-cta-banner">
          <h3>Ready to access the diagnostic space?</h3>
          <button className="cta-btn" onClick={onEnterPortal}>
            Access Clinical Portal
            <FiArrowRight />
          </button>
        </div>
      </section>

      {/* Persistent Footer */}
      <footer className="landing-footer">
        Designed & Developed by Anand (anand.settu2006@gmail.com) • NEURODIAGNOSTICS Clinical Engine
      </footer>
    </div>
  );
};

export default LandingPage;
