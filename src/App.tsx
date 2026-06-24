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

function AppRoutes() {
  const { user, onboarding } = useApp()

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/landingpage" replace />
          )
        } />
        <Route path="/landingpage" element={
          user.isLoggedIn ? (
            onboarding.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />
          ) : (
            <LandingPage />
          )
        } />
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
            onboarding.onboardingCompleted ? <Dashboard /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
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
