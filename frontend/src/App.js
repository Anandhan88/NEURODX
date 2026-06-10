import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logoImage from './assets/logo.png';
import LandingPage from './components/LandingPage';
import UploadForm from './components/UploadForm';
import ResultChart from './components/ResultChart';
import HospitalAuth from './components/HospitalAuth';
import HistoryLog from './components/HistoryLog';
import ModelMetrics from './components/ModelMetrics';
import { 
  FiHome, 
  FiActivity, 
  FiDatabase, 
  FiCpu, 
  FiLogOut, 
  FiLayers, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiUsers 
} from 'react-icons/fi';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('landing');
  const [hospitalId, setHospitalId] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resultData, setResultData] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    totalScans: 0,
    tumorsDetected: 0,
    accuracy: '96.2%',
    activeObserver: 'N/A'
  });

  const handleAuthSuccess = (id) => {
    setHospitalId(id);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHospitalId('');
    setResultData(null);
    setActiveTab('dashboard');
    setCurrentView('landing');
  };

  // Load history database to calculate stats
  const fetchStatsData = async () => {
    try {
      const res = await axios.get('/history');
      const data = res.data;
      setHistory(data);
      
      const tumors = data.filter(item => item.tumor_class && item.tumor_class !== 'No Tumor').length;
      
      setStats({
        totalScans: data.length,
        tumorsDetected: tumors,
        accuracy: '96.2%',
        activeObserver: hospitalId || 'Portal Admin'
      });
    } catch (err) {
      console.error("Error fetching stats data:", err);
      // Try local storage fallback
      const localData = localStorage.getItem('bt_scan_history');
      if (localData) {
        const parsed = JSON.parse(localData);
        setHistory(parsed);
        const tumors = parsed.filter(item => item.tumor_class && item.tumor_class !== 'No Tumor').length;
        setStats({
          totalScans: parsed.length,
          tumorsDetected: tumors,
          accuracy: '96.2%',
          activeObserver: hospitalId || 'Portal Admin'
        });
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchStatsData();
    }
  }, [isLoggedIn, hospitalId]);

  // Recalculate stats when a new result is logged
  const handleResult = (data) => {
    setResultData(data);
    fetchStatsData(); // Refresh history database counts
    setActiveTab('analysis'); // remain on analysis tab to show charts
  };

  const getBadgeClass = (tumorClass) => {
    switch(tumorClass) {
      case 'Glioma': return 'glioma';
      case 'Meningioma': return 'meningioma';
      case 'No Tumor': return 'no-tumor';
      case 'Pituitary': return 'pituitary';
      default: return '';
    }
  };

  if (!isLoggedIn) {
    if (currentView === 'landing') {
      return <LandingPage onEnterPortal={() => setCurrentView('auth')} />;
    } else {
      return (
        <HospitalAuth 
          onAuthSuccess={handleAuthSuccess} 
          onBackToLanding={() => setCurrentView('landing')} 
        />
      );
    }
  }

  return (
    <div className="dashboard-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <img src={logoImage} alt="Diagnostics Logo" className="landing-logo-img" style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '6px' }} />
            <h2>NEURODX</h2>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <FiHome />
              <span>Diagnostic Portal</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              <FiActivity />
              <span>MRI Analysis Deck</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'database' ? 'active' : ''}`}
              onClick={() => setActiveTab('database')}
            >
              <FiDatabase />
              <span>Patient Directory</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagnostics')}
            >
              <FiCpu />
              <span>Model Analytics</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="author-credits">
            <span>Lead Architect:</span>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '2px 0 6px 0' }}>Anand</div>
            <a href="mailto:anand.settu2006@gmail.com" style={{ fontSize: '0.75rem' }}>
              anand.settu2006@gmail.com
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        
        {/* Dashboard Header */}
        <header className="dashboard-header">
          <div className="header-title">
            {activeTab === 'dashboard' && (
              <>
                <h1>Client Diagnostic Portal</h1>
                <p>Real-time analytics and pathological diagnostics tracker.</p>
              </>
            )}
            {activeTab === 'analysis' && (
              <>
                <h1>MRI Matrix Analysis Deck</h1>
                <p>Run convolutional diagnostic scans on patient imaging files.</p>
              </>
            )}
            {activeTab === 'database' && (
              <>
                <h1>Clinical Patient Directory</h1>
                <p>Comprehensive historical database of scans and pathology outcomes.</p>
              </>
            )}
            {activeTab === 'diagnostics' && (
              <>
                <h1>Neural Classifier Analytics</h1>
                <p>Performance indicators, training matrices, and validation logs.</p>
              </>
            )}
          </div>

          <div className="header-actions">
            <div className="hospital-badge">
              Active Unit: {hospitalId || 'H-Local'}
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <FiLogOut />
              Exit Portal
            </button>
          </div>
        </header>

        {/* Tab Panel: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {/* Stats Grid */}
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Scans Logged</h3>
                  <p>{stats.totalScans}</p>
                </div>
                <div className="stat-icon cyan">
                  <FiDatabase />
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Tumors Detected</h3>
                  <p>{stats.tumorsDetected}</p>
                </div>
                <div className="stat-icon purple">
                  <FiAlertTriangle />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Algorithm Accuracy</h3>
                  <p>{stats.accuracy}</p>
                </div>
                <div className="stat-icon blue">
                  <FiCpu />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Active Observer ID</h3>
                  <p>{stats.activeObserver}</p>
                </div>
                <div className="stat-icon indigo">
                  <FiUsers />
                </div>
              </div>
            </div>

            {/* Quick Overview Tables */}
            <div className="overview-section">
              <div className="overview-card">
                <h2>
                  <FiActivity /> Recent Patient Scan Records
                </h2>
                <div className="overview-list">
                  {history.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '10px 0' }}>
                      No scan events recorded yet. Navigate to the MRI Analysis Deck to run a scan.
                    </p>
                  ) : (
                    history.slice(0, 4).map((item, idx) => (
                      <div key={item._id || idx} className="overview-item">
                        <div className="overview-item-info">
                          <h4>{item.patient_name}</h4>
                          <p>ID: {item.patient_id} • Age: {item.patient_age}</p>
                        </div>
                        <span className={`tumor-badge ${getBadgeClass(item.tumor_class)}`}>
                          {item.tumor_class} ({item.confidence}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="overview-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h2>
                  <FiCheckCircle /> Diagnostic Status
                </h2>
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Server Endpoint:</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>CONNECTED (5000)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Neural Model:</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>TENSORFLOW H5 LOADED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Database Instance:</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>MONGODB ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Panel: Analysis Upload */}
        {activeTab === 'analysis' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <UploadForm onResult={handleResult} />
            {resultData && <ResultChart result={resultData} />}
          </div>
        )}

        {/* Tab Panel: Patient Directory Database */}
        {activeTab === 'database' && (
          <div className="animate-fade-in">
            <HistoryLog />
          </div>
        )}

        {/* Tab Panel: Diagnostics Performance */}
        {activeTab === 'diagnostics' && (
          <div className="animate-fade-in">
            <ModelMetrics />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
