import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BackgroundShader } from './BackgroundShader';
import { useApp } from '../context/AppContext';

// Simple container for glass auth card layout
const AuthContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <BackgroundShader canvasId="auth-shader-canvas" />
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-0 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 glass-card p-8 md:p-10 rounded-[2.5rem] border border-white/70 shadow-[0_32px_80px_rgba(165,53,86,0.08)]"
      >
        {children}
      </motion.div>
    </div>
  );
};

/* ═══════════════ WELCOME SCREEN ═══════════════ */
export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthContainer>
      <div className="text-center">
        {/* Animated Brand Orb */}
        <div className="flex justify-center mb-8 relative">
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/60 to-primary-container/80 blur-[8px] absolute"
            animate={{ scale: [1, 1.15, 1], rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-24 h-24 rounded-full bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center relative z-10 shadow-inner">
            <span className="material-symbols-outlined text-[42px] text-primary">spa</span>
          </div>
        </div>

        <h1 className="font-headline-lg text-headline-lg text-primary mb-3">
          Understand Your Rhythm.
        </h1>
        <p className="font-body-md text-secondary mb-10 text-center leading-relaxed">
          Create your personal cycle intelligence profile and begin understanding your body through data, patterns, and insights.
        </p>

        <div className="flex flex-col gap-4">
          <motion.button
            onClick={() => navigate('/signup')}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20"
            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
            whileTap={{ scale: 0.98 }}
          >
            Create Account
          </motion.button>
          <motion.button
            onClick={() => navigate('/login')}
            className="w-full bg-white/60 hover:bg-white/80 border border-white/80 py-4 rounded-full font-bold text-sm tracking-wide text-primary shadow-sm"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
        </div>
      </div>
    </AuthContainer>
  );
};

/* ═══════════════ LOGIN SCREEN ═══════════════ */
export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    // Simulate login
    loginUser('Elena Ross', email);
    // Directly routing to dashboard for returning users
    navigate('/dashboard');
  };

  return (
    <AuthContainer>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 border border-white/80 text-primary"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="font-extrabold text-lg text-primary tracking-tight">LunaCare</span>
      </div>

      <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Welcome Back</h2>
      <p className="text-secondary font-body-md mb-8">Sign in to sync your rhythm parameters.</p>

      {error && (
        <div className="bg-error-container text-on-error-container p-3 rounded-2xl mb-5 text-sm font-medium border border-error/10">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-5 py-3.5 rounded-full text-on-surface text-sm transition-all focus:outline-none"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 ml-1">
            <label className="block text-xs font-bold text-primary tracking-wider uppercase">Password</label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Forgot?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-5 py-3.5 rounded-full text-on-surface text-sm transition-all focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between mt-1 mb-2 ml-1">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-secondary font-medium select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-outline/30 text-primary focus:ring-primary/20 bg-white/50"
            />
            Remember me
          </label>
        </div>

        <motion.button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 mt-2"
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
          whileTap={{ scale: 0.98 }}
        >
          Sign In
        </motion.button>
      </form>

      {/* Social Login Separator */}
      <div className="relative my-8 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline/10"></div>
        </div>
        <span className="relative bg-transparent px-4 text-xs font-bold uppercase tracking-widest text-outline-variant">
          Or continue with
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={() => {
            loginUser('Google Wellness', 'google@lunacare.com');
            navigate('/dashboard');
          }}
          className="flex items-center justify-center gap-2 py-3 bg-white/50 border border-white hover:bg-white/80 rounded-full text-secondary font-bold text-xs tracking-wider"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Simple premium mock Google icon */}
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Google
        </motion.button>
        <motion.button
          onClick={() => {
            loginUser('Apple Intelligence', 'apple@lunacare.com');
            navigate('/dashboard');
          }}
          className="flex items-center justify-center gap-2 py-3 bg-white/50 border border-white hover:bg-white/80 rounded-full text-secondary font-bold text-xs tracking-wider"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800" /> Apple
        </motion.button>
      </div>

      <div className="mt-8 text-center text-sm text-secondary font-medium">
        Don't have an account?{' '}
        <button onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline">
          Sign up
        </button>
      </div>
    </AuthContainer>
  );
};

/* ═══════════════ SIGN UP SCREEN ═══════════════ */
export const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms of Service.');
      return;
    }
    // Success: Mock user setup and route to success screen
    loginUser(name, email);
    navigate('/auth-success');
  };

  return (
    <AuthContainer>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 border border-white/80 text-primary"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="font-extrabold text-lg text-primary tracking-tight">LunaCare</span>
      </div>

      <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Create Sanctuary</h2>
      <p className="text-secondary font-body-md mb-6">Begin your personal cycle intelligence profile.</p>

      {error && (
        <div className="bg-error-container text-on-error-container p-3 rounded-2xl mb-4 text-sm font-medium border border-error/10">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
        <div>
          <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-5 py-3 rounded-full text-on-surface text-sm focus:outline-none transition-all"
            placeholder="Elena Ross"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-5 py-3 rounded-full text-on-surface text-sm focus:outline-none transition-all"
            placeholder="elena@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-5 py-3 rounded-full text-on-surface text-sm focus:outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-5 py-3 rounded-full text-on-surface text-sm focus:outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-start gap-2.5 mt-2 mb-3 ml-1 select-none">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-outline/30 text-primary focus:ring-primary/20 bg-white/50 cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-secondary leading-normal cursor-pointer">
            I accept the{' '}
            <a href="#terms" className="text-primary font-bold hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#privacy" className="text-primary font-bold hover:underline">
              Privacy Sanctuary Policy
            </a>.
          </label>
        </div>

        <motion.button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20"
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
          whileTap={{ scale: 0.98 }}
        >
          Create My Profile
        </motion.button>
      </form>

      <div className="mt-6 text-center text-sm text-secondary font-medium">
        Already have an account?{' '}
        <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
          Sign In
        </button>
      </div>
    </AuthContainer>
  );
};

/* ═══════════════ FORGOT PASSWORD SCREEN ═══════════════ */
export const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSuccess(true);
  };

  return (
    <AuthContainer>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 border border-white/80 text-primary"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="font-extrabold text-lg text-primary tracking-tight">LunaCare</span>
      </div>

      {!success ? (
        <>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Reset Shift</h2>
          <p className="text-secondary font-body-md mb-8 leading-relaxed">
            Enter your sanctuary email. We will dispatch a recovery signal to synchronize your account coordinates.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-5 py-3.5 rounded-full text-on-surface text-sm focus:outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>

            <motion.button
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20"
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
              whileTap={{ scale: 0.98 }}
            >
              Send Reset Link
            </motion.button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
            </div>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary mb-3">Signal Dispatched</h2>
          <p className="text-secondary font-body-md mb-8 leading-relaxed">
            We have sent a verification key to <span className="font-bold text-primary">{email}</span>. Click the link inside to restore synchronization.
          </p>
          <motion.button
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Sign In
          </motion.button>
        </div>
      )}
    </AuthContainer>
  );
};

/* ═══════════════ VERIFICATION SCREEN ═══════════════ */
export const VerificationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  const handleChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newCode = [...code];
    newCode[index] = val.substring(val.length - 1);
    setCode(newCode);

    // Auto-focus next field
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    // Simulate successful code verification
    navigate('/auth-success');
  };

  return (
    <AuthContainer>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/signup')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 border border-white/80 text-primary"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="font-extrabold text-lg text-primary tracking-tight">LunaCare</span>
      </div>

      <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Verify Account</h2>
      <p className="text-secondary font-body-md mb-8 leading-relaxed">
        We sent a 6-digit synchronization key to <span className="font-bold text-primary">{user.email || 'your email'}</span>.
      </p>

      {error && (
        <div className="bg-error-container text-on-error-container p-3 rounded-2xl mb-5 text-sm font-medium border border-error/10">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="flex flex-col gap-6">
        <div className="flex justify-between gap-2.5">
          {code.map((num, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={1}
              value={num}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 md:w-14 md:h-16 text-center text-xl font-bold bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-2xl text-on-surface focus:outline-none transition-all"
            />
          ))}
        </div>

        <motion.button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 mt-4"
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
          whileTap={{ scale: 0.98 }}
        >
          Verify
        </motion.button>
      </form>

      <div className="mt-8 text-center text-sm text-secondary font-medium">
        Didn't receive the code?{' '}
        <button onClick={() => setCode(['', '', '', '', '', ''])} className="text-primary font-bold hover:underline">
          Resend Key
        </button>
      </div>
    </AuthContainer>
  );
};

/* ═══════════════ SUCCESS STATE SCREEN ═══════════════ */
export const SuccessScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  return (
    <AuthContainer>
      <div className="text-center py-4">
        {/* Soft Success Animation Rings */}
        <div className="flex justify-center mb-8 relative">
          <motion.div
            className="w-20 h-20 rounded-full border border-primary/20 absolute"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="w-20 h-20 rounded-full border-2 border-primary/30 absolute"
            animate={{ scale: [1.2, 1.7, 1.2], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary relative z-10">
            <span className="material-symbols-outlined text-[36px] text-primary">verified</span>
          </div>
        </div>

        <h2 className="font-headline-lg text-headline-lg text-primary mb-3">Sanctuary Connected</h2>
        <p className="text-secondary font-body-md mb-4 leading-relaxed">
          Welcome, <span className="font-bold text-primary">{user.name || 'Elena'}</span>. Your secure intelligence channel is now fully online.
        </p>
        <p className="text-outline font-body-md mb-10 leading-relaxed text-sm">
          Next, let's tailor the predictive neural nets to align with your personal bio-rhythms.
        </p>

        <motion.button
          onClick={() => navigate('/onboarding')}
          className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
          whileTap={{ scale: 0.98 }}
        >
          Let's Personalize
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </motion.button>
      </div>
    </AuthContainer>
  );
};
