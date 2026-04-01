import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Add custom CSS for OTP verification form
const otpFormStyles = `
  .otp-verification-container {
    max-width: 450px;
    margin: 2rem auto;
    padding: 2rem;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
  }
  
  .otp-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .otp-header h2 {
    color: #d32f2f;
    margin-bottom: 0.5rem;
    font-size: 1.8rem;
  }
  
  .otp-header p {
    color: #666;
    margin: 0.5rem 0;
  }
  
  .otp-inputs {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 2rem 0;
  }
  
  .otp-input {
    width: 50px;
    height: 50px;
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    border: 2px solid #d32f2f !important;
    border-radius: 8px;
    background: #ffffff;
    color: #212121 !important;
    transition: all 0.3s ease;
  }
  
  .otp-input:focus {
    outline: none;
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1);
    transform: scale(1.05);
  }
  
  .otp-input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .otp-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }
  
  .btn {
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
  }
  
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4);
  }
  
  .btn-secondary {
    background: #e0e0e0;
    color: #212121;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #757575;
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  .alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    font-weight: 500;
    border-left: 4px solid;
  }
  
  .alert-error {
    background-color: #fef2f2;
    color: #f44336;
    border-left-color: #f44336;
  }
  
  .alert-success {
    background-color: #f0f9f0;
    color: #4caf50;
    border-left-color: #4caf50;
  }
  
  .alert-info {
    background-color: #e3f2fd;
    color: #2196f3;
    border-left-color: #2196f3;
  }
  
  .resend-timer {
    text-align: center;
    margin-top: 1rem;
    color: #666;
    font-size: 0.9rem;
  }
  
  .resend-timer .timer {
    color: #d32f2f;
    font-weight: bold;
  }
  
  .email-display {
    background: #f5f5f5;
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
    margin: 1rem 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .email-display strong {
    color: #d32f2f;
  }
`;

function OTPVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  
  // Get registration data from location state
  const registrationData = location.state?.registrationData
  const email = registrationData?.email
  const role = registrationData?.role

  // Inject custom CSS styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = otpFormStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Validate registration data
  useEffect(() => {
    if (!registrationData || !email || !role) {
      setError('Invalid registration data. Please go back and fill the registration form.')
      setTimeout(() => {
        navigate(role === 'donor' ? '/register' : '/org-register')
      }, 3000)
    }
  }, [registrationData, email, role, navigate])

  // Start resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true)
    }
  }, [resendTimer, canResend])

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus()
    }
  }, [])

  const handleInputChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = numericValue
      setOtp(newOtp)
      
      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs[index + 1].current?.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '')
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs[5].current?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          otp: otpString,
          role
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSuccess('Registration successful! Redirecting to login...')
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Registration successful! Please login with your credentials.' }
          })
        }, 2000)
      } else {
        setError(data.message || 'OTP verification failed')
        
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', ''])
        inputRefs[0].current?.focus()
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('OTP verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!canResend || resendTimer > 0) return
    
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          role,
          ...registrationData
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSuccess('New OTP sent to your email!')
        setOtp(['', '', '', '', '', ''])
        setResendTimer(60) // 60 seconds cooldown
        setCanResend(false)
        inputRefs[0].current?.focus()
      } else {
        setError(data.message || 'Failed to resend OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Resend OTP error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(role === 'donor' ? '/register' : '/org-register', {
      state: { formData: registrationData }
    })
  }

  if (!registrationData || !email || !role) {
    return (
      <div className="otp-verification-container">
        <div className="alert alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          Invalid registration data. Redirecting...
        </div>
      </div>
    )
  }

  return (
    <div className="otp-verification-container">
      <div className="otp-header">
        <h2>
          <i className="fas fa-shield-alt"></i>
          Verify Your Email
        </h2>
        <p>Enter the 6-digit code sent to your email</p>
        <div className="email-display">
          <strong>Verification email sent to:</strong><br />
          {email}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              className="otp-input"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={loading}
            />
          ))}
        </div>

        <div className="otp-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleBack}
            disabled={loading}
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Verify
              </>
            )}
          </button>
        </div>
      </form>

      <div className="resend-timer">
        {!canResend && resendTimer > 0 ? (
          <p>
            You can resend OTP in <span className="timer">{resendTimer}s</span>
          </p>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={handleResendOTP}
            disabled={loading || !canResend}
          >
            <i className="fas fa-redo"></i>
            Resend OTP
          </button>
        )}
      </div>

      <div className="alert alert-info" style={{ marginTop: '2rem' }}>
        <i className="fas fa-info-circle"></i>
        <strong>Important:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '20px' }}>
          <li>OTP expires in 5 minutes</li>
          <li>Check your spam folder if you don't see the email</li>
          <li>For security, never share your OTP with anyone</li>
        </ul>
      </div>
    </div>
  )
}

export default OTPVerification
