import React, { useState } from 'react'
import { Link } from 'react-router-dom'

// Add custom CSS for form styling to match blood group dropdown
const adminLoginFormStyles = `
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
  
  .auth-form .form-group input[type="text"],
  .auth-form .form-group input[type="password"] {
    border: 2px solid #d32f2f !important;
    background: #ffffff !important;
    color: #212121 !important;
  }
  
  .auth-form .form-group input[type="text"]:focus,
  .auth-form .form-group input[type="password"]:focus {
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1) !important;
  }
  
  /* Override any browser default styling for password inputs */
  .auth-form .form-group input[type="password"]::-webkit-credentials-auto-fill-button,
  .auth-form .form-group input[type="password"]::-webkit-contacts-auto-fill-button {
    display: none !important;
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

function AdminLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Inject custom CSS styles
  React.useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = adminLoginFormStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.admin))
        window.location.href = '/admin-dashboard'
      } else {
        setError(data.message || 'Admin login failed. Please try again.')
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
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/admin" className="active"><i className="fas fa-shield-alt"></i> Admin</Link></li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Admin Login Section */}
      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-shield-alt"></i>
              <h2>Admin Login</h2>
              <p>Access the admin dashboard to manage the platform</p>
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                <i className="fas fa-lock"></i> Authorized administrators only
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="adminUsername">
                  <i className="fas fa-user"></i>
                  Username
                </label>
                <input 
                  type="text" 
                  id="adminUsername" 
                  name="username" 
                  required 
                  placeholder="Enter admin username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminPassword">
                  <i className="fas fa-lock"></i>
                  Admin Password
                </label>
                <div className="password-input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="adminPassword" 
                    name="password" 
                    autoComplete="current-password" 
                    required 
                    placeholder="Enter admin password"
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

              {error && (
                <div className="error-message show">
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <i className="fas fa-shield-alt"></i>
                {loading ? 'Logging in...' : 'Admin Login'}
              </button>

              <div className="auth-footer">
                <p>Not an admin? <Link to="/login">User Login</Link></p>
                <p style={{marginTop: '0.5rem'}}>Don't have an account? <Link to="/register">Register here</Link></p>
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

export default AdminLogin
