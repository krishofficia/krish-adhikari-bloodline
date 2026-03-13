import React, { useState, useEffect } from 'react'

function DonorDashboard() {
  const [donorData, setDonorData] = useState({
    name: '-',
    bloodGroup: '-',
    location: '-',
    email: '-',
    phone: '-'
  })
  const [isAvailable, setIsAvailable] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [bloodRequests, setBloodRequests] = useState([])
  const [donationHistory, setDonationHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [responseLoading, setResponseLoading] = useState({})

  useEffect(() => {
    // Load donor data from localStorage or API
    const loadDonorData = async () => {
      try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        
        if (user && user.fullName) {
          setDonorData({
            name: user.fullName || '-',
            bloodGroup: user.bloodGroup || '-',
            location: user.location || '-',
            email: user.email || '-',
            phone: user.phone || '-'
          })
          // Fix availability state - check both 'available' and 'availability' fields
          const availability = user.availability !== undefined ? user.availability : user.available
          const isAvailableStatus = availability === 'available'
          setIsAvailable(isAvailableStatus)
          console.log('Initial availability set to:', isAvailableStatus, 'from value:', availability)
        }

        // Load blood requests for this donor
        const response = await fetch('/api/donor/requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.data || [])
        }
      } catch (error) {
        console.error('Error loading donor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDonorData()
    
    // Load blood requests
    const loadBloodRequests = async () => {
      try {
        const token = localStorage.getItem('token')
        console.log('Loading blood requests with token:', token ? 'Token exists' : 'No token')
        
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        console.log('Current user:', user)
        
        const response = await fetch('/api/blood-requests/donor/requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('Blood requests response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Blood requests data:', data)
          console.log('Number of requests:', data.data?.length || 0)
          setBloodRequests(data.data || [])
        } else {
          const errorData = await response.text()
          console.error('Failed to load blood requests:', errorData)
          console.error('Response status:', response.status)
        }
      } catch (error) {
        console.error('Error loading blood requests:', error)
      }
    }

    loadBloodRequests()
    
    // Load donation history
    const loadDonationHistory = async () => {
      try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        console.log('Loading donation history for user:', user)
        
        const response = await fetch('/api/donor/donation-history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('Donation history response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Donation history data:', data)
          setDonationHistory(data.donations || [])
        } else {
          const errorData = await response.json()
          console.error('Failed to load donation history:', errorData)
        }
      } catch (error) {
        console.error('Error loading donation history:', error)
      }
    }

    loadDonationHistory()
  }, [])

  const handleAvailabilityToggle = async () => {
    console.log('Toggle button clicked! Current status:', isAvailable)
    console.log('New status will be:', !isAvailable)
    
    try {
      const token = localStorage.getItem('token')
      const newStatus = !isAvailable
      
      // Convert boolean to string values that match the Mongoose enum
      const availabilityValue = newStatus ? 'available' : 'not-available'
      
      console.log('Sending request to /api/auth/availability with:', { availability: availabilityValue })
      
      const response = await fetch('/api/auth/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability: availabilityValue })
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        
        // Update state immediately
        setIsAvailable(newStatus)
        
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        user.availability = availabilityValue
        localStorage.setItem('user', JSON.stringify(user))
        console.log('Availability updated successfully to:', availabilityValue)
        
        // Force a re-render by updating the donorData as well
        setDonorData(prev => ({
          ...prev,
          availability: availabilityValue
        }))
      } else {
        const errorData = await response.text()
        console.log('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleAcceptRequest = async (requestId) => {
    console.log('Accept request clicked for:', requestId)
    setResponseLoading(prev => ({ ...prev, [requestId]: true }))
    
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      console.log('Token exists:', !!token)
      console.log('User data:', user)
      console.log('User ID:', user._id)
      console.log('User ID type:', typeof user._id)
      
      // Try to get donorId from user object, or use a fallback
      let donorId = user._id || user.id || user.donorId
      
      // If still no ID, try to extract from token (basic approach)
      if (!donorId && token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]))
          donorId = tokenPayload.donorId || tokenPayload.id || tokenPayload._id
          console.log('Donor ID from token:', donorId)
        } catch (tokenError) {
          console.error('Error parsing token:', tokenError)
        }
      }
      
      console.log('Final donor ID:', donorId)
      console.log('Final donor ID type:', typeof donorId)
      
      if (!donorId) {
        alert('Error: Donor ID not found. Please log in again.')
        return
      }
      
      const requestBody = {
        donorId: donorId,
        donorName: user.fullName || user.name,
        donorEmail: user.email,
        donorPhone: user.phone || ''
      }
      console.log('Request body to send:', requestBody)
      
      const response = await fetch(`/api/blood-requests/donor/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Accept response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Accept response data:', data)
        // Remove the request from the list
        setBloodRequests(prev => prev.filter(req => req._id !== requestId))
        console.log('Request accepted and removed from list')
      } else {
        const errorData = await response.json()
        console.error('Failed to accept request:', errorData.message)
        alert('Failed to accept request: ' + errorData.message)
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      alert('Error accepting request: ' + error.message)
    } finally {
      setResponseLoading(prev => ({ ...prev, [requestId]: false }))
    }
  }

  const handleDeclineRequest = async (requestId) => {
    console.log('Decline request clicked for:', requestId)
    setResponseLoading(prev => ({ ...prev, [requestId]: true }))
    
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      console.log('Token exists:', !!token)
      console.log('User data:', user)
      console.log('User ID:', user._id)
      console.log('User ID type:', typeof user._id)
      
      // Try to get donorId from user object, or use a fallback
      let donorId = user._id || user.id || user.donorId
      
      // If still no ID, try to extract from token (basic approach)
      if (!donorId && token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]))
          donorId = tokenPayload.donorId || tokenPayload.id || tokenPayload._id
          console.log('Donor ID from token:', donorId)
        } catch (tokenError) {
          console.error('Error parsing token:', tokenError)
        }
      }
      
      console.log('Final donor ID:', donorId)
      console.log('Final donor ID type:', typeof donorId)
      
      if (!donorId) {
        alert('Error: Donor ID not found. Please log in again.')
        return
      }
      
      const requestBody = {
        donorId: donorId,
        donorName: user.fullName || user.name,
        donorEmail: user.email,
        donorPhone: user.phone || ''
      }
      console.log('Request body to send:', requestBody)
      
      const response = await fetch(`/api/blood-requests/donor/${requestId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Decline response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Decline response data:', data)
        // Remove the request from the list
        setBloodRequests(prev => prev.filter(req => req._id !== requestId))
        console.log('Request declined and removed from list')
      } else {
        const errorData = await response.json()
        console.error('Failed to decline request:', errorData.message)
        alert('Failed to decline request: ' + errorData.message)
      }
    } catch (error) {
      console.error('Error declining request:', error)
      alert('Error declining request: ' + error.message)
    } finally {
      setResponseLoading(prev => ({ ...prev, [requestId]: false }))
    }
  }

  const handleDeleteDonation = async (donationId) => {
    if (!confirm('Are you sure you want to delete this donation record? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/donor/donation-history/${donationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Remove donation from history
        setDonationHistory(prev => prev.filter(donation => donation._id !== donationId))
        alert('Donation record deleted successfully')
      } else {
        const errorData = await response.json()
        alert('Failed to delete donation record: ' + errorData.message)
      }
    } catch (error) {
      console.error('Error deleting donation record:', error)
      alert('Error deleting donation record')
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
        <p>Loading dashboard...</p>
      </div>
    )
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
            <li><a href="#home">Home</a></li>
            <li>
              <button onClick={handleLogout} className="logout-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Dashboard Section */}
      <section className="dashboard-section">
        <div className="container">
          <h1 className="dashboard-title">
            <i className="fas fa-user-circle"></i>
            Donor Dashboard
          </h1>

          {/* Profile Card */}
          <div className="dashboard-card profile-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-id-card"></i>
                Your Profile
              </h2>
            </div>
            <div className="profile-content">
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-user"></i>
                    Name:
                  </span>
                  <span className="info-value">{donorData.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-tint"></i>
                    Blood Group:
                  </span>
                  <span className="info-value blood-badge">{donorData.bloodGroup}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-map-marker-alt"></i>
                    Location:
                  </span>
                  <span className="info-value">{donorData.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-envelope"></i>
                    Email:
                  </span>
                  <span className="info-value">{donorData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-phone"></i>
                    Phone:
                  </span>
                  <span className="info-value">{donorData.phone}</span>
                </div>
              </div>
              <div className="availability-toggle">
                <label className="toggle-label">
                  <span className="toggle-text">Availability Status:</span>
                  <button 
                    onClick={handleAvailabilityToggle}
                    className={`toggle-btn ${!isAvailable ? 'unavailable' : ''}`}
                  >
                    <span>{isAvailable ? 'Available' : 'Not Available'}</span>
                    <i className={`fas fa-toggle-${isAvailable ? 'on' : 'off'}`}></i>
                  </button>
                </label>
              </div>
            </div>
          </div>

          {/* Blood Requests Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-tint"></i>
                Blood Requests
              </h2>
            </div>
            <div className="blood-requests-list">
              {bloodRequests.length > 0 ? (
                bloodRequests.map((request, index) => (
                  <div key={index} className="blood-request-item">
                    <div className="request-header">
                      <span className="request-title">
                        <i className="fas fa-hospital"></i>
                        {request.organizationName?.name || 'Hospital Request'}
                      </span>
                      <span className={`urgency-badge urgency-${request.urgencyLevel?.toLowerCase()}`}>
                        {request.urgencyLevel}
                      </span>
                    </div>
                    <div className="request-details">
                      <p><strong>Blood Group:</strong> {request.bloodGroup}</p>
                      <p><strong>Location:</strong> {request.location}</p>
                      <p><strong>Hospital:</strong> {request.hospitalName}</p>
                      <p><strong>Required Date:</strong> {new Date(request.requiredDate).toLocaleDateString()}</p>
                      <p><strong>Quantity:</strong> {request.quantity} units</p>
                    </div>
                    <div className="request-actions">
                      <button 
                        className="btn btn-accept"
                        onClick={() => {
                          console.log('Accept button clicked!');
                          handleAcceptRequest(request._id);
                        }}
                        disabled={responseLoading[request._id]}
                      >
                        {responseLoading[request._id] ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check"></i>
                            Accept Request
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-decline"
                        onClick={() => {
                          console.log('Decline button clicked!');
                          handleDeclineRequest(request._id);
                        }}
                        disabled={responseLoading[request._id]}
                      >
                        {responseLoading[request._id] ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-times"></i>
                            Decline Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-tint"></i>
                  <p>No blood requests available</p>
                </div>
              )}
            </div>
          </div>

          {/* Donation History Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-history"></i>
                Donation History
              </h2>
              <span className="badge" style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                {donationHistory.length} {donationHistory.length === 1 ? 'Donation' : 'Donations'}
              </span>
            </div>
            <div className="donation-history-list">
              {donationHistory.length > 0 ? (
                donationHistory.map((donation, index) => (
                  <div key={index} className="donation-item">
                    <div className="donation-header">
                      <span className="donation-title">
                        <i className="fas fa-hospital"></i>
                        {donation.organizationName || 'Hospital Donation'}
                      </span>
                      <span className="donation-date">
                        <i className="fas fa-calendar"></i>
                        {new Date(donation.donationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="donation-details">
                      <p><strong>Blood Group:</strong> {donation.bloodGroup}</p>
                      <p><strong>Location:</strong> {donation.location}</p>
                      <p><strong>Units Donated:</strong> {donation.units || 1} unit(s)</p>
                      {donation.completionDate && (
                        <p><strong>Completed:</strong> {new Date(donation.completionDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="donation-actions">
                      <span className={`status-badge status-${donation.status?.toLowerCase() || 'completed'}`}>
                        <i className="fas fa-trophy"></i>
                        {donation.status || 'Completed'}
                      </span>
                      <button 
                        className="btn btn-delete"
                        onClick={() => handleDeleteDonation(donation._id)}
                        title="Delete donation record"
                        style={{ marginLeft: 'auto' }}
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-history"></i>
                  <p>No donation history available</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                    Your completed donations will appear here
                  </p>
                </div>
              )}
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

export default DonorDashboard
