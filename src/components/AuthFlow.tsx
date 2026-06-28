import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
        className="w-full max-w-md relative z-10 glass-card p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/70 shadow-[0_32px_80px_rgba(165,53,86,0.08)]"
      >
        {children}
      </motion.div>
    </div>
  );
};

/* ═══════════════ WELCOME SCREEN ═══════════════ */
export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AuthContainer>
      <div className="text-center">
        {/* Animated Brand Orb */}
        <div className="flex justify-center mb-6 sm:mb-8 relative">
          <motion.div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary/60 to-primary-container/80 blur-[8px] absolute"
            animate={{ scale: [1, 1.15, 1], rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center relative z-10 shadow-inner">
            <span className="material-symbols-outlined text-[36px] sm:text-[42px] text-primary">spa</span>
          </div>
        </div>

        <h1 className="font-headline-lg text-2xl sm:text-headline-lg text-primary mb-3">
          {t('auth.welcomeTitle')}
        </h1>
        <p className="text-secondary text-xs sm:text-sm mb-6 sm:mb-10 text-center leading-relaxed">
          {t('auth.welcomeDesc')}
        </p>

        <div className="flex flex-col gap-4">
          <motion.button
            onClick={() => navigate('/signup')}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20"
            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
            whileTap={{ scale: 0.98 }}
          >
            {t('auth.createAccount')}
          </motion.button>
          <motion.button
            onClick={() => navigate('/login')}
            className="w-full bg-white/60 hover:bg-white/80 border border-white/80 py-4 rounded-full font-bold text-sm tracking-wide text-primary shadow-sm"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('auth.signIn')}
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
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !password) {
      setError(t('auth.errorFillFields'));
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await loginUser(firstName, lastName, password);
      if (res.onboarding && res.onboarding.onboardingCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || t('auth.errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <div className="mb-4 sm:mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/40 border border-white/80 text-primary"
        >
          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_back</span>
        </button>
        <span className="font-extrabold text-base sm:text-lg text-primary tracking-tight">LunaCare</span>
      </div>

      <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-primary mb-1 sm:mb-2">{t('auth.welcomeBack')}</h2>
      <p className="text-secondary text-xs sm:text-sm mb-5 sm:mb-8">{t('auth.signInSubtitle')}</p>

      {error && (
        <div className="bg-error-container text-on-error-container p-2.5 sm:p-3 rounded-2xl mb-4 sm:mb-5 text-xs sm:text-sm font-medium border border-error/10">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase mb-1.5 sm:mb-2 ml-1">{t('auth.firstName')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-2.5 rounded-full text-on-surface text-xs sm:text-sm focus:outline-none transition-all"
              placeholder="Elena"
            />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase mb-1.5 sm:mb-2 ml-1">{t('auth.lastName')}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-2.5 rounded-full text-on-surface text-xs sm:text-sm focus:outline-none transition-all"
              placeholder="Ross"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5 sm:mb-2 ml-1">
            <label className="block text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase">{t('auth.password')}</label>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-full text-on-surface text-xs sm:text-sm transition-all focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between mt-1 mb-1 sm:mb-2 ml-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-secondary font-medium select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-outline/30 text-primary focus:ring-primary/20 bg-white/50"
            />
            {t('auth.rememberMe')}
          </label>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 mt-1 sm:mt-2 disabled:opacity-50"
          whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
          whileTap={loading ? {} : { scale: 0.98 }}
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </motion.button>
      </form>


      <div className="mt-8 text-center text-sm text-secondary font-medium">
        {t('auth.noAccount')}{' '}
        <button onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline">
          {t('auth.signUp')}
        </button>
      </div>
    </AuthContainer>
  );
};

/* ═══════════════ SIGN UP SCREEN ═══════════════ */
export const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useApp();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !password || !confirmPassword) {
      setError(t('auth.errorFillFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errorMatchPasswords'));
      return;
    }
    if (!termsAccepted) {
      setError(t('auth.errorAcceptTerms'));
      return;
    }
    try {
      setLoading(true);
      setError('');
      await registerUser(firstName, lastName, password);
      // Auto-logged in, navigate directly to success screen
      navigate('/auth-success');
    } catch (err: any) {
      setError(err.message || t('auth.errorRegistration'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <div className="mb-4 sm:mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/40 border border-white/80 text-primary"
        >
          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_back</span>
        </button>
        <span className="font-extrabold text-base sm:text-lg text-primary tracking-tight">LunaCare</span>
      </div>

      <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-primary mb-1 sm:mb-2">{t('auth.createSanctuary')}</h2>
      <p className="text-secondary text-xs sm:text-sm mb-4 sm:mb-6">{t('auth.signUpSubtitle')}</p>

      {error && (
        <div className="bg-error-container text-on-error-container p-2.5 sm:p-3 rounded-2xl mb-4 text-xs sm:text-sm font-medium border border-error/10">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">{t('auth.firstName')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-on-surface text-xs sm:text-sm focus:outline-none transition-all"
              placeholder="Elena"
            />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">{t('auth.lastName')}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-on-surface text-xs sm:text-sm focus:outline-none transition-all"
              placeholder="Ross"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">{t('auth.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-on-surface text-xs sm:text-sm focus:outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase mb-1.5 ml-1">{t('auth.confirmPassword')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-on-surface text-xs sm:text-sm focus:outline-none transition-all"
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
            {t('auth.acceptTerms')}{' '}
            <a href="#terms" className="text-primary font-bold hover:underline">
              {t('auth.termsOfService')}
            </a>{' '}
            {t('auth.and')}{' '}
            <a href="#privacy" className="text-primary font-bold hover:underline">
              {t('auth.privacyPolicy')}
            </a>.
          </label>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 disabled:opacity-50"
          whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
          whileTap={loading ? {} : { scale: 0.98 }}
        >
          {loading ? t('auth.creatingProfile') : t('auth.createMyProfile')}
        </motion.button>
      </form>

      <div className="mt-6 text-center text-sm text-secondary font-medium">
        {t('auth.hasAccount')}{' '}
        <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
          {t('auth.signIn')}
        </button>
      </div>
    </AuthContainer>
  );
};

/* ═══════════════ SUCCESS STATE SCREEN ═══════════════ */
export const SuccessScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const { t } = useTranslation();

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

        <h2 className="font-headline-lg text-headline-lg text-primary mb-3">{t('auth.successTitle')}</h2>
        <p className="text-secondary font-body-md mb-4 leading-relaxed">
          {t('auth.successDesc', { name: user.name || 'Elena' })}
        </p>
        <p className="text-outline font-body-md mb-10 leading-relaxed text-sm">
          {t('auth.successSub')}
        </p>

        <motion.button
          onClick={() => navigate('/onboarding')}
          className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
          whileTap={{ scale: 0.98 }}
        >
          {t('auth.letPersonalize')}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </motion.button>
      </div>
    </AuthContainer>
  );
};
