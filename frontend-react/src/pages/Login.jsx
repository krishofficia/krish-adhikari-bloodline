import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if there's a return URL and message from DonorResponse or Homepage
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message)
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
        : '/api/auth/login'
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
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
            <li><Link to="/admin"><i className="fas fa-shield-alt"></i> Admin</Link></li>
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
                <i className="fas fa-info-circle"></i> Use your donor credentials to continue
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group input-icon">
                <i className="fas fa-envelope"></i>
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  autoComplete="email" 
                  required 
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group input-icon">
                <i className="fas fa-lock"></i>
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  autoComplete="current-password" 
                  required 
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
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
                </select>
              </div>

              {error && (
                <div className="error-message show">
                  {error}
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
