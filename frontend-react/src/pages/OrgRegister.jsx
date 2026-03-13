import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function OrgRegister() {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.organizationName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          licenseNumber: formData.licenseNumber,
          panNumber: formData.panNumber,
          panCardImage: formData.panCardImage
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Organization registration successful! Your account is pending verification.')
        setFormData({
          organizationName: '',
          email: '',
          phone: '',
          licenseNumber: '',
          panNumber: '',
          address: '',
          password: '',
          panCardImage: null
        })
      } else {
        setError(data.message || 'Registration failed. Please try again.')
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
            <li><Link to="/org-register" className="active">Register Organization</Link></li>
            <li><Link to="/admin"><i className="fas fa-shield-alt"></i> Admin</Link></li>
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
                <input 
                  type="password" 
                  id="orgPassword" 
                  name="password" 
                  required 
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                />
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
