import React, { useState, useEffect } from 'react'

const statistics = [
  { number: 5000, label: 'Total Donors', icon: 'fa-users' },
  { number: 15000, label: 'Lives Saved', icon: 'fa-heart' },
  { number: 1200, label: 'Active Requests', icon: 'fa-hand-holding-heart' },
  { number: 98, label: 'Success Rate %', icon: 'fa-chart-line' }
]

const AnimatedCounter = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      setCount(Math.floor(progress * target))
      
      if (progress < 1) {
        requestAnimationFrame(animateCount)
      }
    }
    
    requestAnimationFrame(animateCount)
  }, [target, duration])

  return <span>{count.toLocaleString()}</span>
}

const StatisticsSection = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="statistics-section">
      <div className="container">
        <div className="statistics-header">
          <h2 className="section-title">Our Impact</h2>
          <p className="section-subtitle">Together we're making a difference every day</p>
        </div>

        <div className="statistics-grid">
          {statistics.map((stat, index) => (
            <div 
              key={index} 
              className={`statistic-card ${isVisible ? 'visible' : ''}`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="statistic-icon">
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className="statistic-number">
                {isVisible ? <AnimatedCounter target={stat.number} /> : '0'}
                {stat.label === 'Success Rate %' && '%'}
              </div>
              <div className="statistic-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatisticsSection
