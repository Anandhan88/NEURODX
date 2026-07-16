import React, { useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiActivity, FiArrowRight } from 'react-icons/fi';
import PDFReport from './PDFReport';
import './ResultChart.css';

const COLORS = ['#10b981', '#059669', '#34d399', '#0f766e']; // emerald, forest, mint, teal

function ResultChart({ result }) {
  const label = result.class;
  const confidence = result.confidence;
  const chartsRef = useRef(null);

  const pieData = result.probabilities ? [
    { name: 'Glioma', value: result.probabilities['Glioma'] || 0 },
    { name: 'Meningioma', value: result.probabilities['Meningioma'] || 0 },
    { name: 'No Tumor', value: result.probabilities['No Tumor'] || 0 },
    { name: 'Pituitary', value: result.probabilities['Pituitary'] || 0 },
  ].filter(item => item.value > 0) : [
    { name: label, value: confidence },
    { name: 'Other', value: parseFloat((100 - confidence).toFixed(2)) },
  ];

  const barData = result.probabilities ? [
    { name: 'Glioma', value: result.probabilities['Glioma'] || 0 },
    { name: 'Meningioma', value: result.probabilities['Meningioma'] || 0 },
    { name: 'No Tumor', value: result.probabilities['No Tumor'] || 0 },
    { name: 'Pituitary', value: result.probabilities['Pituitary'] || 0 },
  ] : [
    { name: 'Glioma', value: label === 'Glioma' ? confidence : 0 },
    { name: 'Meningioma', value: label === 'Meningioma' ? confidence : 0 },
    { name: 'No Tumor', value: label === 'No Tumor' ? confidence : 0 },
    { name: 'Pituitary', value: label === 'Pituitary' ? confidence : 0 },
  ];

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return '#10b981'; // green
    if (conf >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getTumorIcon = (tumorType) => {
    switch (tumorType) {
      case 'Glioma': return '🧠';
      case 'Meningioma': return '🧠';
      case 'No Tumor': return '✅';
      case 'Pituitary': return '🧠';
      default: return '🔍';
    }
  };

  const getTumorDescription = (tumorType) => {
    switch (tumorType) {
      case 'Glioma': return 'Gliomas are tumors that grow in the glial cells of the brain. They can be slow-growing or highly aggressive, depending on their grade, and are the most common primary brain tumor type.';
      case 'Meningioma': return 'Meningiomas arise from the meninges, the protective membranes surrounding the brain. They are mostly benign and slow-growing but can press against neural tissue as they expand.';
      case 'No Tumor': return 'The scan indicates normal anatomical structures of the brain with no detectable lesions, masses, or tissue abnormalities.';
      case 'Pituitary': return 'Pituitary adenomas develop in the pituitary gland at the skull base. They can press against optic nerves or disrupt metabolic hormone balances.';
      default: return 'Unknown tumor configuration. Clinical assessment is required.';
    }
  };

  const getSeverityLevel = (tumorType, conf) => {
    if (tumorType === 'No Tumor') return 'Normal';
    if (conf >= 80) return 'High Confidence (Critical Review)';
    if (conf >= 60) return 'Moderate Confidence';
    return 'Observation Required';
  };

  const getClinicalRecommendation = (tumorType) => {
    if (tumorType === 'No Tumor') {
      return 'Regular annual screening checks or as directed by the clinician based on symptom profiles.';
    }
    return 'Arrange immediate high-contrast MRI scans with contrast. Order surgical consult and histological biopsies to guide targeted therapy.';
  };

  return (
    <div className="result-chart-container animate-fade-in">
      <div className="chart-header">
        <h2>
          <FiTrendingUp style={{ color: 'var(--accent-cyan)' }} />
          Comprehensive Scan Diagnostics
        </h2>
        <div className="confidence-indicator">
          <span className="confidence-label">Confidence:</span>
          <span 
            className="confidence-value"
            style={{ color: getConfidenceColor(confidence) }}
          >
            {confidence}%
          </span>
        </div>
      </div>

      <div className="classification-card">
        <div className="tumor-icon">{getTumorIcon(label)}</div>
        <div className="classification-details">
          <h3>{label} Detected</h3>
          <p>Validated with {confidence}% precision probability.</p>
          <p style={{ marginTop: '10px' }}>
            {getTumorDescription(label)}
          </p>
          <div style={{ marginTop: '14px' }}>
            <span className="tumor-badge pituitary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Severity Level: {getSeverityLevel(label, confidence)}
            </span>
          </div>
        </div>
      </div>

      <div className="charts-grid" ref={chartsRef}>
        <div className="chart-card">
          <div className="chart-header-small">
            <FiPieChart style={{ color: 'var(--accent-cyan)' }} />
            <h3>Probability Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header-small">
            <FiBarChart2 style={{ color: 'var(--accent-purple)' }} />
            <h3>Multi-Class Diagnostics Output</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip 
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--accent-cyan)">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="interpretation">
        <h3>
          <FiActivity style={{ color: 'var(--accent-indigo)' }} />
          Clinical Action Guidelines
        </h3>
        <div className="interpretation-content">
          {label === 'No Tumor' ? (
            <p className="positive-result">
              ✅ Normal findings. Structure parameters show healthy brain tissue profiles.
            </p>
          ) : (
            <p className="detection-result">
              ⚠️ Warning: Lesion presence matching {label.toLowerCase()} characteristics is identified.
            </p>
          )}

          <div style={{
            marginTop: '1.25rem',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.88rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <FiArrowRight /> Recommended Next Diagnostic Steps:
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {getClinicalRecommendation(label)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <PDFReport 
          result={result} 
          chartsRef={chartsRef} 
          patientName={result.patientName}
          patientId={result.patientId}
          patientAge={result.patientAge}
          doctorNotes={result.doctorNotes}
        />
      </div>
    </div>
  );
}

export default ResultChart;
