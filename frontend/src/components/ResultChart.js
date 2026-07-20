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
import { BarChart3, PieChartIcon, Activity, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import PDFReport from './PDFReport';
import './ResultChart.css';

const CHART_COLORS = ['#0F4C81', '#00C389', '#00B8D9', '#D97706']; // primary, secondary, accent, warning

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
    if (conf >= 80) return 'var(--success)';
    if (conf >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getTumorDescription = (tumorType) => {
    switch (tumorType) {
      case 'Glioma': return 'Gliomas represent primary brain tumors originating in glial cells of the central nervous system. The AI classifier identifies structural patterns matching typical glioma tissue density and boundaries.';
      case 'Meningioma': return 'Meningiomas arise from the meningeal protective layers surrounding the brain and spinal cord. They generate mass effects on local structures as they enlarge.';
      case 'No Tumor': return 'Normal scan mapping. MRI anatomical parameters show normal brain tissue density and structural borders with no detectable lesions.';
      case 'Pituitary': return 'Pituitary adenomas develop in the pituitary gland at the skull base. Their location near optic nerves and hormone control hubs warrants visual field assessments.';
      default: return 'Atypical pathological layout. Clinical verification is recommended.';
    }
  };

  const getSeverityLevel = (tumorType, conf) => {
    if (tumorType === 'No Tumor') return 'Normal';
    if (conf >= 80) return 'High Risk (Critical Review)';
    if (conf >= 60) return 'Moderate Risk';
    return 'Observation Needed';
  };

  const getClinicalRecommendation = (tumorType) => {
    if (tumorType === 'No Tumor') {
      return 'Periodic monitoring or regular clinical check-ups as suggested by the consulting physician.';
    }
    return 'Schedule immediate high-contrast MRI. Order surgical consult and histopathological review to determine the grading and therapy path.';
  };

  const getBadgeClass = (tumorClass) => {
    switch (tumorClass) {
      case 'Glioma': return 'glioma';
      case 'Meningioma': return 'meningioma';
      case 'No Tumor': return 'no-tumor';
      case 'Pituitary': return 'pituitary';
      default: return '';
    }
  };

  return (
    <div className="ndx-result-details-section animate-fade-in">
      <div className="card ndx-result-summary-card">
        <div className="ndx-chart-header">
          <div className="ndx-result-meta">
            <Sparkles size={16} />
            <h2>Clinical Diagnostic Report</h2>
          </div>
          <div className="ndx-confidence-meter">
            <span className="confidence-label">AI Confidence Score:</span>
            <span 
              className="confidence-value"
              style={{ color: getConfidenceColor(confidence) }}
            >
              {confidence}%
            </span>
          </div>
        </div>

        <div className="ndx-classification-box">
          <div className="ndx-class-info">
            <div className="ndx-class-title-row">
              <h3>{label} Detected</h3>
              <span className={`tumor-badge ${getBadgeClass(label)}`}>
                Severity: {getSeverityLevel(label, confidence)}
              </span>
            </div>
            <p className="ndx-class-desc">
              {getTumorDescription(label)}
            </p>
          </div>
        </div>

        {/* Recharts Grid */}
        <div className="ndx-charts-grid" ref={chartsRef}>
          <div className="ndx-chart-holder">
            <div className="ndx-chart-title">
              <PieChartIcon size={14} />
              <h4>Probability Distribution</h4>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ''}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="ndx-chart-holder">
            <div className="ndx-chart-title">
              <BarChart3 size={14} />
              <h4>Class Confidence Metrics</h4>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--primary)">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Guidelines */}
        <div className="ndx-guidelines-box">
          <div className="ndx-guidelines-title">
            <Activity size={16} />
            <h3>Clinical Action Guidelines</h3>
          </div>
          <div className="ndx-guidelines-content">
            <div className="ndx-recom-title">
              <ArrowRight size={14} />
              <span>Recommended Next Steps:</span>
            </div>
            <p>{getClinicalRecommendation(label)}</p>
          </div>
          <div className="ndx-critical-notice">
            <ShieldAlert size={14} />
            <span>This is an AI-assisted classification tool. All decisions must be clinically correlated by a physician.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ndx-report-actions">
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
    </div>
  );
}

export default ResultChart;
