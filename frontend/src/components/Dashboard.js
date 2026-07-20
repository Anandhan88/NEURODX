import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ScanLine, AlertTriangle, ShieldCheck, HeartPulse,
  Activity, Cpu, Database, Wifi,
  TrendingUp, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Dashboard.css';

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }
  })
};

const PIE_COLORS = ['#7C3AED', '#D97706', '#059669', '#0098B3'];

/* Mock scan activity data */
const scanActivityData = [
  { day: 'Mon', scans: 4 },
  { day: 'Tue', scans: 7 },
  { day: 'Wed', scans: 3 },
  { day: 'Thu', scans: 8 },
  { day: 'Fri', scans: 5 },
  { day: 'Sat', scans: 2 },
  { day: 'Sun', scans: 6 },
];

const Dashboard = ({ stats, history }) => {
  /* Compute tumor distribution from history */
  const tumorDistribution = useMemo(() => {
    const counts = { Glioma: 0, Meningioma: 0, 'No Tumor': 0, Pituitary: 0 };
    (history || []).forEach(item => {
      if (counts.hasOwnProperty(item.tumor_class)) {
        counts[item.tumor_class]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [history]);

  const hasTumorData = tumorDistribution.some(d => d.value > 0);

  const recentScans = (history || []).slice(0, 5);

  const healthyCount = (history || []).filter(h => h.tumor_class === 'No Tumor').length;
  const highRiskCount = (history || []).filter(
    h => h.tumor_class && h.tumor_class !== 'No Tumor' && h.confidence >= 80
  ).length;

  const avgConfidence = history && history.length > 0
    ? (history.reduce((sum, h) => sum + (h.confidence || 0), 0) / history.length).toFixed(1)
    : '—';

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const getBadgeClass = (cls) => {
    switch (cls) {
      case 'Glioma': return 'glioma';
      case 'Meningioma': return 'meningioma';
      case 'No Tumor': return 'no-tumor';
      case 'Pituitary': return 'pituitary';
      default: return '';
    }
  };

  return (
    <div className="ndx-dashboard animate-fade-in">

      {/* ---- Row 1: Stats Cards ---- */}
      <div className="ndx-stats-grid">
        {[
          { label: "Total Scans", value: stats.totalScans, icon: ScanLine, color: 'var(--primary)', bg: 'var(--primary-50)' },
          { label: "Tumors Detected", value: stats.tumorsDetected, icon: AlertTriangle, color: '#D97706', bg: 'rgba(245, 158, 11, 0.06)' },
          { label: "High Risk", value: highRiskCount, icon: Activity, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.06)' },
          { label: "Healthy", value: healthyCount, icon: ShieldCheck, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.06)' },
          { label: "Avg Confidence", value: `${avgConfidence}%`, icon: TrendingUp, color: 'var(--accent)', bg: 'rgba(0, 184, 217, 0.06)' },
          { label: "System Status", value: "Operational", icon: Cpu, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.06)', isStatus: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="ndx-stat-card card"
              custom={i}
              variants={cardVariants}
              initial="initial"
              animate="animate"
            >
              <div className="ndx-stat-icon" style={{ background: stat.bg, color: stat.color }}>
                <Icon size={20} />
              </div>
              <div className="ndx-stat-content">
                <span className="ndx-stat-label">{stat.label}</span>
                <span className="ndx-stat-value" style={stat.isStatus ? { fontSize: '1rem', color: stat.color } : {}}>
                  {stat.isStatus && <span className="status-dot online" style={{ marginRight: 6 }} />}
                  {stat.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ---- Row 2: Charts ---- */}
      <div className="ndx-charts-row">
        {/* Scan Activity Chart */}
        <motion.div className="card ndx-chart-card" variants={cardVariants} custom={6} initial="initial" animate="animate">
          <div className="ndx-chart-header">
            <h3><Activity size={16} /> Scan Activity</h3>
            <span className="badge badge-primary">This Week</span>
          </div>
          <div className="ndx-chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={scanActivityData}>
                <defs>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff', border: '1px solid #E2E8F0',
                    borderRadius: '8px', fontSize: '0.82rem', boxShadow: 'var(--shadow-md)'
                  }}
                />
                <Area type="monotone" dataKey="scans" stroke="#0F4C81" strokeWidth={2.5}
                  fill="url(#scanGrad)" dot={{ fill: '#0F4C81', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tumor Distribution */}
        <motion.div className="card ndx-chart-card" variants={cardVariants} custom={7} initial="initial" animate="animate">
          <div className="ndx-chart-header">
            <h3><HeartPulse size={16} /> Tumor Distribution</h3>
            <span className="badge badge-info">All Time</span>
          </div>
          <div className="ndx-chart-body">
            {hasTumorData ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={tumorDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                    {tumorDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="ndx-empty-chart">
                <HeartPulse size={32} />
                <p>No scan data yet</p>
                <span>Run your first MRI analysis to see the distribution</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ---- Row 3: Timeline & Status ---- */}
      <div className="ndx-activity-row">
        {/* Recent Patient Timeline */}
        <motion.div className="card ndx-timeline-card" variants={cardVariants} custom={8} initial="initial" animate="animate">
          <div className="ndx-chart-header">
            <h3><Clock size={16} /> Recent Scans</h3>
            <span className="badge badge-primary">{recentScans.length} records</span>
          </div>
          <div className="ndx-timeline">
            {recentScans.length === 0 ? (
              <div className="ndx-empty-state">
                <ScanLine size={28} />
                <p>No scans recorded</p>
                <span>Navigate to MRI Analysis to run your first scan</span>
              </div>
            ) : (
              recentScans.map((scan, idx) => (
                <div key={scan._id || idx} className="ndx-timeline-item">
                  <div className="ndx-timeline-dot" />
                  <div className="ndx-timeline-content">
                    <div className="ndx-timeline-top">
                      <span className="ndx-timeline-name">{scan.patient_name}</span>
                      <span className={`tumor-badge ${getBadgeClass(scan.tumor_class)}`}>
                        {scan.tumor_class}
                      </span>
                    </div>
                    <div className="ndx-timeline-meta">
                      ID: {scan.patient_id} • Age: {scan.patient_age} • {scan.confidence}% confidence
                    </div>
                    <div className="ndx-timeline-date">
                      {formatDate(scan.timestamp)} at {formatTime(scan.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div className="card ndx-status-card" variants={cardVariants} custom={9} initial="initial" animate="animate">
          <div className="ndx-chart-header">
            <h3><Cpu size={16} /> System Status</h3>
          </div>
          <div className="ndx-system-grid">
            {[
              { label: 'Flask Server', status: 'Connected', port: '5000', icon: Wifi, ok: true },
              { label: 'TensorFlow Model', status: 'Loaded', port: 'H5', icon: Cpu, ok: true },
              { label: 'MongoDB', status: 'Active', port: 'Atlas', icon: Database, ok: true },
              { label: 'React Frontend', status: 'Running', port: '3000', icon: Activity, ok: true },
            ].map((sys) => {
              const SysIcon = sys.icon;
              return (
                <div key={sys.label} className="ndx-system-item">
                  <div className="ndx-system-icon">
                    <SysIcon size={16} />
                  </div>
                  <div className="ndx-system-info">
                    <span className="ndx-system-label">{sys.label}</span>
                    <span className="ndx-system-detail">{sys.port}</span>
                  </div>
                  <div className="ndx-system-status">
                    <span className="status-dot online" />
                    <span>{sys.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Model Info */}
          <div className="ndx-model-info">
            <h4>Model Architecture</h4>
            <div className="ndx-model-specs">
              <div><span>Framework</span><strong>TensorFlow / Keras</strong></div>
              <div><span>Input Size</span><strong>150×150×3</strong></div>
              <div><span>Classes</span><strong>4 (Multi-class)</strong></div>
              <div><span>Accuracy</span><strong>{stats.accuracy}</strong></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
