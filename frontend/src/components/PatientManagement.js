import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, Filter, Edit3, Trash2, Eye, X, CheckCircle2,
  AlertTriangle, Clock, Activity, Phone, Mail, User
} from 'lucide-react';
import './PatientManagement.css';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }
};

const PatientManagement = ({ hospitalId }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [deletingPatientId, setDeletingPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    doctor: hospitalId || 'Dr. Smith',
    prediction: 'No Tumor',
    confidence: '95.0',
    report_status: 'Completed'
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/patients');
      setPatients(res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormData({
      patient_id: `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      name: '',
      age: '',
      gender: 'Male',
      phone: '',
      email: '',
      doctor: hospitalId || 'Dr. Smith',
      prediction: 'No Tumor',
      confidence: '95.0',
      report_status: 'Completed'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      patient_id: patient.patient_id || '',
      name: patient.name || patient.patient_name || '',
      age: patient.age || '',
      gender: patient.gender || 'Male',
      phone: patient.phone || '',
      email: patient.email || '',
      doctor: patient.doctor || patient.doctor_name || 'Dr. Smith',
      prediction: patient.prediction || patient.tumor_class || 'No Tumor',
      confidence: patient.confidence || '95.0',
      report_status: patient.report_status || 'Completed'
    });
    setShowAddModal(true);
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPatient) {
        await axios.put(`/patients/${editingPatient.patient_id}`, formData);
        showToast("Patient record updated successfully!");
      } else {
        await axios.post('/patients', formData);
        showToast("New patient record added successfully!");
      }
      setShowAddModal(false);
      fetchPatients();
    } catch (err) {
      console.error("Error saving patient:", err);
      alert(err.response?.data?.error || "Failed to save patient record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    try {
      await axios.delete(`/patients/${patientId}`);
      showToast("Patient record deleted.");
      setDeletingPatientId(null);
      fetchPatients();
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert("Failed to delete patient record.");
    }
  };

  const handleViewPatient = async (patientId) => {
    try {
      const res = await axios.get(`/patients/${patientId}`);
      setViewingPatient(res.data);
    } catch (err) {
      console.error("Error loading patient details:", err);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const pName = (p.name || p.patient_name || '').toLowerCase();
      const pId = (p.patient_id || '').toLowerCase();
      const pDoctor = (p.doctor || p.doctor_name || '').toLowerCase();
      const matchesSearch = !searchQuery || pName.includes(searchQuery.toLowerCase()) || pId.includes(searchQuery.toLowerCase()) || pDoctor.includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || p.report_status === statusFilter;
      const matchesGender = !genderFilter || p.gender === genderFilter;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [patients, searchQuery, statusFilter, genderFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <span className="ndx-badge badge-success"><CheckCircle2 size={12} /> Completed</span>;
      case 'High Risk': return <span className="ndx-badge badge-danger"><AlertTriangle size={12} /> High Risk</span>;
      case 'Pending': return <span className="ndx-badge badge-warning"><Clock size={12} /> Pending</span>;
      default: return <span className="ndx-badge badge-info"><Activity size={12} /> {status}</span>;
    }
  };

  const getPredictionBadge = (pred) => {
    if (!pred) return <span className="ndx-badge">N/A</span>;
    if (pred === 'No Tumor') return <span className="ndx-badge badge-success">No Tumor</span>;
    return <span className="ndx-badge badge-warning">{pred}</span>;
  };

  return (
    <div className="ndx-patients-page animate-fade-in">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div className="ndx-toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <CheckCircle2 size={16} /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Actions */}
      <div className="ndx-patients-header">
        <div>
          <h2>Patient Management</h2>
          <p>Register, inspect, and manage hospital patient directory records</p>
        </div>
        <button className="btn btn-primary btn-add-patient" onClick={handleOpenAdd}>
          <UserPlus size={16} /> Add New Patient
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="ndx-patients-controls card">
        <div className="ndx-search-box">
          <Search size={17} className="ndx-search-icon" />
          <input
            type="text"
            placeholder="Search by Patient Name, ID, or Doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ndx-clear-search" onClick={() => setSearchQuery('')}><X size={14} /></button>
          )}
        </div>

        <div className="ndx-filter-group">
          <div className="ndx-select-wrapper">
            <Filter size={14} className="ndx-select-icon" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>

          <div className="ndx-select-wrapper">
            <User size={14} className="ndx-select-icon" />
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="ndx-patients-table-card card">
        {loading ? (
          <div className="ndx-loading-state">
            <div className="ndx-spinner" />
            <p>Loading patient records from database...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="ndx-empty-state">
            <User size={40} className="ndx-empty-icon" />
            <h3>No Patient Records Found</h3>
            <p>No patient matches your filter criteria or directory is currently empty.</p>
            <button className="btn btn-secondary" onClick={handleOpenAdd}>
              <UserPlus size={15} /> Add First Patient
            </button>
          </div>
        ) : (
          <div className="ndx-table-responsive">
            <table className="ndx-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Age / Gender</th>
                  <th>Contact Info</th>
                  <th>Assigned Doctor</th>
                  <th>AI Prediction</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.patient_id}>
                    <td className="font-mono text-secondary">{p.patient_id}</td>
                    <td>
                      <div className="ndx-patient-cell">
                        <div className="ndx-patient-avatar">
                          {(p.name || p.patient_name || 'P')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold">{p.name || p.patient_name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td>{p.age ? `${p.age} yrs` : 'N/A'} • {p.gender || 'Other'}</td>
                    <td>
                      <div className="ndx-contact-cell">
                        {p.phone && <span><Phone size={12} /> {p.phone}</span>}
                        {p.email && <span><Mail size={12} /> {p.email}</span>}
                        {!p.phone && !p.email && <span className="text-muted">N/A</span>}
                      </div>
                    </td>
                    <td>{p.doctor || p.doctor_name || 'Attending Physician'}</td>
                    <td>{getPredictionBadge(p.prediction || p.tumor_class)}</td>
                    <td>
                      <span className="font-semibold">
                        {p.confidence ? `${parseFloat(p.confidence).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td>{getStatusBadge(p.report_status)}</td>
                    <td>
                      <div className="ndx-action-btns">
                        <button className="btn-icon btn-view" title="Inspect File" onClick={() => handleViewPatient(p.patient_id)}>
                          <Eye size={15} />
                        </button>
                        <button className="btn-icon btn-edit" title="Edit Patient" onClick={() => handleOpenEdit(p)}>
                          <Edit3 size={15} />
                        </button>
                        <button className="btn-icon btn-delete" title="Delete Patient" onClick={() => setDeletingPatientId(p.patient_id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- ADD / EDIT PATIENT MODAL ---- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="ndx-modal-backdrop" onClick={() => setShowAddModal(false)}>
            <motion.div className="ndx-modal-content card" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
              <div className="ndx-modal-header">
                <h3>{editingPatient ? 'Edit Patient Record' : 'Register New Patient'}</h3>
                <button className="ndx-close-modal" onClick={() => setShowAddModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSavePatient} className="ndx-modal-form">
                <div className="ndx-form-grid">
                  <div className="ndx-form-group">
                    <label>Patient ID</label>
                    <input type="text" value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })} required />
                  </div>

                  <div className="ndx-form-group">
                    <label>Patient Name *</label>
                    <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>

                  <div className="ndx-form-group">
                    <label>Age</label>
                    <input type="number" placeholder="e.g. 45" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                  </div>

                  <div className="ndx-form-group">
                    <label>Gender</label>
                    <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="ndx-form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>

                  <div className="ndx-form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="patient@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>

                  <div className="ndx-form-group">
                    <label>Attending Doctor</label>
                    <input type="text" value={formData.doctor} onChange={(e) => setFormData({ ...formData, doctor: e.target.value })} />
                  </div>

                  <div className="ndx-form-group">
                    <label>AI Classification</label>
                    <select value={formData.prediction} onChange={(e) => setFormData({ ...formData, prediction: e.target.value })}>
                      <option value="No Tumor">No Tumor</option>
                      <option value="Glioma">Glioma</option>
                      <option value="Meningioma">Meningioma</option>
                      <option value="Pituitary">Pituitary</option>
                    </select>
                  </div>

                  <div className="ndx-form-group">
                    <label>Confidence (%)</label>
                    <input type="number" step="0.1" value={formData.confidence} onChange={(e) => setFormData({ ...formData, confidence: e.target.value })} />
                  </div>

                  <div className="ndx-form-group">
                    <label>Report Status</label>
                    <select value={formData.report_status} onChange={(e) => setFormData({ ...formData, report_status: e.target.value })}>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="High Risk">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="ndx-modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Save Patient'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- VIEW PATIENT INSPECTION MODAL ---- */}
      <AnimatePresence>
        {viewingPatient && (
          <div className="ndx-modal-backdrop" onClick={() => setViewingPatient(null)}>
            <motion.div className="ndx-modal-content card ndx-patient-detail-modal" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
              <div className="ndx-modal-header">
                <div className="ndx-header-profile">
                  <div className="ndx-large-avatar">
                    {(viewingPatient.patient?.name || viewingPatient.patient?.patient_name || 'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3>{viewingPatient.patient?.name || viewingPatient.patient?.patient_name || 'Patient Overview'}</h3>
                    <span className="text-secondary font-mono">{viewingPatient.patient?.patient_id}</span>
                  </div>
                </div>
                <button className="ndx-close-modal" onClick={() => setViewingPatient(null)}><X size={18} /></button>
              </div>

              <div className="ndx-patient-detail-body">
                <div className="ndx-detail-grid">
                  <div className="ndx-detail-item"><span className="label">Age / Gender:</span> <span className="value">{viewingPatient.patient?.age || 'N/A'} yrs • {viewingPatient.patient?.gender}</span></div>
                  <div className="ndx-detail-item"><span className="label">Phone:</span> <span className="value">{viewingPatient.patient?.phone || 'N/A'}</span></div>
                  <div className="ndx-detail-item"><span className="label">Email:</span> <span className="value">{viewingPatient.patient?.email || 'N/A'}</span></div>
                  <div className="ndx-detail-item"><span className="label">Attending Physician:</span> <span className="value">{viewingPatient.patient?.doctor || viewingPatient.patient?.doctor_name || 'N/A'}</span></div>
                  <div className="ndx-detail-item"><span className="label">Latest Classification:</span> <span className="value">{getPredictionBadge(viewingPatient.patient?.prediction || viewingPatient.patient?.tumor_class)}</span></div>
                  <div className="ndx-detail-item"><span className="label">Confidence Level:</span> <span className="value font-semibold">{viewingPatient.patient?.confidence}%</span></div>
                </div>

                {viewingPatient.scans && viewingPatient.scans.length > 0 && (
                  <div className="ndx-attached-scans">
                    <h4>Attached MRI Scan History ({viewingPatient.scans.length})</h4>
                    <div className="ndx-scans-list">
                      {viewingPatient.scans.map((s, idx) => (
                        <div key={idx} className="ndx-scan-card">
                          <div className="ndx-scan-info">
                            <span className="font-semibold">{s.prediction} ({s.confidence}%)</span>
                            <span className="text-muted text-xs">{new Date(s.prediction_time).toLocaleString()}</span>
                          </div>
                          {s.doctor_notes && <p className="text-xs text-secondary mt-1">"{s.doctor_notes}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="ndx-modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewingPatient(null)}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- DELETE CONFIRMATION MODAL ---- */}
      <AnimatePresence>
        {deletingPatientId && (
          <div className="ndx-modal-backdrop" onClick={() => setDeletingPatientId(null)}>
            <motion.div className="ndx-modal-content card ndx-delete-modal" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
              <AlertTriangle size={36} className="text-danger mb-2" />
              <h3>Confirm Record Deletion</h3>
              <p>Are you sure you want to permanently delete patient <strong>{deletingPatientId}</strong>? This action cannot be undone.</p>
              <div className="ndx-modal-footer mt-4">
                <button className="btn btn-secondary" onClick={() => setDeletingPatientId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDeletePatient(deletingPatientId)}>Delete Record</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientManagement;
