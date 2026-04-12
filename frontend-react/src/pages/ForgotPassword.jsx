import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { apiFetch } from '../api'
import Navigation from '../components/Navigation'

// Add custom CSS for form styling to match blood group dropdown
const forgotPasswordStyles = `
  .auth-form .form-group input {
    padding: 0.875rem;
    border: 2px solid #d32f2f !important;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    font-family: inherit;
    background: #ffffff;
    color: #212121 !important;
    width: 100%;
    box-sizing: border-box;
  }
  
  .auth-form .form-group input:focus {
    outline: none;
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1);
  }
  
  .auth-form .form-group input::placeholder {
    color: #999;
  }
  
  .auth-form .form-group input[type="email"] {
    border: 2px solid #d32f2f !important;
    background: #ffffff !important;
    color: #212121 !important;
  }
  
  .auth-form .form-group input[type="email"]:focus {
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1) !important;
  }
`;

function ForgotPassword() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Inject custom CSS styles
  React.useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = forgotPasswordStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || 'Password reset link has been sent to your email.')
        setEmail('') // Clear email input
      } else {
        setError(data.message || 'Failed to send password reset link. Please try again.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Forgot password error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    // Clear messages when user starts typing
    setError('')
    setSuccess('')
  }

  return (
    <div>
      {/* Navigation Bar */}
      <Navigation 
        navItems={[
          { to: '/', label: 'Home' },
          { to: '/login', label: 'Login' },
          { to: '/register', label: 'Register' }
        ]}
        activeLink={location.pathname}
      />

      {/* Forgot Password Section */}
      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-key"></i>
              <h2>Forgot Password</h2>
              <p>Enter your email address to receive a password reset link</p>
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                <i className="fas fa-info-circle"></i> 
                The reset link will be valid for 30 minutes
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  Email Address
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  autoComplete="email" 
                  required 
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="error-message show">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="success-message show">
                  <i className="fas fa-check-circle"></i>
                  {success}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <i className="fas fa-paper-plane"></i>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="auth-footer">
                <p>Remember your password?</p>
                <p style={{marginTop: '0.5rem'}}>
                  <Link to="/login">Back to Login</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ForgotPassword
