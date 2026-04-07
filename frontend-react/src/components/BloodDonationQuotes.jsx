import React, { useState, useEffect } from 'react'

const quotes = [
  {
    text: "A single pint can save three lives.",
    icon: "fa-tint",
    author: "Blood Donation Fact"
  },
  {
    text: "Donate blood, be the reason for someone's heartbeat.",
    icon: "fa-heartbeat",
    author: "Medical Wisdom"
  },
  {
    text: "Your blood is someone's hope.",
    icon: "fa-hand-holding-heart",
    author: "Healthcare Proverb"
  },
  {
    text: "Heroes donate blood.",
    icon: "fa-user-shield",
    author: "Blood Donation Slogan"
  },
  {
    text: "The gift of blood is a gift of life.",
    icon: "fa-gift",
    author: "Medical Community"
  },
  {
    text: "Blood donation costs you nothing, but it means everything to someone who needs it.",
    icon: "fa-infinity",
    author: "Healthcare Wisdom"
  }
]

const BloodDonationQuotes = () => {
  const [currentQuote, setCurrentQuote] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextQuote = () => {
    setCurrentQuote((prev) => (prev + 1) % quotes.length)
    setIsAutoPlaying(false)
  }

  const prevQuote = () => {
    setCurrentQuote((prev) => (prev - 1 + quotes.length) % quotes.length)
    setIsAutoPlaying(false)
  }

  const goToQuote = (index) => {
    setCurrentQuote(index)
    setIsAutoPlaying(false)
  }

  return (
    <section className="quotes-section">
      <div className="container">
        <div className="quotes-header">
          <h2 className="section-title">Inspirational Words</h2>
          <p className="section-subtitle">Every donation tells a story of hope and life</p>
        </div>

        <div className="quotes-carousel">
          <div className="quote-card">
            <div className="quote-icon">
              <i className={`fas ${quotes[currentQuote].icon}`}></i>
            </div>
            <blockquote className="quote-text">
              "{quotes[currentQuote].text}"
            </blockquote>
            <cite className="quote-author">— {quotes[currentQuote].author}</cite>
          </div>

          <div className="quote-controls">
            <button className="quote-btn quote-btn-prev" onClick={prevQuote}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="quote-btn quote-btn-play" onClick={() => setIsAutoPlaying(!isAutoPlaying)}>
              <i className={`fas ${isAutoPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button className="quote-btn quote-btn-next" onClick={nextQuote}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="quote-indicators">
            {quotes.map((_, index) => (
              <button
                key={index}
                className={`quote-indicator ${index === currentQuote ? 'active' : ''}`}
                onClick={() => goToQuote(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default BloodDonationQuotes
