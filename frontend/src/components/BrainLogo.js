import React from 'react';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.png';

const BrainLogo = ({ size = 40, className = '', showText = false, collapsed = false }) => {
  return (
    <div className={`brain-logo-wrap ${className}`} style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12 }}>
      <motion.img
        src={logoImg}
        alt="NeuroDX AI Logo"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          flexShrink: 0,
          borderRadius: '8px'
        }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {showText && !collapsed && (
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            Neuro<span style={{ color: 'var(--primary)' }}>DX</span>{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>AI</span>
          </div>
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginTop: 1
          }}>
            Brain Tumor Detection
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainLogo;
