import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Sliders, Activity, Grid, Cpu, Layers, Disc, Settings } from 'lucide-react';

const ModelMetrics = () => {
  // Validation training curves data
  const trainingData = [
    { epoch: 1, accuracy: 68.5, val_accuracy: 72.1, loss: 0.95, val_loss: 0.82 },
    { epoch: 5, accuracy: 79.2, val_accuracy: 81.4, loss: 0.61, val_loss: 0.55 },
    { epoch: 10, accuracy: 86.8, val_accuracy: 88.0, loss: 0.42, val_loss: 0.38 },
    { epoch: 15, accuracy: 91.3, val_accuracy: 92.5, loss: 0.29, val_loss: 0.27 },
    { epoch: 20, accuracy: 94.6, val_accuracy: 94.8, loss: 0.19, val_loss: 0.21 },
    { epoch: 25, accuracy: 96.8, val_accuracy: 95.9, loss: 0.12, val_loss: 0.18 },
    { epoch: 30, accuracy: 98.2, val_accuracy: 96.2, loss: 0.08, val_loss: 0.16 },
  ];

  const classes = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary'];
  const confusionMatrix = [
    [94, 3, 2, 1], // Glioma
    [2, 92, 4, 2], // Meningioma
    [1, 1, 98, 0], // No Tumor
    [1, 2, 0, 97], // Pituitary
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {[
          { label: 'Model Accuracy', val: '96.2%', sub: 'Validation Set (n=400 scans)', color: 'var(--primary)' },
          { label: 'Precision Rating', val: '95.8%', sub: 'False positive rate: ~2.1%', color: 'var(--accent)' },
          { label: 'Recall (Sensitivity)', val: '96.0%', sub: 'True positive rate', color: 'var(--secondary)' },
          { label: 'F1 Score', val: '95.9%', sub: 'Harmonic mean score', color: 'var(--success)' },
        ].map((card) => (
          <div key={card.label} className="card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{card.label}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: card.color }}>{card.val}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Curves & Matrices Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Learning Curves Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--primary)' }} />
            Training Progress (Accuracy Curve)
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="epoch" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
                <Line type="monotone" dataKey="accuracy" name="Training Acc" stroke="var(--primary)" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="val_accuracy" name="Val Acc" stroke="var(--accent)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid size={16} style={{ color: 'var(--secondary)' }} />
            Confusion Matrix (Validation Results)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '4px' }}>
              {classes.map(c => (
                <div key={c} style={{ width: '22%', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Pred {c.substring(0, 5)}
                </div>
              ))}
            </div>
            
            {classes.map((className, rowIdx) => (
              <div key={className} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ width: '18%', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  True {className}
                </div>
                <div style={{ display: 'flex', width: '82%', gap: '6px' }}>
                  {confusionMatrix[rowIdx].map((val, colIdx) => {
                    const isDiagonal = rowIdx === colIdx;
                    const alpha = val / 100 * 0.35 + 0.05;
                    const bgColor = isDiagonal 
                      ? `rgba(15, 76, 129, ${alpha})`
                      : `rgba(239, 68, 68, ${alpha})`;
                    const textColor = isDiagonal ? 'var(--primary)' : 'var(--danger)';
                    
                    return (
                      <div 
                        key={colIdx} 
                        style={{
                          width: '25%',
                          padding: '12px 0',
                          textAlign: 'center',
                          borderRadius: '8px',
                          background: bgColor,
                          color: textColor,
                          fontWeight: isDiagonal ? 700 : 400,
                          fontSize: '0.85rem',
                          border: isDiagonal ? '1px solid var(--primary-200)' : '1.5px solid transparent'
                        }}
                      >
                        {val}%
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Model Specifications Section */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} style={{ color: 'var(--accent)' }} />
          Clinical CNN Model Architecture Specifications
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
              <Settings size={12} style={{ display: 'inline', marginRight: 4 }} /> Framework
            </span>
            <strong style={{ display: 'block', marginTop: '2px', color: 'var(--text-primary)' }}>Keras / TensorFlow Engine</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
              <Layers size={12} style={{ display: 'inline', marginRight: 4 }} /> Dimensions
            </span>
            <strong style={{ display: 'block', marginTop: '2px', color: 'var(--text-primary)' }}>150 × 150 × 3 (RGB)</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
              <Cpu size={12} style={{ display: 'inline', marginRight: 4 }} /> Layer Depth
            </span>
            <strong style={{ display: 'block', marginTop: '2px', color: 'var(--text-primary)' }}>12 Convolutional & Dense layers</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
              <Disc size={12} style={{ display: 'inline', marginRight: 4 }} /> Params Count
            </span>
            <strong style={{ display: 'block', marginTop: '2px', color: 'var(--text-primary)' }}>1.28 Million Weights</strong>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ModelMetrics;
