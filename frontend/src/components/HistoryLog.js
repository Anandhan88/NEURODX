import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Calendar, User, Activity, FileText, 
  RefreshCw, ArrowRight, Filter, Download, 
  ArrowUpDown, UserCheck, Stethoscope, Building2, ChevronRight, X, AlertCircle
} from 'lucide-react';
import PDFReport from './PDFReport';

const getBadgeClass = (tumorClass) => {
  switch (tumorClass) {
    case 'Glioma': return 'glioma';
    case 'Meningioma': return 'meningioma';
    case 'No Tumor': return 'no-tumor';
    case 'Pituitary': return 'pituitary';
    default: return '';
  }
};

const getSeverityBadge = (tumorClass, confidence) => {
  if (tumorClass === 'No Tumor') return <span className="badge badge-success">Normal</span>;
  if (confidence >= 80) return <span className="badge badge-danger">High Risk</span>;
  return <span className="badge badge-warning">Moderate Risk</span>;
};

const formatDate = (isoString) => {
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return isoString;
  }
};

const HistoryLog = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/history');
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching scan history:", err);
      setError("Unable to load scan history database. The server may be offline.");
      const localData = localStorage.getItem('bt_scan_history');
      if (localData) {
        setHistory(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('bt_scan_history', JSON.stringify(history));
    }
  }, [history]);

  // Filters & Sorting
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = 
        item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterClass === 'All' || item.tumor_class === filterClass;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortOrder === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortOrder === 'confidence-high') {
        return b.confidence - a.confidence;
      }
      return 0;
    });

  const exportCSV = () => {
    const headers = 'Patient Name,Patient ID,Age,Tumor Classification,Confidence (%),Scan Date\n';
    const rows = filteredHistory.map(h => 
      `"${h.patient_name}","${h.patient_id}","${h.patient_age}","${h.tumor_class}",${h.confidence},"${formatDate(h.timestamp)}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `neurodx_patient_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and Filters panel */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Patient Name or Medical Record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="input"
                style={{ width: '160px', padding: '8px 12px', cursor: 'pointer' }}
              >
                <option value="All">All Tumor Types</option>
                <option value="Glioma">Glioma</option>
                <option value="Meningioma">Meningioma</option>
                <option value="No Tumor">No Tumor</option>
                <option value="Pituitary">Pituitary</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="input"
                style={{ width: '160px', padding: '8px 12px', cursor: 'pointer' }}
              >
                <option value="newest">Sort: Newest Scans</option>
                <option value="oldest">Sort: Oldest Scans</option>
                <option value="confidence-high">Sort: High Confidence</option>
              </select>
            </div>

            <button onClick={exportCSV} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button 
              onClick={fetchHistory} 
              disabled={loading} 
              className="btn btn-ghost" 
              style={{ border: '1px solid var(--border-color)', padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="ndx-error-box">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main layout: directory grid + split view */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedRecord ? '1.5fr 1fr' : '1fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        
        {/* Patient card grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedRecord ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {filteredHistory.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
              <User size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h4>No Patient Records Found</h4>
              <p style={{ fontSize: '0.85rem' }}>No clinical scans match your filter settings.</p>
            </div>
          ) : (
            filteredHistory.map((item, idx) => (
              <motion.div
                key={item._id || idx}
                className={`card ndx-patient-card ${selectedRecord === item ? 'active' : ''}`}
                onClick={() => setSelectedRecord(item)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: selectedRecord === item ? '4px solid var(--primary)' : '1px solid var(--border-color)',
                  transition: 'border var(--transition-fast)'
                }}
                layout
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'var(--primary-50)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.85rem'
                    }}>
                      {item.patient_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{item.patient_name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MRN: {item.patient_id}</span>
                    </div>
                  </div>
                  {getSeverityBadge(item.tumor_class, item.confidence)}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  fontSize: '0.78rem'
                }}>
                  <div><span>Classification</span><strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.tumor_class}</strong></div>
                  <div><span>Confidence</span><strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.confidence}%</strong></div>
                  <div><span>Age / Gender</span><strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.patient_age} yrs / M</strong></div>
                  <div><span>Scan Date</span><strong style={{ display: 'block', color: 'var(--text-primary)' }}>{formatDate(item.timestamp).split(' ')[0]}</strong></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Observer: Active Node</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open Details
                    <ChevronRight size={14} />
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Selected Record Detail Panel */}
        <AnimatePresence>
          {selectedRecord && (
            <motion.div
              className="card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                position: 'sticky',
                top: '80px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Medical Directory File</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created {formatDate(selectedRecord.timestamp)}</span>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                  <span><strong>Full Name:</strong> {selectedRecord.patient_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={16} style={{ color: 'var(--primary)' }} />
                  <span><strong>Record ID:</strong> {selectedRecord.patient_id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={16} style={{ color: 'var(--primary)' }} />
                  <span><strong>Demographics:</strong> {selectedRecord.patient_age} Years Old / Male</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Stethoscope size={16} style={{ color: 'var(--primary)' }} />
                  <span><strong>Classification:</strong> {selectedRecord.tumor_class} ({selectedRecord.confidence}% Confidence)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={16} style={{ color: 'var(--primary)' }} />
                  <span><strong>Authorizer:</strong> Clinical Engine Node</span>
                </div>

                <div style={{
                  padding: '12px',
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginTop: '6px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Observer Notes:
                  </div>
                  <div style={{ fontStyle: selectedRecord.doctor_notes ? 'normal' : 'italic', color: selectedRecord.doctor_notes ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {selectedRecord.doctor_notes || "No clinical observations annotated by neurologist."}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <PDFReport 
                  result={{
                    class: selectedRecord.tumor_class,
                    confidence: selectedRecord.confidence
                  }}
                  chartsRef={{ current: null }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default HistoryLog;
