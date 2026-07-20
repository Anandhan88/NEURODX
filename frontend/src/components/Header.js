import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Calendar, LogOut, CheckCircle, Database, ShieldAlert, Sparkles, X } from 'lucide-react';
import './Header.css';

const pageTitles = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time clinical analytics and system overview' },
  analysis: { title: 'MRI Analysis', subtitle: 'Upload and analyze brain MRI scans with AI' },
  patients: { title: 'Patient Directory', subtitle: 'Comprehensive scan history and patient records' },
  analytics: { title: 'Model Analytics', subtitle: 'CNN performance metrics and training data' },
  insights: { title: 'AI Insights', subtitle: 'AI model explanations and clinical findings' },
};

const Header = ({ activeTab, hospitalId, onLogout, onOpenSettings }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const page = pageTitles[activeTab] || pageTitles.dashboard;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  const initials = hospitalId
    ? hospitalId.substring(0, 2).toUpperCase()
    : 'DX';

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, type: 'success', text: 'TensorFlow model loaded (brain_tumor_classifier.h5)', time: 'Just now', icon: <CheckCircle size={14} className="notif-green" /> },
    { id: 2, type: 'info', text: 'MongoDB connection established successfully', time: '5 mins ago', icon: <Database size={14} className="notif-blue" /> },
    { id: 3, type: 'warning', text: 'New high-risk MRI prediction logged in database', time: '1 hr ago', icon: <ShieldAlert size={14} className="notif-amber" /> }
  ];

  return (
    <motion.header
      className="ndx-header"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left — Title */}
      <div className="ndx-header-left">
        <h1 className="ndx-header-title">{page.title}</h1>
        <p className="ndx-header-subtitle">{page.subtitle}</p>
      </div>

      {/* Right — Actions */}
      <div className="ndx-header-right">
        {/* Search */}
        <div className="ndx-header-search">
          <Search size={15} className="ndx-search-icon" />
          <input
            type="text"
            placeholder="Search patients, scans..."
            className="ndx-search-input"
            aria-label="Global search"
          />
        </div>

        {/* Date */}
        <div className="ndx-header-date">
          <Calendar size={14} />
          <span>{today}</span>
        </div>

        {/* Status */}
        <div className="ndx-header-status" title="System Online">
          <span className="status-dot online" />
          <span className="ndx-status-label">Online</span>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            className={`ndx-header-icon-btn ${showNotifications ? 'active' : ''}`} 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="ndx-notif-dot" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                className="ndx-notif-dropdown card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="ndx-notif-header">
                  <h4><Sparkles size={14} /> System Alerts</h4>
                  <button onClick={() => setShowNotifications(false)} className="ndx-notif-close">
                    <X size={14} />
                  </button>
                </div>
                <div className="ndx-notif-body">
                  {notifications.map((n) => (
                    <div key={n.id} className="ndx-notif-item">
                      <div className="ndx-notif-icon-wrap">
                        {n.icon}
                      </div>
                      <div className="ndx-notif-content">
                        <p>{n.text}</p>
                        <span>{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar Profile (triggers settings modal) */}
        <div 
          className="ndx-header-avatar" 
          title={hospitalId || 'Portal Admin'}
          onClick={onOpenSettings}
        >
          {initials}
        </div>

        {/* Logout */}
        <button className="ndx-header-icon-btn ndx-logout-btn" onClick={onLogout} aria-label="Logout">
          <LogOut size={17} />
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
