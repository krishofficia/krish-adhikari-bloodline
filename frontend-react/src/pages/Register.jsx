import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: '',
    location: '',
    availability: '',
    password: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register-donor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          location: formData.location,
          availability: formData.availability
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registration successful! Please login.')
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          bloodGroup: '',
          location: '',
          availability: '',
          password: ''
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
            <li><Link to="/register" className="active">Register</Link></li>
            <li><Link to="/org-register">Register Organization</Link></li>
            <li><Link to="/admin"><i className="fas fa-shield-alt"></i> Admin</Link></li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

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
                <input 
                  type="password" 
                  id="regPassword" 
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
