import React from 'react'
import { Link } from 'react-router-dom'

const CallToAction = () => {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <div className="cta-text">
            <h2 className="cta-title">Be a Hero Today</h2>
            <p className="cta-subtitle">
              Join thousands of heroes who have already made the life-saving decision to donate blood. 
              Your single act of kindness can ripple through families and communities forever.
            </p>
            <div className="cta-features">
              <div className="cta-feature">
                <i className="fas fa-clock"></i>
                <span>Only 30 minutes of your time</span>
              </div>
              <div className="cta-feature">
                <i className="fas fa-shield-alt"></i>
                <span>Safe and medically supervised</span>
              </div>
              <div className="cta-feature">
                <i className="fas fa-heart"></i>
                <span>Save up to 3 lives</span>
              </div>
            </div>
          </div>
          <div className="cta-actions">
            <Link to="/register" className="cta-btn primary">
              <i className="fas fa-user-plus"></i>
              Register Now
            </Link>
            <Link to="/login" className="cta-btn secondary">
              <i className="fas fa-sign-in-alt"></i>
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
