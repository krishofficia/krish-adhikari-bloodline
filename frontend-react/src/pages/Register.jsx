import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { apiFetch } from '../api'
import Navigation from '../components/Navigation'

// Add custom CSS for form styling to match blood group dropdown
const registerFormStyles = `
  .auth-form .form-group input,
  .auth-form .form-group select {
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
  
  .auth-form .form-group input:focus,
  .auth-form .form-group select:focus {
    outline: none;
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1);
  }
  
  .auth-form .form-group input::placeholder {
    color: #999;
  }
  
  .auth-form .form-group input[type="text"],
  .auth-form .form-group input[type="email"],
  .auth-form .form-group input[type="tel"],
  .auth-form .form-group input[type="password"],
  .auth-form .form-group select {
    border: 2px solid #d32f2f !important;
    background: #ffffff !important;
    color: #212121 !important;
  }
  
  .auth-form .form-group input[type="text"]:focus,
  .auth-form .form-group input[type="email"]:focus,
  .auth-form .form-group input[type="tel"]:focus,
  .auth-form .form-group input[type="password"]:focus,
  .auth-form .form-group select:focus {
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

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: '',
    location: '',
    availability: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Inject custom CSS styles
  React.useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = registerFormStyles
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
    setSuccess('')
    setLoading(true)

    try {
      // Validate form data
      if (!formData.fullName || !formData.email || !formData.password || 
          !formData.confirmPassword || !formData.phone || !formData.bloodGroup || !formData.location || !formData.availability) {
        setError('Please fill all required fields')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      // Validate password
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }

      // Send OTP for registration
      const response = await apiFetch('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          role: 'donor',
          fullName: formData.fullName,
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          location: formData.location,
          availability: formData.availability,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('OTP sent to your email! Redirecting to verification page...')
        
        // Navigate to OTP verification page with registration data
        setTimeout(() => {
          navigate('/verify-otp', {
            state: {
              registrationData: {
                email: formData.email,
                role: 'donor',
                fullName: formData.fullName,
                phone: formData.phone,
                bloodGroup: formData.bloodGroup,
                location: formData.location,
                availability: formData.availability,
                password: formData.password
              }
            }
          })
        }, 1500)
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Send OTP error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Navigation Bar */}
      <Navigation 
        navItems={[
          { to: '/', label: 'Home' },
          { to: '/login', label: 'Login' },
          { to: '/register', label: 'Register', active: true },
          { to: '/org-register', label: 'Register Organization' }
        ]}
        activeLink={location.pathname}
      />

      {/* Registration Section */}
      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-user-plus"></i>
              <h2>Register as Donor</h2>
              <p>Join our community and help save lives!</p>
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                <i className="fas fa-info-circle"></i> Use your own email address to create an account
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="fullName">
                  <i className="fas fa-user"></i>
                  Full Name
                </label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName" 
                  required 
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="regEmail">
                  <i className="fas fa-envelope"></i>
                  Email Address
                </label>
                <input 
                  type="email" 
                  id="regEmail" 
                  name="email" 
                  autoComplete="email" 
                  required 
                  placeholder="your.email@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                <small style={{color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>
                  Use your own email address (Gmail, Yahoo, Outlook, etc.)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <i className="fas fa-phone"></i>
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  required 
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bloodGroup">
                  <i className="fas fa-tint"></i>
                  Blood Group
                </label>
                <select 
                  id="bloodGroup" 
                  name="bloodGroup" 
                  required
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select your blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  <i className="fas fa-map-marker-alt"></i>
                  Location (City / Area)
                </label>
                <input 
                  type="text" 
                  id="location" 
                  name="location" 
                  required 
                  placeholder="Enter your city or area"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability">
                  <i className="fas fa-check-circle"></i>
                  Availability Status
                </label>
                <select 
                  id="availability" 
                  name="availability" 
                  required
                  value={formData.availability}
                  onChange={handleChange}
                >
                  <option value="">Select availability</option>
                  <option value="available">Available</option>
                  <option value="not-available">Not Available</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="regPassword">
                  <i className="fas fa-lock"></i>
                  Password
                </label>
                <div className="password-input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="regPassword" 
                    name="password" 
                    required 
                    placeholder="Create a secure password"
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
                <small style={{color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>
                  Choose a strong password (at least 6 characters)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <i className="fas fa-lock"></i>
                  Confirm Password
                </label>
                <div className="password-input-container">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    required 
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
                <small style={{color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>
                  Re-enter your password for confirmation
                </small>
              </div>

              {error && (
                <div className="error-message show">
                  {error}
                </div>
              )}

              {success && (
                <div className="success-message show">
                  {success}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <i className="fas fa-user-plus"></i>
                {loading ? 'Registering...' : 'Register'}
              </button>

              <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Login here</Link></p>
                <p style={{marginTop: '0.5rem'}}>Want to register as an organization? <Link to="/org-register">Register Organization</Link></p>
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

export default Register
