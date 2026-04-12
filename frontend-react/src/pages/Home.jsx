import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BloodDonationQuotes from '../components/BloodDonationQuotes'
import StatisticsSection from '../components/StatisticsSection'
import CallToAction from '../components/CallToAction'
import '../components/EnhancedHomepage.css'

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navbar')) {
        closeMenu()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-brand">
            <i className="fas fa-heartbeat"></i>
            <span>Bloodline</span>
          </div>
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li><Link to="/" className="active" onClick={closeMenu}>Home</Link></li>
            <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
            <li><Link to="/register" onClick={closeMenu}>Register Donor</Link></li>
            <li><Link to="/org-register" onClick={closeMenu}>Register Org</Link></li>
            <li><Link to="/chatbot" onClick={closeMenu}><i className="fas fa-robot"></i> Chatbot</Link></li>
          </ul>
          <div className="hamburger" onClick={toggleMenu}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Donate Blood, Save Lives <span className="heart-icon">❤️</span>
            </h1>
            <p className="hero-subtitle">
              Your small act can give someone a second chance at life.
            </p>
            <div className="hero-buttons">
              <Link to="/org-register" className="hero-btn primary">
                <i className="fas fa-search"></i>
                Find Donors
              </Link>
              <Link to="/register" className="hero-btn secondary">
                <i className="fas fa-user-plus"></i>
                Become a Donor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Bloodline?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>Find Blood Donors Quickly</h3>
              <p>Our advanced matching system helps you find the right donors in your area within minutes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Secure & Verified Users</h3>
              <p>All donors and organizations are verified to ensure safety and trust in our community.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Emergency Requests</h3>
              <p>Urgent blood requests get priority matching and instant notifications to nearby donors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-user-check"></i>
              </div>
              <h3>Easy Registration</h3>
              <p>Simple and quick registration process for both donors and organizations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Donation Quotes Section */}
      <BloodDonationQuotes />

      {/* Statistics Section */}
      <StatisticsSection />

      {/* Call to Action Section */}
      <CallToAction />

      {/* Chatbot Section */}
      <section className="features" style={{background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)', padding: '4rem 0'}}>
        <div className="container">
          <h2 className="section-title">Need Help? Ask Our AI Assistant</h2>
          <div style={{textAlign: 'center', maxWidth: '600px', margin: '0 auto'}}>
            <p style={{fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '2rem'}}>
              Have questions about blood donation? Our AI-powered chatbot is trained on verified blood donation knowledge and can help you with eligibility, safety, diet, and more!
            </p>
            <Link to="/chatbot" className="hero-btn primary" style={{fontSize: '1.1rem', padding: '1rem 2.5rem'}}>
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
