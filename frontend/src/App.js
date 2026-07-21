import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import HospitalAuth from './components/HospitalAuth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UploadForm from './components/UploadForm';
import ResultChart from './components/ResultChart';
import HistoryLog from './components/HistoryLog';
import PatientManagement from './components/PatientManagement';
import ModelMetrics from './components/ModelMetrics';
import AIInsights from './components/AIInsights';
import './App.css';

// Configure API baseURL for Vercel/Render separate deployment
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('landing');
  const [hospitalId, setHospitalId] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

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

  // Load history & MongoDB Atlas dashboard stats
  const fetchStatsData = async () => {
    try {
      const [historyRes, statsRes] = await Promise.allSettled([
        axios.get('/history'),
        axios.get('/dashboard/stats')
      ]);

      const data = historyRes.status === 'fulfilled' ? historyRes.value.data : [];
      setHistory(data);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        const s = statsRes.value.data;
        setStats({
          totalScans: s.totalScans || data.length,
          tumorsDetected: s.tumorsDetected || data.filter(i => i.tumor_class && i.tumor_class !== 'No Tumor').length,
          accuracy: '96.2%',
          activeObserver: hospitalId || 'Portal Admin'
        });
      } else {
        const tumors = data.filter(item => item.tumor_class && item.tumor_class !== 'No Tumor').length;
        setStats({
          totalScans: data.length,
          tumorsDetected: tumors,
          accuracy: '96.2%',
          activeObserver: hospitalId || 'Portal Admin'
        });
      }
    } catch (err) {
      console.error("Error fetching stats data:", err);
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
    fetchStatsData();
    setActiveTab('analysis');
  };

  /* ---- Pre-auth views ---- */
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

  /* ---- Main App (post-auth) ---- */
  return (
    <div className="ndx-app">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
        hospitalId={hospitalId}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main content area */}
      <div className={`ndx-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <Header
          activeTab={activeTab}
          hospitalId={hospitalId}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Page content */}
        <main className="ndx-content">
          <AnimatePresence mode="wait">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" {...pageTransition}>
                <Dashboard stats={stats} history={history} />
              </motion.div>
            )}

            {/* MRI Analysis */}
            {activeTab === 'analysis' && (
              <motion.div key="analysis" {...pageTransition} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <UploadForm onResult={handleResult} />
                {resultData && <ResultChart result={resultData} />}
              </motion.div>
            )}

            {/* Patients */}
            {activeTab === 'patients' && (
              <motion.div key="patients" {...pageTransition}>
                <PatientManagement hospitalId={hospitalId} />
              </motion.div>
            )}

            {/* Analytics */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" {...pageTransition}>
                <ModelMetrics />
              </motion.div>
            )}

            {/* AI Insights */}
            {activeTab === 'insights' && (
              <motion.div key="insights" {...pageTransition}>
                <AIInsights />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Settings Modal Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            className="ndx-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              className="ndx-settings-modal card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ndx-modal-header">
                <h3>System Preferences</h3>
                <button onClick={() => setShowSettings(false)} className="ndx-modal-close-btn">&times;</button>
              </div>
              <div className="ndx-modal-body">
                <div className="ndx-setting-item">
                  <div className="ndx-setting-info">
                    <strong>Auto-Save Analysis Results</strong>
                    <span>Automatically append scanning logs to MongoDB and local backups.</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="ndx-setting-item">
                  <div className="ndx-setting-info">
                    <strong>Precision Target Tuning</strong>
                    <span>Calibrate convolutional confidence margins to reduce false alarms.</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="ndx-setting-item">
                  <div className="ndx-setting-info">
                    <strong>Alert Audio Ping</strong>
                    <span>Play a clinical alert audio beep on positive tumor classifications.</span>
                  </div>
                  <input type="checkbox" />
                </div>
                <div className="ndx-setting-item">
                  <div className="ndx-setting-info">
                    <strong>Clinical Performance Sharing</strong>
                    <span>Anonymously upload accuracy statistics to improve central training kernels.</span>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
              <div className="ndx-modal-footer">
                <button onClick={() => setShowSettings(false)} className="btn btn-primary">Save Preferences</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
