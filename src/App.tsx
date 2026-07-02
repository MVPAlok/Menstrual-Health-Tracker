import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Lenis from 'lenis'
import LandingPage from './LandingPage'
import { AppProvider, useApp } from './context/AppContext'
import {
  WelcomeScreen,
  LoginScreen,
  SignUpScreen,
  SuccessScreen,
} from './components/AuthFlow'
import { OnboardingFlow } from './components/OnboardingFlow'
import { Dashboard } from './components/Dashboard'
import { PrivacyPage, TermsPage, ContactPage } from './components/Legal'
import { NotFound } from './components/NotFound'

function AppRoutes() {
  const { user, onboarding } = useApp()

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage scrollTarget="about" />} />
        <Route path="/features" element={<LandingPage scrollTarget="experience" />} />
        
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/welcome" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />
          ) : (
            <WelcomeScreen />
          )
        } />
        <Route path="/login" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />
          ) : (
            <LoginScreen />
          )
        } />
        <Route path="/signup" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />
          ) : (
            <SignUpScreen />
          )
        } />
        <Route path="/auth-success" element={
          user.isLoggedIn ? <SuccessScreen /> : <Navigate to="/welcome" replace />
        } />
        <Route path="/onboarding" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <OnboardingFlow />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="/dashboard" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Dashboard initialTab="home" /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="/calendar" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Dashboard initialTab="calendar" /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="/prediction-lab" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Dashboard initialTab="lab" /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="/logger" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Dashboard initialTab="log" /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="/insights" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Dashboard initialTab="insights" /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="/profile" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Dashboard initialTab="profile" /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  )
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })
    
    // Expose lenis instance globally for custom smooth scrolling
    ;(window as any).lenis = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      delete (window as any).lenis
    }
  }, [])

  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}

export default App
