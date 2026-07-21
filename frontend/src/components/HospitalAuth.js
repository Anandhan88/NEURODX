import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  User,
  ShieldCheck,
  Brain,
  ScanLine,
  Activity,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  LogIn,
  UserPlus,
  FileText,
  Dna,
  Heart,
  Stethoscope
} from 'lucide-react';
import BrainLogo from './BrainLogo';
import './Auth.css';

/* ---- Animation variants ---- */
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const leftPanelVariants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const rightPanelVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 } }
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
};

const featureVariants = {
  initial: { opacity: 0, x: -16 },
  animate: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.1 }
  })
};

/* ---- Password strength calculator ---- */
function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', class: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', class: 'weak' };
  if (score === 2) return { level: 2, label: 'Fair', class: 'fair' };
  if (score === 3) return { level: 3, label: 'Good', class: 'good' };
  return { level: 4, label: 'Strong', class: 'strong' };
}

/* ---- Feature data ---- */
const features = [
  {
    icon: <ShieldCheck size={18} />,
    colorClass: 'green',
    title: 'Secure Hospital Login',
    desc: 'End-to-end encrypted clinical access'
  },
  {
    icon: <Brain size={18} />,
    colorClass: 'blue',
    title: 'AI Tumor Classification',
    desc: 'CNN-powered multi-class detection'
  },
  {
    icon: <ScanLine size={18} />,
    colorClass: 'teal',
    title: 'Accurate MRI Analysis',
    desc: '96%+ classification accuracy'
  }
];

/* ---- Department options ---- */
const departments = [
  'Radiology',
  'Neurology',
  'Neurosurgery',
  'General Hospital'
];

/* ============================================================
   HospitalAuth Component
   ============================================================ */
function HospitalAuth({ onAuthSuccess, onBackToLanding }) {
  /* ---- Form state ---- */
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /* Login fields */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  /* Registration fields */
  const [hospitalName, setHospitalName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [medRegNumber, setMedRegNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  /* Validation */
  const [touched, setTouched] = useState({});

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  /* ---- Handlers ---- */
  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setMessage('');
    setSuccess(false);
    setTouched({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    /* Registration validation */
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (!acceptTerms) {
        setError('Please accept the terms and conditions.');
        setLoading(false);
        return;
      }
    }
    const API_URL = "http://localhost:5000";
    const endpoint = isLogin ? 'login' : 'signup';
    const payload = { email, password };

    if (!isLogin) {
      payload.hospital_name = hospitalName;
      payload.doctor_name = doctorName || hospitalName;
      payload.phone_number = phoneNumber;
      payload.role = 'hospital';
    }

    try {
      const res = await axios.post(`${API_URL}/${endpoint}`, payload);
      if (res.status === 200) {
        if (isLogin) {
          setSuccess(true);
          setTimeout(() => onAuthSuccess(email), 800);
        } else {
          setMessage('Account created successfully! Please log in.');
          setSuccess(true);
          setTimeout(() => {
            setIsLogin(true);
            setHospitalName('');
            setDoctorName('');
            setPhoneNumber('');
            setDepartment('');
            setMedRegNumber('');
            setPassword('');
            setConfirmPassword('');
            setAcceptTerms(false);
            setSuccess(false);
            setTouched({});
          }, 1200);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        `${isLogin ? 'Login' : 'Registration'} failed. Please check your credentials.`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---- Render ---- */
  return (
    <motion.div
      className="auth-wrapper"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Background floating medical icons */}
      <div className="auth-floating-elements" aria-hidden="true">
        <div className="auth-floating-el"><Brain size={32} /></div>
        <div className="auth-floating-el"><Dna size={28} /></div>
        <div className="auth-floating-el"><Activity size={24} /></div>
        <div className="auth-floating-el"><Heart size={22} /></div>
        <div className="auth-floating-el"><Stethoscope size={26} /></div>
      </div>

      {/* Background pattern */}
      <div className="auth-bg-pattern" aria-hidden="true">
        <svg className="bg-grid" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="authGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0F4C81" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#authGrid)" />
        </svg>
      </div>

      {/* ---- Main Card ---- */}
      <div className="auth-content">

        {/* ==== LEFT PANEL — Hero ==== */}
        <motion.div className="auth-hero-panel" variants={leftPanelVariants}>
          {/* Back button */}
          <motion.button
            className="auth-back-btn"
            onClick={onBackToLanding}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Back to home"
          >
            <ArrowLeft size={15} /> Back
          </motion.button>

          {/* Branding */}
          <motion.div className="auth-branding" variants={itemVariants}>
            <BrainLogo size={50} />
            <div className="auth-brand-text">
              <h1>Brain Tumor Detection</h1>
              <p>AI Powered MRI Analysis Platform</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div className="auth-hero-headline" variants={itemVariants}>
            <h2>
              Early Detection{' '}
              <span className="highlight">Saves Lives</span>
            </h2>
          </motion.div>

          <motion.p className="auth-hero-description" variants={itemVariants}>
            Upload MRI scans and receive AI-assisted brain tumor predictions
            within seconds. Trusted by hospitals and radiologists worldwide.
          </motion.p>

          {/* Feature cards */}
          <div className="auth-features">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="auth-feature-card"
                custom={i}
                variants={featureVariants}
                initial="initial"
                animate="animate"
                whileHover={{ x: 4 }}
              >
                <div className={`auth-feature-icon ${f.colorClass}`}>{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ==== RIGHT PANEL — Form ==== */}
        <motion.div className="auth-form-panel" variants={rightPanelVariants}>

          {/* Mobile-only branding */}
          <div className="auth-mobile-brand">
            <BrainLogo size={40} />
            <div className="auth-brand-text">
              <h1 style={{ fontSize: '1rem' }}>Brain Tumor Detection</h1>
              <p style={{ fontSize: '0.65rem' }}>AI Powered MRI Analysis</p>
            </div>
          </div>

          {/* Form header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login-header' : 'reg-header'}
              className="auth-form-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <h2>{isLogin ? 'Welcome Back' : 'Hospital Registration'}</h2>
              <p>
                {isLogin
                  ? 'Sign in to continue your medical analysis dashboard.'
                  : 'Create your hospital account to access AI diagnostics.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Status messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                className="auth-msg success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CheckCircle2 size={16} /> {message}
              </motion.div>
            )}
            {error && (
              <motion.div
                className="auth-msg error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- FORM ---- */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login-form' : 'register-form'}
              className="auth-form"
              onSubmit={handleSubmit}
              autoComplete="off"
              data-lpignore="true"
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Fake hidden inputs to trick Chrome password manager */}
              <input type="text" name="prevent_autofill_username" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
              <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

              {/* ---- LOGIN FORM ---- */}
              {isLogin ? (
                <>
                  {/* Email */}
                  <div className="auth-input-group">
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon"><Mail size={17} /></span>
                      <input
                        type="text"
                        inputMode="email"
                        id="login-email"
                        name="user_login_identifier"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        required
                        disabled={loading}
                        autoComplete="new-password"
                        data-lpignore="true"
                        aria-label="Email Address"
                      />
                      <label htmlFor="login-email" className="auth-input-label">Email Address</label>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="auth-input-group">
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon"><Lock size={17} /></span>
                      <input
                        type="text"
                        id="login-password"
                        name="user_login_secret"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        required
                        disabled={loading}
                        autoComplete="new-password"
                        data-lpignore="true"
                        style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                        aria-label="Password"
                      />
                      <label htmlFor="login-password" className="auth-input-label">Password</label>
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me + Forgot */}
                  <div className="auth-options-row">
                    <label className="auth-remember-me">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        aria-label="Remember me"
                      />
                      Remember me
                    </label>
                    <button type="button" className="auth-forgot-link">Forgot Password?</button>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || success}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <div className="auth-spinner" />
                    ) : success ? (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Authenticated</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        <span>Sign In</span>
                      </>
                    )}
                  </motion.button>

                  {/* Divider */}
                  <div className="auth-divider">
                    <div className="auth-divider-line" />
                    <span className="auth-divider-text">OR</span>
                    <div className="auth-divider-line" />
                  </div>

                  {/* Switch to register */}
                  <div className="auth-switch-mode">
                    Don't have an account?
                    <button type="button" className="auth-switch-link" onClick={switchMode}>
                      Create Hospital Account
                    </button>
                  </div>
                </>
              ) : (
                /* ---- REGISTRATION FORM ---- */
                <>
                  {/* Hospital Name + Doctor Name row */}
                  <div className="auth-form-row">
                    <div className="auth-input-group">
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon"><Building2 size={17} /></span>
                        <input
                          type="text"
                          id="reg-hospital"
                          name="reg_hospital_field"
                          value={hospitalName}
                          onChange={(e) => setHospitalName(e.target.value)}
                          placeholder="hospital"
                          required
                          disabled={loading}
                          autoComplete="new-password"
                          data-lpignore="true"
                          aria-label="Hospital or Clinic Name"
                        />
                        <label htmlFor="reg-hospital" className="auth-input-label">Hospital / Clinic Name</label>
                      </div>
                    </div>

                    <div className="auth-input-group">
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon"><User size={17} /></span>
                        <input
                          type="text"
                          id="reg-doctor"
                          name="reg_doctor_field"
                          value={doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                          placeholder="doctor"
                          required
                          disabled={loading}
                          autoComplete="new-password"
                          data-lpignore="true"
                          aria-label="Doctor Name"
                        />
                        <label htmlFor="reg-doctor" className="auth-input-label">Doctor Name</label>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="auth-input-group">
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon"><Mail size={17} /></span>
                      <input
                        type="text"
                        inputMode="email"
                        id="reg-email"
                        name="reg_email_field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        required
                        disabled={loading}
                        autoComplete="new-password"
                        data-lpignore="true"
                        aria-label="Official Email Address"
                      />
                      <label htmlFor="reg-email" className="auth-input-label">Official Email Address</label>
                    </div>
                  </div>

                  {/* Phone + Department row */}
                  <div className="auth-form-row">
                    <div className="auth-input-group">
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon"><Phone size={17} /></span>
                        <input
                          type="tel"
                          id="reg-phone"
                          name="reg_phone_field"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="phone"
                          required
                          disabled={loading}
                          autoComplete="new-password"
                          data-lpignore="true"
                          aria-label="Phone Number"
                        />
                        <label htmlFor="reg-phone" className="auth-input-label">Phone Number</label>
                      </div>
                    </div>

                    <div className="auth-input-group">
                      <div className={`auth-input-wrapper ${department ? 'has-value' : ''}`}>
                        <span className="auth-input-icon"><Activity size={17} /></span>
                        <select
                          id="reg-department"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          required
                          disabled={loading}
                          aria-label="Department"
                        >
                          <option value="">Select department</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <label htmlFor="reg-department" className="auth-input-label">Department</label>
                        <span className="auth-select-arrow"><ChevronDown size={16} /></span>
                      </div>
                    </div>
                  </div>

                  {/* Medical Registration Number (optional) */}
                  <div className="auth-input-group">
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon"><FileText size={17} /></span>
                      <input
                        type="text"
                        id="reg-medreg"
                        name="reg_medreg_field"
                        value={medRegNumber}
                        onChange={(e) => setMedRegNumber(e.target.value)}
                        placeholder="medreg"
                        disabled={loading}
                        autoComplete="new-password"
                        data-lpignore="true"
                        aria-label="Medical Registration Number (Optional)"
                      />
                      <label htmlFor="reg-medreg" className="auth-input-label">Medical Reg. Number (Optional)</label>
                    </div>
                  </div>

                  {/* Password + Confirm row */}
                  <div className="auth-form-row">
                    <div className="auth-input-group">
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon"><Lock size={17} /></span>
                        <input
                          type="text"
                          id="reg-password"
                          name="reg_password_field"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => markTouched('password')}
                          placeholder="password"
                          required
                          disabled={loading}
                          autoComplete="new-password"
                          data-lpignore="true"
                          style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                          aria-label="Password"
                        />
                        <label htmlFor="reg-password" className="auth-input-label">Password</label>
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {/* Password strength meter */}
                      {password && (
                        <>
                          <div className="auth-password-strength">
                            {[1, 2, 3, 4].map((n) => (
                              <div
                                key={n}
                                className={`auth-strength-bar ${n <= passwordStrength.level ? `active ${passwordStrength.class}` : ''}`}
                              />
                            ))}
                          </div>
                          <div className={`auth-strength-label ${passwordStrength.class}`}>
                            {passwordStrength.label}
                          </div>
                        </>
                      )}
                    </div>

                    <div className={`auth-input-group ${passwordsMismatch && touched.confirmPassword ? 'error' : ''} ${passwordsMatch ? 'success' : ''}`}>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon"><Lock size={17} /></span>
                        <input
                          type="text"
                          id="reg-confirm-password"
                          name="reg_confirm_password_field"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => markTouched('confirmPassword')}
                          placeholder="confirm"
                          required
                          disabled={loading}
                          autoComplete="new-password"
                          data-lpignore="true"
                          style={{ WebkitTextSecurity: showConfirmPassword ? 'none' : 'disc' }}
                          aria-label="Confirm Password"
                        />
                        <label htmlFor="reg-confirm-password" className="auth-input-label">Confirm Password</label>
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {passwordsMatch && (
                        <span className="auth-validation-msg success">
                          <CheckCircle2 size={13} /> Passwords match
                        </span>
                      )}
                      {passwordsMismatch && touched.confirmPassword && (
                        <span className="auth-validation-msg error">
                          <AlertCircle size={13} /> Passwords don't match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="auth-terms-check">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                      aria-label="Accept terms and conditions"
                    />
                    <span>
                      I agree to the{' '}
                      <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>{' '}
                      and{' '}
                      <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                    </span>
                  </label>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || success}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <div className="auth-spinner" />
                    ) : success ? (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Account Created</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Create Account</span>
                      </>
                    )}
                  </motion.button>

                  {/* Switch to login */}
                  <div className="auth-switch-mode">
                    Already have an account?
                    <button type="button" className="auth-switch-link" onClick={switchMode}>
                      Login here
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          </AnimatePresence>

          {/* Footer */}
          <div className="auth-footer">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <span className="auth-footer-dot" />
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>
            <span className="auth-footer-dot" />
            <a href="#support" onClick={(e) => e.preventDefault()}>Support</a>
            <span className="auth-footer-dot" />
            <span>v1.0.0</span>
            <div className="auth-copyright">
              © 2026 Brain Tumor Detection AI. All rights reserved.
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}

export default HospitalAuth;
