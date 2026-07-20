import React from 'react';
import { motion } from 'framer-motion';

const BrainLogo = ({ size = 40, className = '', showText = false, collapsed = false }) => {
  return (
    <div className={`brain-logo-wrap ${className}`} style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12 }}>
      <motion.div
        style={{ width: size, height: size, flexShrink: 0 }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="NeuroDX AI Logo"
          role="img"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F4C81" />
              <stop offset="50%" stopColor="#00B8D9" />
              <stop offset="100%" stopColor="#00C389" />
            </linearGradient>
            <linearGradient id="crossGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C389" />
              <stop offset="100%" stopColor="#0F4C81" />
            </linearGradient>
            <radialGradient id="glowG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0F4C81" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0F4C81" stopOpacity="0" />
            </radialGradient>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <circle cx="60" cy="60" r="56" fill="url(#glowG)" />
          <circle cx="60" cy="60" r="52" stroke="url(#logoGrad)" strokeWidth="1.5" strokeOpacity="0.2" fill="none" />

          {/* Brain left */}
          <path d="M60 28 C48 28, 35 35, 33 48 C31 57, 36 63, 34 70 C32 78, 39 88, 52 90 C56 90, 58 88, 60 86"
            stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#glow2)" />
          {/* Brain right */}
          <path d="M60 28 C72 28, 85 35, 87 48 C89 57, 84 63, 86 70 C88 78, 81 88, 68 90 C64 90, 62 88, 60 86"
            stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#glow2)" />

          {/* Center line */}
          <line x1="60" y1="30" x2="60" y2="84" stroke="url(#logoGrad)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />

          {/* Brain folds left */}
          <path d="M40 48 C46 46, 52 50, 55 54" stroke="url(#logoGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeOpacity="0.6" />
          <path d="M38 61 C44 59, 50 63, 55 67" stroke="url(#logoGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeOpacity="0.6" />
          <path d="M40 74 C46 72, 51 75, 55 78" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.4" />

          {/* Brain folds right */}
          <path d="M80 48 C74 46, 68 50, 65 54" stroke="url(#logoGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeOpacity="0.6" />
          <path d="M82 61 C76 59, 70 63, 65 67" stroke="url(#logoGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeOpacity="0.6" />
          <path d="M80 74 C74 72, 69 75, 65 78" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.4" />

          {/* Neural nodes */}
          <circle cx="36" cy="44" r="2.2" fill="#0F4C81" opacity="0.7" />
          <circle cx="32" cy="63" r="1.8" fill="#00B8D9" opacity="0.5" />
          <circle cx="84" cy="44" r="2.2" fill="#00B8D9" opacity="0.7" />
          <circle cx="88" cy="63" r="1.8" fill="#0F4C81" opacity="0.5" />

          {/* Circuit lines */}
          <line x1="36" y1="44" x2="26" y2="38" stroke="#0F4C81" strokeWidth="0.8" opacity="0.25" />
          <line x1="84" y1="44" x2="94" y2="38" stroke="#00B8D9" strokeWidth="0.8" opacity="0.25" />
          <circle cx="26" cy="38" r="1.3" fill="#0F4C81" opacity="0.35" />
          <circle cx="94" cy="38" r="1.3" fill="#00B8D9" opacity="0.35" />

          {/* Medical cross */}
          <g transform="translate(88, 84)">
            <rect x="-3.5" y="-9" width="7" height="18" rx="2" fill="url(#crossGrad2)" opacity="0.75" />
            <rect x="-9" y="-3.5" width="18" height="7" rx="2" fill="url(#crossGrad2)" opacity="0.75" />
          </g>

          {/* Pulse ring */}
          <motion.circle cx="60" cy="58" r="20" stroke="#0F4C81" strokeWidth="0.6" fill="none"
            initial={{ r: 16, opacity: 0.25 }}
            animate={{ r: 30, opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

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
