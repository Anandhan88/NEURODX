import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiCalendar, FiUser, FiActivity, FiFileText, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import PDFReport from './PDFReport';

const HistoryLog = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
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
      // Read from local storage as fallback if available
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

  // Update localStorage whenever history is updated from the server (if successful)
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('bt_scan_history', JSON.stringify(history));
    }
  }, [history]);

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterClass === 'All' || item.tumor_class === filterClass;
    
    return matchesSearch && matchesFilter;
  });

  const getBadgeClass = (tumorClass) => {
    switch(tumorClass) {
      case 'Glioma': return 'glioma';
      case 'Meningioma': return 'meningioma';
      case 'No Tumor': return 'no-tumor';
      case 'Pituitary': return 'pituitary';
      default: return '';
    }
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Actions Bar */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '10px', flexGrow: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <FiSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search by Patient Name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Classifications</option>
            <option value="Glioma">Glioma</option>
            <option value="Meningioma">Meningioma</option>
            <option value="No Tumor">No Tumor</option>
            <option value="Pituitary">Pituitary</option>
          </select>
        </div>

        <button 
          onClick={fetchHistory}
          disabled={loading}
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}
          className="gradient-border-btn"
        >
          <FiRefreshCw className={loading ? 'spin-icon' : ''} style={{
            animation: loading ? 'spin 1s linear infinite' : 'none'
          }} />
          Reload Database
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {/* Main Grid: Data Table and Report Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedRecord ? '3fr 2fr' : '1fr',
        gap: '1.5rem',
        alignItems: 'start',
        transition: 'all 0.3s ease'
      }}>
        
        {/* Scans Table */}
        <div className="glass-panel" style={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  <th style={{ padding: '16px 20px' }}>Patient Details</th>
                  <th style={{ padding: '16px 20px' }}>Classification</th>
                  <th style={{ padding: '16px 20px' }}>Confidence</th>
                  <th style={{ padding: '16px 20px' }}>Scan Date</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      No scan records found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <tr 
                      key={item._id || idx} 
                      onClick={() => setSelectedRecord(item)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: selectedRecord === item ? 'rgba(6, 182, 212, 0.04)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.patient_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ID: {item.patient_id} • Age: {item.patient_age}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`tumor-badge ${getBadgeClass(item.tumor_class)}`}>
                          {item.tumor_class}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '60px',
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${item.confidence}%`,
                              height: '100%',
                              background: item.confidence >= 80 ? '#10b981' : item.confidence >= 60 ? '#f59e0b' : '#ef4444'
                            }} />
                          </div>
                          <span style={{ fontWeight: 500 }}>{item.confidence}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <FiCalendar style={{ color: 'var(--text-muted)' }} />
                          {formatDate(item.timestamp)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-cyan)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 500
                        }}>
                          View Report
                          <FiArrowRight />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Record Detailed Sidebar */}
        {selectedRecord && (
          <div className="glass-panel animate-fade-in" style={{
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '1rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>Patient Medical File</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created {formatDate(selectedRecord.timestamp)}</p>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiUser style={{ color: 'var(--accent-cyan)' }} />
                <span><strong>Name:</strong> {selectedRecord.patient_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiFileText style={{ color: 'var(--accent-cyan)' }} />
                <span><strong>Patient ID:</strong> {selectedRecord.patient_id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiActivity style={{ color: 'var(--accent-cyan)' }} />
                <span><strong>Age:</strong> {selectedRecord.patient_age}</span>
              </div>
              <div style={{
                marginTop: '10px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Diagnosis Notes:
                </div>
                <div style={{ fontStyle: selectedRecord.doctor_notes ? 'normal' : 'italic', color: selectedRecord.doctor_notes ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {selectedRecord.doctor_notes || "No additional diagnosis notes entered by the clinical observer."}
                </div>
              </div>
            </div>

            {/* Render PDF Report Actions */}
            <div style={{
              marginTop: '10px',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <PDFReport 
                result={{
                  class: selectedRecord.tumor_class,
                  confidence: selectedRecord.confidence
                }}
                chartsRef={{ current: null }} // disable detailed report charts if they are not in view
              />
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
      `}</style>
    </div>
  );
};

export default HistoryLog;
