import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I\'m your Bloodline AI Assistant. How can I help you today?'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [aiServiceStatus, setAiServiceStatus] = useState('checking') // checking, connected, offline
  const chatContainerRef = useRef(null)

  // Check AI service status on component mount
  useEffect(() => {
    checkAiServiceStatus()
  }, [])

  const checkAiServiceStatus = async () => {
    try {
      // Check if Python service is available through backend
      const response = await apiFetch('/api/health/python')
      if (response.ok) {
        setAiServiceStatus('connected')
      } else {
        setAiServiceStatus('offline')
      }
    } catch (error) {
      // Silently set offline without console errors
      setAiServiceStatus('offline')
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage = {
      type: 'user',
      text: inputMessage
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setIsTyping(true)

    try {
      // Call backend chatbot API (which forwards to Python service)
      const response = await apiFetch('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({ message: currentMessage })
      })

      if (response.ok) {
        const data = await response.json()
        const botResponse = {
          type: 'bot',
          text: data.answer || 'Sorry, I couldn\'t find a relevant answer. Please try asking about blood donation topics.'
        }
        setMessages(prev => [...prev, botResponse])
      } else {
        throw new Error('AI service not available')
      }
    } catch (error) {
      console.error('Error connecting to AI service:', error)
      // Fallback to rule-based responses if AI service is not available
      const botResponse = {
        type: 'bot',
        text: getBotResponse(currentMessage)
      }
      setMessages(prev => [...prev, botResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('donate') || lowerMessage.includes('donation')) {
      return 'Blood donation is a safe process that saves lives! The entire process takes about 10-15 minutes, with the actual donation taking only 8-10 minutes. You can donate blood every 56 days. Make sure you\'re healthy, well-rested, and have eaten before donating.'
    } else if (lowerMessage.includes('eligible') || lowerMessage.includes('requirements')) {
      return 'To be eligible to donate blood, you must: be 18-65 years old, weigh at least 50kg (110lbs), be in good health, have a valid ID, and not have certain medical conditions. You should also wait 3 months after tattoos, piercings, or major surgeries.'
    } else if (lowerMessage.includes('blood group') || lowerMessage.includes('blood type')) {
      return 'There are 8 main blood groups: A+, A-, B+, B-, AB+, AB-, O+, O-. O+ is the most common (37% of population) and universal donor for red blood cells, while O- is the universal donor for all blood types. AB+ is the universal recipient.'
    } else if (lowerMessage.includes('prepare') || lowerMessage.includes('before donation')) {
      return 'Before donating: drink plenty of water (16oz extra), eat a healthy meal (avoid fatty foods), get good sleep (8+ hours), bring valid ID, and avoid alcohol for 24 hours and caffeine for 12 hours before donation. Wear comfortable clothing with sleeves that can be rolled up.'
    } else if (lowerMessage.includes('after') || lowerMessage.includes('post donation')) {
      return 'After donating: rest for 10-15 minutes, drink extra fluids for 24-48 hours, avoid heavy lifting for 24 hours, keep the bandage on for 4-6 hours, and eat iron-rich foods (red meat, spinach, beans). Avoid hot drinks for 4 hours and no strenuous exercise for 24 hours.'
    } else if (lowerMessage.includes('benefits')) {
      return 'Blood donation benefits: saves up to 3 lives per donation, reduces heart disease risk by lowering iron levels, provides free health screening (blood pressure, hemoglobin), gives you a sense of fulfillment, and you get a mini physical exam!'
    } else if (lowerMessage.includes('side effects') || lowerMessage.includes('risks')) {
      return 'Common side effects are mild: slight dizziness, bruising at the needle site, or feeling faint. These usually pass quickly. Serious complications are very rare (less than 1 in 100,000) when proper procedures are followed. Staff are trained to handle any reactions.'
    } else if (lowerMessage.includes('process') || lowerMessage.includes('what happens')) {
      return 'The donation process: 1) Registration and health questionnaire, 2) Mini physical exam (blood pressure, pulse, temperature), 3) Hemoglobin test (finger prick), 4) Actual donation (8-10 minutes), 5) Rest and refreshments (15 minutes). Total time: about 1 hour.'
    } else if (lowerMessage.includes('frequency') || lowerMessage.includes('how often')) {
      return 'You can donate whole blood every 56 days (8 weeks), platelets every 7 days (up to 24 times/year), and plasma every 28 days. The body replaces plasma within 24 hours, red cells within 4-6 weeks, and iron stores within 8 weeks.'
    } else if (lowerMessage.includes('cannot donate') || lowerMessage.includes('deferred')) {
      return 'You cannot donate if you have: certain medical conditions (heart disease, cancer, HIV/AIDS), recent tattoos/piercings (3 months), recent surgery (6 months), pregnancy (6 weeks after delivery), or if you\'re taking certain medications. Staff will review your eligibility.'
    } else if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return 'The needle prick feels like a quick pinch, similar to getting a shot. Most people report minimal discomfort. The donation itself is painless. Staff are trained to make the experience as comfortable as possible. If you\'re nervous, let them know!'
    } else if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) {
      return 'Your blood pressure should be between 90/60 and 180/100 to donate. High or low blood pressure may temporarily defer you. Blood pressure is checked during the mini physical exam before donation.'
    } else if (lowerMessage.includes('iron') || lowerMessage.includes('hemoglobin')) {
      return 'Your hemoglobin level must be at least 12.5g/dL for women and 13.0g/dL for men. This is checked with a finger prick test. If your levels are low, you\'ll be temporarily deferred. Eating iron-rich foods can help maintain healthy levels.'
    } else if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return 'Hello! I\'m here to help with any questions about blood donation. You can ask me about eligibility, the donation process, benefits, preparation, or any other blood donation topics!'
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return 'You\'re welcome! Remember, every blood donation can save up to 3 lives. Is there anything else you\'d like to know about blood donation?'
    } else {
      return 'I can help you with information about blood donation, eligibility, preparation, benefits, process, frequency, and more. Try asking about topics like "how to prepare", "eligibility requirements", or "donation process". What specific aspect would you like to know about?'
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
            <li><Link to="/org-register">Register Organization</Link></li>
            <li><Link to="/chatbot" className="active"><i className="fas fa-robot"></i> Chatbot</Link></li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Chatbot Section */}
      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-robot"></i>
              <h2>Bloodline AI Assistant</h2>
              <p>Ask me anything about blood donation!</p>
              
              {/* AI Service Status */}
              <div className="ai-status" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: aiServiceStatus === 'connected' ? '#d4edda' : 
                                 aiServiceStatus === 'checking' ? '#fff3cd' : '#f8d7da',
                color: aiServiceStatus === 'connected' ? '#155724' : 
                        aiServiceStatus === 'checking' ? '#856404' : '#721c24',
                border: `1px solid ${aiServiceStatus === 'connected' ? '#c3e6cb' : 
                                 aiServiceStatus === 'checking' ? '#ffeaa7' : '#f5c6cb'}`
              }}>
                <i className={`fas fa-${aiServiceStatus === 'connected' ? 'wifi' : 
                                   aiServiceStatus === 'checking' ? 'spinner fa-spin' : 'wifi-slash'}`}></i>
                {aiServiceStatus === 'connected' ? 'AI Service Connected' : 
                 aiServiceStatus === 'checking' ? 'Checking AI Service...' : 
                 'AI Service Offline (Using Fallback)'}
              </div>
              
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>
                <i className="fas fa-info-circle"></i> {aiServiceStatus === 'connected' ? 
                  'Powered by advanced AI with 1000+ blood donation Q&A pairs' : 
                  'I\'m trained on verified blood donation information'}
              </p>
            </div>
            
            {/* Chat Messages */}
            <div className="chat-container" ref={chatContainerRef}>
              {messages.map((message, index) => (
                <div key={index} className={`chat-message ${message.type}`}>
                  {message.type === 'bot' && (
                    <div className="avatar">
                      <i className="fas fa-robot"></i>
                    </div>
                  )}
                  <div className="message-bubble">
                    {message.text}
                  </div>
                  {message.type === 'user' && (
                    <div className="avatar">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="chat-message bot">
                  <div className="avatar">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="chat-form">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about blood donation..."
                disabled={isTyping}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isTyping || !inputMessage.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>

            <div className="auth-footer">
              <p>Need human assistance? <Link to="/contact">Contact Support</Link></p>
              <p style={{marginTop: '0.5rem'}}>
                <Link to="/"><i className="fas fa-home"></i> Back to Home</Link>
              </p>
            </div>
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

export default Chatbot
