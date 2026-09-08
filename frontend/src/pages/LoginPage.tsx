import { useState } from 'react'
import { authAPI } from '../api.js'
import Logo from '../components/Logo.js'
import '../styles/login.css'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string | string[] } } }
    const message = axiosError.response?.data?.message
    return Array.isArray(message) ? message[0] : message || ''
  }
  return ''
}

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  onBack?: () => void
}

type Mode = 'signin' | 'register' | 'verify' | 'forgot' | 'reset'

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const runLogin = async (nextEmail: string, nextPassword: string) => {
    setLoading(true)
    setError('')
    try {
      await onLogin(nextEmail, nextPassword)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Login failed. Check the API is running.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setInfo('')
  }

  const handleVerifyOtp = async (purpose = 'REGISTRATION') => {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      await authAPI.verifyOtp(pendingEmail, otpCode, purpose)
      setInfo('Email verified! You can now sign in.')
      setMode('signin')
      setOtpCode('')
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'That code did not work. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (purpose = 'REGISTRATION') => {
    setLoading(true)
    setError('')
    try {
      await authAPI.resendOtp(pendingEmail, purpose)
      setInfo('A new code has been sent to your email.')
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Could not resend the code.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'register') {
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Fill in every field to create an account.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      setLoading(true)
      setError('')
      try {
        await authAPI.register({ fullName, email, password, confirmPassword })
        setPendingEmail(email)
        setMode('verify')
        setInfo('Account created! Enter the 6-digit code we emailed you to activate it.')
      } catch (err: unknown) {
        setError(getErrorMessage(err) || 'Could not create account.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (mode === 'verify') {
      if (!otpCode || otpCode.length !== 6) {
        setError('Enter the 6-digit code from your email.')
        return
      }
      await handleVerifyOtp()
      return
    }

    if (mode === 'forgot') {
      if (!email) {
        setError('Enter the email address for your account.')
        return
      }
      setLoading(true)
      setError('')
      setInfo('')
      try {
        await authAPI.forgotPassword(email)
        setPendingEmail(email)
        setOtpCode('')
        setMode('reset')
        setInfo('A 6-digit reset code was sent to your email. It expires soon.')
      } catch (err: unknown) {
        setError(getErrorMessage(err) || 'Could not send a reset code.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (mode === 'reset') {
      if (!otpCode || otpCode.length !== 6) {
        setError('Enter the 6-digit code from your email.')
        return
      }
      if (password.length < 8) {
        setError('New password must be at least 8 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      setLoading(true)
      setError('')
      setInfo('')
      try {
        await authAPI.resetPassword({
          email: pendingEmail || email,
          otpCode,
          newPassword: password,
          confirmPassword,
        })
        setInfo('Password reset! Sign in with your new password.')
        setMode('signin')
        setOtpCode('')
        setPassword('')
        setConfirmPassword('')
      } catch (err: unknown) {
        setError(getErrorMessage(err) || 'That code did not work. Try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!email || !password) {
      setError('Enter both email and password.')
      return
    }
    await runLogin(email, password)
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Logistics, made visible.</h1>
            <p>Every parcel, one clear line from pickup to doorstep.</p>
          </div>

          <div className="hero-scene" aria-hidden>
            <span className="orb orb-a" />
            <span className="orb orb-b" />
            <span className="float-badge badge-1">✓</span>
            <span className="float-badge badge-2">▣</span>

            <div className="tracking-card">
              <div className="tracking-head">
                <div className="tracking-live">
                  <span className="pulse-dot" />
                  Live shipment
                </div>
                <span className="tracking-id">#SHPL-4F2A</span>
              </div>

              <div className="tracking-route">
                <div className="tracking-node">
                  <span className="node-dot done" />
                  <div>
                    <span>Pickup</span>
                    <strong>Lagos</strong>
                  </div>
                </div>
                <div className="tracking-line">
                  <span className="line-track half">
                    <span className="line-vehicle" />
                  </span>
                </div>
                <div className="tracking-node">
                  <span className="node-dot" />
                  <div>
                    <span>Warehouse</span>
                    <strong>Ikeja</strong>
                  </div>
                </div>
                <div className="tracking-line">
                  <span className="line-track" />
                </div>
                <div className="tracking-node">
                  <span className="node-dot" />
                  <div>
                    <span>Delivery</span>
                    <strong>Abuja</strong>
                  </div>
                </div>
              </div>

              <div className="tracking-meta">
                <div className="pkg">
                  <span className="pkg-icon">▣</span>
                  <div>
                    <span>Package</span>
                    <strong>Box · 5.4 kg</strong>
                  </div>
                </div>
                <div className="eta">
                  <span>ETA</span>
                  <strong>Tue 12:40</strong>
                </div>
              </div>

              <div className="tracking-progress">
                <div className="progress-track">
                  <span className="progress-fill" />
                </div>
                <span>3 of 4 stops</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-brand">
            <Logo size={36} />
            <strong>Shiplio</strong>
          </div>
          {onBack && (
            <button type="button" className="resend-btn" onClick={onBack}>
              ← Back to home
            </button>
          )}
          <h2>
            {mode === 'register' && 'Create account'}
            {mode === 'signin' && 'Sign in'}
            {mode === 'verify' && 'Verify your email'}
            {mode === 'forgot' && 'Forgot password'}
            {mode === 'reset' && 'Reset password'}
          </h2>
          <p>
            {mode === 'register' && 'Register as a customer to book pickups.'}
            {mode === 'signin' && 'Enter your credentials to continue.'}
            {mode === 'verify' && 'A 6-digit code was sent to your inbox.'}
            {mode === 'forgot' && 'We will email you a 6-digit reset code.'}
            {mode === 'reset' && 'Enter the code plus your new password.'}
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {info && <div className="info-message">{info}</div>}

            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@shiplio.dev"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {mode === 'signin' && (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@shiplio.dev"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="button"
                  className="resend-btn"
                  onClick={() => switchMode('forgot')}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </>
            )}

            {mode === 'verify' && (
              <>
                <div className="form-group">
                  <label htmlFor="otpCode">6-digit code</label>
                  <input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="button"
                  className="resend-btn"
                  onClick={() => void handleResend()}
                  disabled={loading}
                >
                  Resend code
                </button>
              </>
            )}

            {mode === 'forgot' && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@shiplio.dev"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div className="form-group">
                  <label htmlFor="otpCode">6-digit code</label>
                  <input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm new password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {mode === 'verify'
                ? loading
                  ? 'Verifying…'
                  : 'Verify & continue'
                : mode === 'register'
                  ? loading
                    ? 'Creating account…'
                    : 'Create account'
                  : mode === 'forgot'
                    ? loading
                      ? 'Sending code…'
                      : 'Send reset code'
                    : mode === 'reset'
                      ? loading
                        ? 'Resetting…'
                        : 'Reset password'
                      : loading
                        ? 'Signing in…'
                        : 'Continue'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'verify' ? (
              <>
                Wrong email?{' '}
                <button type="button" onClick={() => { setPendingEmail(''); switchMode('register') }}>
                  Start over
                </button>
              </>
            ) : mode === 'register' ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('signin')}>
                  Sign in
                </button>
              </>
            ) : mode === 'forgot' || mode === 'reset' ? (
              <>
                Remembered it?{' '}
                <button type="button" onClick={() => switchMode('signin')}>
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                New to Shiplio?{' '}
                <button type="button" onClick={() => switchMode('register')}>
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}
