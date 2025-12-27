import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'
import '../App.css'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Add overall timeout to prevent infinite hanging
      const timeoutId = setTimeout(() => {
        setIsSubmitting(false)
        setError('Request timed out. Please check your connection and try again, or continue as guest.')
      }, 15000) // 15 second timeout

      let success = false
      if (isLogin) {
        success = await login(email, password)
        if (!success) {
          setError('Invalid email or password. If this persists, try continuing as guest.')
        }
      } else {
        if (!name.trim()) {
          setError('Name is required')
          clearTimeout(timeoutId)
          setIsSubmitting(false)
          return
        }
        const result = await signup(email, password, name)
        if (!result.success) {
          // Show the actual error message from Supabase
          setError(result.error || 'An account with this email already exists')
        } else {
          success = true
        }
      }

      clearTimeout(timeoutId)
      if (success) {
        navigate('/')
      } else {
        setIsSubmitting(false)
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setError(err?.message || 'Something went wrong. Please try again or continue as guest.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/landing" className="auth-back-button">
          ← Back
        </Link>
        <div className="auth-header">
          <h1>SpeechPrep</h1>
          <p>{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required={!isLogin}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
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
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <button type="submit" className="primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
            </button>
            {isSubmitting && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setIsSubmitting(false)
                  setError('')
                }}
                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setEmail('')
                setPassword('')
                setName('')
                setIsSubmitting(false)
              }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/" className="link-button">
              Continue as guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

