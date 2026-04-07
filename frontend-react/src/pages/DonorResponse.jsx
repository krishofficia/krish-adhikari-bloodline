import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

function DonorResponse() {
  const { requestId, action } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requestDetails, setRequestDetails] = useState(null)
  const [donorInfo, setDonorInfo] = useState(null)

  useEffect(() => {
    loadRequestDetails()
  }, [])

  const loadRequestDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      if (!token || !user._id) {
        // Redirect to clean homepage
        navigate('/')
        return
      }

      // Get request details
      const response = await apiFetch(`/api/blood-requests/donor/${requestId}`)

      if (response.ok) {
        const data = await response.json()
        setRequestDetails(data.data)
        setDonorInfo({
          donorId: user._id,
          donorName: user.fullName,
          donorEmail: user.email,
          donorPhone: user.phone || ''
        })
      } else {
        setError('Failed to load request details')
      }
    } catch (error) {
      console.error('Error loading request details:', error)
      setError('Error loading request details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!action || !requestDetails || !donorInfo) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const endpoint = action === 'accept' 
        ? `/api/blood-requests/donor/${requestId}/accept`
        : `/api/blood-requests/donor/${requestId}/decline`

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(donorInfo)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message)
        
        // Redirect to donor dashboard after 3 seconds
        setTimeout(() => {
          navigate('/donor/dashboard')
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to submit response')
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      setError('Error submitting response')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !requestDetails) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: '50px', height: '50px', margin: '0 auto', fontSize: '3rem', color: 'var(--primary-color)' }}></div>
          <p style={{ marginTop: '1rem', color: '#6c757d' }}>Loading request details...</p>
        </div>
      </div>
    )
  }

  if (error && !requestDetails) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>❌</div>
            <h2 className="form-title" style={{ marginBottom: '1rem' }}>Error</h2>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => navigate('/donor/dashboard')}
              className="btn"
              style={{ backgroundColor: '#dc3545' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '1rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Blood Request Response</h1>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="auth-card">
            {success ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#28a745' }}>
                  {action === 'accept' ? '✅' : '📝'}
                </div>
                <h2 className="form-title" style={{ marginBottom: '1rem' }}>
                  {action === 'accept' ? 'Request Accepted!' : 'Response Recorded'}
                </h2>
                <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>{success}</p>
                <p style={{ color: '#6c757d' }}>Redirecting to dashboard...</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className="form-title" style={{ marginBottom: '1rem' }}>
                    Blood Request Details
                  </h2>
                  {requestDetails && (
                    <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Organization</p>
                          <p style={{ fontWeight: '600' }}>{requestDetails.organizationId?.name || 'Hospital'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Blood Group</p>
                          <p style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{requestDetails.bloodGroup}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Location</p>
                          <p style={{ fontWeight: '600' }}>{requestDetails.location}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Hospital</p>
                          <p style={{ fontWeight: '600' }}>{requestDetails.hospitalName}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Units Needed</p>
                          <p style={{ fontWeight: '600' }}>{requestDetails.quantity} units</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Required Date</p>
                          <p style={{ fontWeight: '600' }}>
                            {new Date(requestDetails.requiredDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #bbdefb', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1976d2' }}>
                    Confirm Your Response
                  </h3>
                  <p style={{ color: '#424242', lineHeight: '1.5' }}>
                    You are about to <strong>{action}</strong> this blood request.
                  </p>
                  {action === 'accept' ? (
                    <p style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                      By accepting, you commit to donating blood for this request. 
                      The hospital will contact you with further details.
                    </p>
                  ) : (
                    <p style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                      Thank you for considering this request. We understand that 
                      circumstances may prevent you from donating at this time.
                    </p>
                  )}
                </div>

                {error && (
                  <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <p style={{ color: '#721c24', margin: 0 }}>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={loading}
                    className={`btn flex-1 ${loading ? 'loading' : ''}`}
                    style={{
                      backgroundColor: action === 'accept' ? '#28a745' : '#dc3545',
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: '0.5rem', border: '2px solid white', borderTop: '2px solid transparent' }}></div>
                        Processing...
                      </span>
                    ) : (
                      <>
                        {action === 'accept' ? '✅ Accept Request' : '❌ Decline Request'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/donor/dashboard')}
                    className="btn"
                    style={{
                      backgroundColor: 'white',
                      color: '#6c757d',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorResponse
