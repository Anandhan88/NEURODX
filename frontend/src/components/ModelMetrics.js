import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FiSliders, FiActivity, FiGrid, FiShield } from 'react-icons/fi';

const ModelMetrics = () => {
  // Mock validation training curves data (for model statistics visualization)
  const trainingData = [
    { epoch: 1, accuracy: 68.5, val_accuracy: 72.1, loss: 0.95, val_loss: 0.82 },
    { epoch: 5, accuracy: 79.2, val_accuracy: 81.4, loss: 0.61, val_loss: 0.55 },
    { epoch: 10, accuracy: 86.8, val_accuracy: 88.0, loss: 0.42, val_loss: 0.38 },
    { epoch: 15, accuracy: 91.3, val_accuracy: 92.5, loss: 0.29, val_loss: 0.27 },
    { epoch: 20, accuracy: 94.6, val_accuracy: 94.8, loss: 0.19, val_loss: 0.21 },
    { epoch: 25, accuracy: 96.8, val_accuracy: 95.9, loss: 0.12, val_loss: 0.18 },
    { epoch: 30, accuracy: 98.2, val_accuracy: 96.2, loss: 0.08, val_loss: 0.16 },
  ];

  // Confusion matrix layout data
  const classes = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary'];
  const confusionMatrix = [
    [94, 3, 2, 1], // Glioma predicted as G, M, N, P
    [2, 92, 4, 2], // Meningioma
    [1, 1, 98, 0], // No Tumor
    [1, 2, 0, 97], // Pituitary
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Model Accuracy</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '5px', color: 'var(--accent-cyan)' }}>96.2%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Validation Set (n=400 scans)</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Precision Rating</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '5px', color: 'var(--accent-purple)' }}>95.8%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>False positive rate: ~2.1%</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-indigo)' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recall (Sensitivity)</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '5px', color: 'var(--accent-indigo)' }}>96.0%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Tumor detection rate</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>F1 score</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '5px', color: '#10b981' }}>95.9%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Harmonic mean of indicators</div>
        </div>
      </div>

      {/* Curves & Matrices Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '2rem'
      }}>
        
        {/* Learning Curves Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiActivity style={{ color: 'var(--accent-cyan)' }} />
            Training Progress (Accuracy Curve)
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottomRight', offset: -5, fill: 'var(--text-muted)' }} stroke="var(--text-muted)" />
                <YAxis label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="accuracy" name="Training Accuracy" stroke="var(--accent-cyan)" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="val_accuracy" name="Validation Accuracy" stroke="var(--accent-purple)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix Visual */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiGrid style={{ color: 'var(--accent-indigo)' }} />
            Confusion Matrix (Validation Results)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '10px' }}>
              <div style={{ width: '25%', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pred Glioma</div>
              <div style={{ width: '25%', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pred Menin</div>
              <div style={{ width: '25%', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pred NoTum</div>
              <div style={{ width: '25%', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pred Pitui</div>
            </div>
            
            {classes.map((className, rowIdx) => (
              <div key={className} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {/* Row Label */}
                <div style={{ width: '22%', fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  True {className}
                </div>
                {/* Cells */}
                <div style={{ display: 'flex', width: '78%', gap: '6px' }}>
                  {confusionMatrix[rowIdx].map((val, colIdx) => {
                    const isDiagonal = rowIdx === colIdx;
                    // Calculate intensity background color based on percentage
                    const alpha = val / 100 * 0.4 + 0.05;
                    const bgColor = isDiagonal 
                      ? `rgba(6, 182, 212, ${alpha})`
                      : `rgba(239, 68, 68, ${alpha})`;
                    const textColor = isDiagonal ? '#22d3ee' : '#f87171';
                    
                    return (
                      <div 
                        key={colIdx} 
                        style={{
                          width: '25%',
                          padding: '16px 0',
                          textAlign: 'center',
                          borderRadius: '6px',
                          background: bgColor,
                          color: textColor,
                          fontWeight: isDiagonal ? 700 : 400,
                          fontSize: '0.95rem',
                          border: isDiagonal ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(239, 68, 68, 0.08)'
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
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiSliders style={{ color: 'var(--accent-purple)' }} />
          Clinical CNN Model Architecture specifications
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          fontSize: '0.9rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>TensorFlow Framework</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>Keras Engine v2.21.0</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Input Image Dimension</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>150 × 150 × 3 (RGB)</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Neural Layers Count</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>12 (Convolutional + Dense)</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Optimization Parameters</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>Adam (lr = 0.001)</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Loss Function Type</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>Categorical Cross-Entropy</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Trainable Params</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>1.28 Million Weights</div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ModelMetrics;
