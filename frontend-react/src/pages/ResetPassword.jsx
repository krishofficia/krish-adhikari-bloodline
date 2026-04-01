import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

// Add custom CSS for form styling to match blood group dropdown
const resetPasswordStyles = `
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
  
  .auth-form .form-group input[type="password"] {
    border: 2px solid #d32f2f !important;
    background: #ffffff !important;
    color: #212121 !important;
  }
  
  .auth-form .form-group input[type="password"]:focus {
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1) !important;
  }
  
  /* Password toggle styles */
  .password-input-container {
    position: relative;
    width: 100%;
  }
  
  .password-input-container input {
    padding-right: 3rem !important;
  }
  
  .password-toggle-btn {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 0.875rem;
    transition: color 0.3s ease;
    z-index: 10;
  }
  
  .password-toggle-btn:hover {
    color: #d32f2f;
  }
  
  .password-toggle-btn:focus {
    outline: none;
    color: #d32f2f;
  }
`;

function ResetPassword() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenValid, setTokenValid] = useState(null)

  // Inject custom CSS styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = resetPasswordStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link')
      setTokenValid(false)
      return
    }
    
    // We'll validate the token when the user tries to submit
    // For now, just check if token exists
    setTokenValid(true)
  }, [token])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear messages when user starts typing
    setError('')
    setSuccess('')
  }

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('All fields are required')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!validateForm()) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          password: formData.password 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || 'Password has been reset successfully!')
        
        // Clear form
        setFormData({
          password: '',
          confirmPassword: ''
        })
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Password reset successful! Please login with your new password.' }
          })
        }, 2000)
      } else {
        setError(data.message || 'Failed to reset password. The link may have expired.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Reset password error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === false) {
    return (
      <div>
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="container">
            <div className="nav-brand">
              <i className="fas fa-heartbeat"></i>
              <span>Bloodline</span>
            </div>
            <ul className="nav-menu">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/login" className="active">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
            <div className="hamburger">
              <i className="fas fa-bars"></i>
            </div>
          </div>
        </nav>

        <section className="auth-section">
          <div className="container">
            <div className="auth-card">
              <div className="auth-header">
                <i className="fas fa-exclamation-triangle"></i>
                <h2>Invalid Reset Link</h2>
                <p>This password reset link is invalid or has expired.</p>
              </div>
              
              <div className="auth-footer" style={{textAlign: 'center', marginTop: '2rem'}}>
                <p>Need a new reset link?</p>
                <p style={{marginTop: '0.5rem'}}>
                  <Link to="/forgot-password">Request New Reset Link</Link>
                </p>
                <p style={{marginTop: '1rem'}}>
                  <Link to="/login">Back to Login</Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-brand">
            <i className="fas fa-heartbeat"></i>
            <span>Bloodline</span>
          </div>
          <ul className="nav-menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login" className="active">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Reset Password Section */}
      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-key"></i>
              <h2>Reset Password</h2>
              <p>Enter your new password below</p>
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                <i className="fas fa-info-circle"></i> 
                Choose a strong password (at least 6 characters)
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i>
                  New Password
                </label>
                <div className="password-input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    name="password" 
                    required 
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <i className="fas fa-lock"></i>
                  Confirm New Password
                </label>
                <div className="password-input-container">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    required 
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
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
                <i className="fas fa-save"></i>
                {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword
