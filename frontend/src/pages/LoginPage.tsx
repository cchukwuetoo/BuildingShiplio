import { useState } from 'react'
import { authAPI } from '../api.js'
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
}

type Mode = 'signin' | 'register'

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'register') {
      if (!firstName || !lastName || !phone || !email || !password) {
        setError('Fill in every field to create an account.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      setLoading(true)
      setError('')
      try {
        await authAPI.register({ firstName, lastName, phone, email, password })
        await runLogin(email, password)
      } catch (err: unknown) {
        setError(getErrorMessage(err) || 'Could not create account.')
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
        <div>
          <div className="brand">
            <div className="brand-mark">S</div>
            <div className="brand-text">
              <strong>Shiplio</strong>
              <span>Logistics operations</span>
            </div>
          </div>
          <h1>Move packages from pickup to dispatch without the clutter.</h1>
          <p>
            One console for customers, drivers, and warehouse teams — with a clear path for every shipment.
          </p>
          <div className="hero-points">
            <div>
              <span className="dot" />
              Customers book pickups in minutes
            </div>
            <div>
              <span className="dot" />
              Drivers accept and confirm collections
            </div>
            <div>
              <span className="dot" />
              Warehouse staff receive, process, and release
            </div>
          </div>
        </div>
        <p className="hero-foot">Pickup · warehouse · dispatch</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <h2>{mode === 'register' ? 'Create account' : 'Sign in'}</h2>
          <p>
            {mode === 'register'
              ? 'Register as a customer to book pickups.'
              : 'Enter your credentials to continue.'}
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            {mode === 'register' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348012345678"
                    disabled={loading}
                    autoComplete="tel"
                  />
                </div>
              </>
            )}

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
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                disabled={loading}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading
                ? mode === 'register'
                  ? 'Creating account…'
                  : 'Signing in…'
                : mode === 'register'
                  ? 'Create account'
                  : 'Continue'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'register' ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('signin')}>
                  Sign in
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
