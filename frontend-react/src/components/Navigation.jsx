import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Navigation = ({ 
  navItems = [], 
  activeLink = '', 
  showLogout = false, 
  showChangePassword = false,
  onLogout = null,
  onChangePassword = null,
  customNavItems = []
}) => {
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

  const handleNavClick = (callback) => {
    if (callback) callback()
    closeMenu()
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-brand">
          <i className="fas fa-heartbeat"></i>
          <span>Bloodline</span>
        </div>
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map((item, index) => (
            <li key={index}>
              {item.to ? (
                <Link 
                  to={item.to} 
                  className={item.active || item.to === activeLink ? 'active' : ''}
                  onClick={() => handleNavClick(item.onClick)}
                >
                  {item.icon && <i className={item.icon}></i>} {item.label}
                </Link>
              ) : (
                <button 
                  onClick={() => handleNavClick(item.onClick)}
                  className={item.className || ''}
                  style={item.style || {}}
                >
                  {item.icon && <i className={item.icon}></i>} {item.label}
                </button>
              )}
            </li>
          ))}
          {customNavItems.map((item, index) => (
            <li key={`custom-${index}`}>
              {item}
            </li>
          ))}
        </ul>
        <div className="hamburger" onClick={toggleMenu}>
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
