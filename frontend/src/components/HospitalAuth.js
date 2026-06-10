import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import img2 from '../assets/img2.png';
import { FiArrowLeft, FiLock, FiPhone, FiHome } from 'react-icons/fi';

function HospitalAuth({ onAuthSuccess, onBackToLanding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    const endpoint = isLogin ? 'login' : 'signup';
    const payload = {
      email: email,
      password: password,
    };

    if (!isLogin) {
      payload.hospital_name = hospitalName;
      payload.phone_number = phoneNumber;
    }

    try {
      const res = await axios.post(`/${endpoint}`, payload);

      if (res.status === 200) {
        if (isLogin) {
          onAuthSuccess(email);
        } else {
          setMessage('Client registered! Please log in.');
          setIsLogin(true);
          setHospitalName('');
          setPhoneNumber('');
          setPassword('');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || `${isLogin ? 'Login' : 'Signup'} failed. Please check credentials.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-content">
        
        {/* Left Side: Brand Visual Card */}
        <div className="auth-image">
          <button 
            onClick={onBackToLanding}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 500,
              zIndex: 3
            }}
          >
            <FiArrowLeft /> Back to Home
          </button>

          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', marginTop: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
              NEURO<span style={{ color: 'var(--accent-cyan)' }}>DX</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Secure Clinical Entry Portal
            </p>
          </div>
          
          <img src={img2} alt="AI Diagnostics Logo" style={{ marginTop: '2rem', maxHeight: '160px', opacity: 0.85 }} />
        </div>

        {/* Right Side: Form Card */}
        <div className="auth-card">
          <h2>{isLogin ? 'Client Portal Login' : 'Register Client'}</h2>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@client.com"
                required
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="hospitalName">Hospital / Clinic Name</label>
                  <input
                    type="text"
                    id="hospitalName"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. St. Mary Neurology Clinic"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="phoneNumber">Client Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="password">Security Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying Credentials...' : isLogin ? 'Access Portal' : 'Register Client'}
            </button>

            {message && <p className="success-msg">{message}</p>}
            {error && <p className="error-msg">{error}</p>}
          </form>

          <div className="switch-auth">
            {isLogin ? (
              <>
                Client not registered?{' '}
                <span onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}>
                  Register here
                </span>
              </>
            ) : (
              <>
                Client already registered?{' '}
                <span onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}>
                  Login here
                </span>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default HospitalAuth;
