import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
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
            <li><Link to="/" className="active">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register Donor</Link></li>
            <li><Link to="/org-register">Register Org</Link></li>
            <li><Link to="/chatbot"><i className="fas fa-robot"></i> Chatbot</Link></li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Connecting Lives Through Blood Donation</h1>
            <p className="hero-subtitle">Join thousands of donors and organizations working together to save lives. Every donation counts.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary">
                <i className="fas fa-tint"></i>
                Donate Blood
              </Link>
              <Link to="/org-register" className="btn btn-primary">
                <i className="fas fa-hand-holding-heart"></i>
                Request Blood
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Bloodline?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Large Network</h3>
              <p>Connect with donors and organizations across the region</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Quick Response</h3>
              <p>Fast matching system to find the right donor when you need it</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Safe & Secure</h3>
              <p>Your information is protected and handled with care</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Save Lives</h3>
              <p>Every donation can save up to three lives</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot Section */}
      <section className="features" style={{background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)', padding: '4rem 0'}}>
        <div className="container">
          <h2 className="section-title">Need Help? Ask Our AI Assistant</h2>
          <div style={{textAlign: 'center', maxWidth: '600px', margin: '0 auto'}}>
            <p style={{fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '2rem'}}>
              Have questions about blood donation? Our AI-powered chatbot is trained on verified blood donation knowledge and can help you with eligibility, safety, diet, and more!
            </p>
            <Link to="/chatbot" className="btn btn-primary" style={{fontSize: '1.1rem', padding: '1rem 2.5rem'}}>
              <i className="fas fa-robot"></i>
              Chat with AI Assistant
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Bloodline. All rights reserved. | Connecting Lives Through Blood Donation</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
