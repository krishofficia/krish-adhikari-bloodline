import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Add custom CSS for form styling to match blood group dropdown
const orgRegisterFormStyles = `
  .auth-form .form-group input,
  .auth-form .form-group select,
  .auth-form .form-group textarea {
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
  .auth-form .form-group select:focus,
  .auth-form .form-group textarea:focus {
    outline: none;
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1);
  }
  
  .auth-form .form-group input::placeholder,
  .auth-form .form-group textarea::placeholder {
    color: #999;
  }
  
  .auth-form .form-group input[type="text"],
  .auth-form .form-group input[type="email"],
  .auth-form .form-group input[type="tel"],
  .auth-form .form-group input[type="password"],
  .auth-form .form-group select,
  .auth-form .form-group textarea {
    border: 2px solid #d32f2f !important;
    background: #ffffff !important;
    color: #212121 !important;
  }
  
  .auth-form .form-group input[type="text"]:focus,
  .auth-form .form-group input[type="email"]:focus,
  .auth-form .form-group input[type="tel"]:focus,
  .auth-form .form-group input[type="password"]:focus,
  .auth-form .form-group select:focus,
  .auth-form .form-group textarea:focus {
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

function OrgRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    organizationName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    panNumber: '',
    address: '',
    password: '',
    panCardImage: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Inject custom CSS styles
  React.useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = orgRegisterFormStyles
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          panCardImage: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validate form data
      if (!formData.organizationName || !formData.email || !formData.password || 
          !formData.phone || !formData.address || !formData.licenseNumber || 
          !formData.panNumber || !formData.panCardImage) {
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

      // Validate password
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }

      // Send OTP for registration
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          role: 'organization',
          name: formData.organizationName,
          phone: formData.phone,
          address: formData.address,
          licenseNumber: formData.licenseNumber,
          panNumber: formData.panNumber,
          panCardImage: formData.panCardImage,
          password: formData.password
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
                role: 'organization',
                name: formData.organizationName,
                phone: formData.phone,
                address: formData.address,
                licenseNumber: formData.licenseNumber,
                panNumber: formData.panNumber,
                panCardImage: formData.panCardImage,
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
            <li><Link to="/org-register" className="active">Register Organization</Link></li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Organization Registration Section */}
      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-building"></i>
              <h2>Register Organization</h2>
              <p>Register your blood bank or hospital organization</p>
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                <i className="fas fa-info-circle"></i> Your organization will be verified by admin
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="organizationName">
                  <i className="fas fa-building"></i>
                  Organization Name
                </label>
                <input 
                  type="text" 
                  id="organizationName" 
                  name="organizationName" 
                  required 
                  placeholder="Enter organization name"
                  value={formData.organizationName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="orgEmail">
                  <i className="fas fa-envelope"></i>
                  Organization Email
                </label>
                <input 
                  type="email" 
                  id="orgEmail" 
                  name="email" 
                  autoComplete="email" 
                  required 
                  placeholder="organization@bloodbank.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="orgPhone">
                  <i className="fas fa-phone"></i>
                  Organization Phone
                </label>
                <input 
                  type="tel" 
                  id="orgPhone" 
                  name="phone" 
                  required 
                  placeholder="Enter organization phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="licenseNumber">
                  <i className="fas fa-certificate"></i>
                  License Number
                </label>
                <input 
                  type="text" 
                  id="licenseNumber" 
                  name="licenseNumber" 
                  required 
                  placeholder="Enter license number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="panNumber">
                  <i className="fas fa-id-card"></i>
                  PAN Number
                </label>
                <input 
                  type="text" 
                  id="panNumber" 
                  name="panNumber" 
                  required 
                  placeholder="Enter PAN number"
                  value={formData.panNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="panCardImage">
                  <i className="fas fa-image"></i>
                  PAN Card Photo *
                </label>
                <input 
                  type="file" 
                  id="panCardImage" 
                  name="panCardImage" 
                  required 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <small style={{color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>
                  Upload a clear photo of your PAN card (JPG, PNG format)
                </small>
                {formData.panCardImage && (
                  <div style={{marginTop: '0.5rem'}}>
                    <img 
                      src={formData.panCardImage} 
                      alt="PAN Card Preview" 
                      style={{maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px'}}
                    />
                    <p style={{fontSize: '0.8rem', color: 'green', marginTop: '0.25rem'}}>
                      ✓ PAN card image uploaded
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="address">
                  <i className="fas fa-map-marker-alt"></i>
                  Organization Address
                </label>
                <textarea 
                  id="address" 
                  name="address" 
                  required 
                  placeholder="Enter complete organization address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="orgPassword">
                  <i className="fas fa-lock"></i>
                  Organization Password
                </label>
                <div className="password-input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="orgPassword" 
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
                <i className="fas fa-building"></i>
                {loading ? 'Registering...' : 'Register Organization'}
              </button>

              <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Login here</Link></p>
                <p style={{marginTop: '0.5rem'}}>Want to register as a donor? <Link to="/register">Register Donor</Link></p>
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

export default OrgRegister
