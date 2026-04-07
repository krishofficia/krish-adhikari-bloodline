import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { apiFetch } from '../api'

// Add custom CSS for form styling to match blood group dropdown
const loginFormStyles = `
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
  
  .auth-form .form-group input[type="email"],
  .auth-form .form-group input[type="password"],
  .auth-form .form-group input[type="text"] {
    border: 2px solid #d32f2f !important;
    background: #ffffff !important;
    color: #212121 !important;
  }
  
  .auth-form .form-group input[type="email"]:focus,
  .auth-form .form-group input[type="password"]:focus,
  .auth-form .form-group input[type="text"]:focus {
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
  
  .forgot-password-link {
    color: #d32f2f;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  
  .forgot-password-link:hover {
    color: #b71c1c;
    text-decoration: underline;
  }
  
  /* Override any browser default styling for password inputs */
  .auth-form .form-group input[type="password"]::-webkit-credentials-auto-fill-button,
  .auth-form .form-group input[type="password"]::-webkit-contacts-auto-fill-button {
    display: none !important;
  }
`;

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'donor'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Inject custom CSS styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = loginFormStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Check if there's a return URL and message from DonorResponse, Homepage, or Reset Password
  useEffect(() => {
    if (location.state?.message) {
      if (location.state.message.includes('Password reset successful')) {
        setSuccess(location.state.message)
      } else {
        setError(location.state.message)
      }
    }
  }, [location.state])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use different endpoints based on role
      const loginEndpoint = formData.role === 'donor' 
        ? '/api/auth/login-donor' 
        : formData.role === 'organization'
        ? '/api/auth/login'
        : '/api/admin/login'
      
      // For admin, send username field, for others send email
      const requestBody = {
        password: formData.password
      }
      
      if (formData.role === 'admin') {
        requestBody.username = formData.email // Use email field as username for admin
      } else {
        requestBody.email = formData.email
      }
      
      const response = await apiFetch(loginEndpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and redirect based on role
        localStorage.setItem('token', data.token)
        
        if (formData.role === 'donor') {
          localStorage.setItem('user', JSON.stringify(data.donor))
          // Check if there's a return URL
          const returnUrl = location.state?.returnUrl || '/donor-dashboard'
          navigate(returnUrl)
        } else if (formData.role === 'organization') {
          localStorage.setItem('user', JSON.stringify(data.organization))
          navigate('/org-dashboard')
        } else if (formData.role === 'admin') {
          localStorage.setItem('user', JSON.stringify(data.admin))
          window.location.href = '/admin-dashboard'
        }
      } else {
        setError(data.message || 'Login failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
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

      {/* Login Section */}
      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-sign-in-alt"></i>
              <h2>Login to Bloodline</h2>
              <p>Welcome back! Please login to continue.</p>
              {location.state?.returnUrl && (
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--accent-color)', 
                  marginTop: '0.5rem',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  padding: '0.5rem',
                  borderRadius: '5px',
                  border: '1px solid rgba(255, 193, 7, 0.3)'
                }}>
                  <i className="fas fa-envelope"></i> Please login to respond to blood request
                </p>
              )}
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                <i className="fas fa-info-circle"></i> 
                {formData.role === 'admin' 
                  ? 'Use your admin credentials to access the dashboard'
                  : formData.role === 'organization'
                  ? 'Use your organization credentials to continue'
                  : 'Use your donor credentials to continue'
                }
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group input-icon">
                <i className="fas fa-envelope"></i>
                <label htmlFor="email">
                  {formData.role === 'admin' ? 'Username' : 'Email Address'}
                </label>
                <input 
                  type={formData.role === 'admin' ? 'text' : 'email'} 
                  id="email" 
                  name="email" 
                  autoComplete={formData.role === 'admin' ? 'username' : 'email'} 
                  required 
                  placeholder={formData.role === 'admin' ? 'Enter admin username' : 'Enter your email'}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group input-icon">
                <i className="fas fa-lock"></i>
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    name="password" 
                    autoComplete="current-password" 
                    required 
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role">
                  <i className="fas fa-user-tag"></i>
                  Login As
                </label>
                <select 
                  id="role" 
                  name="role" 
                  required
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">Select your role</option>
                  <option value="donor">Donor</option>
                  <option value="organization">Organization</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && (
                <div className="error-message show">
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
                <i className="fas fa-sign-in-alt"></i>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="auth-footer">
                <p>Don't have an account?</p>
                <p style={{marginTop: '0.5rem'}}>
                  <Link to="/register">Register as Donor</Link> | 
                  <Link to="/org-register">Register Organization</Link>
                </p>
                <p style={{marginTop: '1rem'}}>
                  <Link to="/forgot-password" className="forgot-password-link">
                    Forgot Password?
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Bloodline. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Login
