import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ChangePassword from '../components/ChangePassword'
import '../components/ChangePasswordButton.css'
import { apiFetch } from '../api'

// Add custom CSS for form styling
const formStyles = `
  .request-form .form-group input,
  .request-form .form-group select {
    padding: 0.875rem;
    border: 2px solid #d32f2f !important;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    font-family: inherit;
    background: #ffffff;
    color: #212121 !important;
  }
  
  .request-form .form-group input:focus,
  .request-form .form-group select:focus {
    outline: none;
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1);
  }
  
  .request-form .form-group input::placeholder {
    color: #999;
  }
  
  /* Specific styling for date input */
  .request-form .form-group input[type="date"] {
    color: #212121 !important;
  }
  
  .request-form .form-group input[type="date"]::-webkit-calendar-picker-indicator {
    color: #d32f2f;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .request-form .form-group input[type="date"]::-webkit-inner-spin-button,
  .request-form .form-group input[type="date"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  /* Firefox date input styling */
  .request-form .form-group input[type="date"]::-moz-focus-inner {
    border: 0;
  }
`;

function OrgDashboard() {
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

  const [requestData, setRequestData] = useState({
    bloodGroup: '',
    quantity: '',
    hospitalName: '',
    location: '',
    urgencyLevel: '',
    requiredDate: ''
  })
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const [editingRequest, setEditingRequest] = useState(null)
  const [showDonorsModal, setShowDonorsModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [donorLocations, setDonorLocations] = useState([])
  const [mapLoading, setMapLoading] = useState(true)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [showChangePassword, setShowChangePassword] = useState(false)

  // Inject custom CSS styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = formStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
    fetchDonorLocations()
    
    // Set up live updates every 10 seconds
    const interval = setInterval(() => {
      fetchDonorLocations()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  // Initialize map when component mounts and donor locations change
  useEffect(() => {
    console.log('🗺️ Map useEffect triggered:', {
      hasMap: !!mapInstanceRef.current,
      donorLocationsCount: donorLocations.length,
      mapLoading
    })
    
    if (!mapInstanceRef.current && donorLocations.length > 0) {
      console.log('🗺️ Initializing map...')
      initializeMap()
    } else if (mapInstanceRef.current && donorLocations.length > 0) {
      console.log('🗺️ Updating map markers...')
      updateMapMarkers()
    } else if (donorLocations.length === 0 && !mapLoading) {
      console.log('🗺️ No donor locations to display')
    }
  }, [donorLocations]) // Remove mapLoading from dependencies

  // Initialize the Leaflet map
  const initializeMap = () => {
    console.log('🗺️ initializeMap called:', {
      mapRef: !!mapRef.current,
      mapInstance: !!mapInstanceRef.current
    })
    
    if (mapRef.current && !mapInstanceRef.current) {
      try {
        // Calculate center point from donor locations or default to Biratnagar
        let centerLat = 26.4525, centerLng = 87.2718 // Biratnagar default
        
        if (donorLocations.length > 0) {
          // Calculate average center from all donor locations
          centerLat = donorLocations.reduce((sum, donor) => sum + donor.lat, 0) / donorLocations.length
          centerLng = donorLocations.reduce((sum, donor) => sum + donor.lng, 0) / donorLocations.length
          console.log('🗺️ Calculated center from donor locations:', { centerLat, centerLng })
        }
        
        // Create map instance
        const map = L.map(mapRef.current).setView([centerLat, centerLng], 12)
        console.log('🗺️ Map instance created centered on:', { centerLat, centerLng })
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)
        console.log('🗺️ Map tiles added')
        
        // Store map instance
        mapInstanceRef.current = map
        console.log('🗺️ Map instance stored')
        
        // Add initial markers
        updateMapMarkers()
      } catch (error) {
        console.error('🗺️ Error initializing map:', error)
      }
    } else {
      console.log('🗺️ Cannot initialize map:', {
        hasMapRef: !!mapRef.current,
        hasMapInstance: !!mapInstanceRef.current
      })
    }
  }

  // Update map markers with current donor locations
  const updateMapMarkers = () => {
    const map = mapInstanceRef.current
    console.log('🗺️ updateMapMarkers called:', {
      hasMap: !!map,
      donorLocationsCount: donorLocations.length,
      currentMarkersCount: markersRef.current.length
    })
    
    if (!map) {
      console.log('🗺️ No map instance available')
      return
    }
    
    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        map.removeLayer(marker)
      })
      markersRef.current = []
      console.log('🗺️ Cleared existing markers')
      
      // Add new markers
      console.log('🗺️ Starting to add markers for', donorLocations.length, 'donors')
      
      donorLocations.forEach((donor, index) => {
        console.log(`🗺️ Processing donor ${index + 1}/${donorLocations.length}:`, {
          name: donor.name,
          lat: donor.lat,
          lng: donor.lng,
          availability: donor.availability
        })
        
        const markerColor = donor.availability === 'available' ? '#28a745' : '#dc3545'
        
        try {
          // Create custom icon
          const customIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${markerColor};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
              ">
                ${donor.bloodGroup}
              </div>
            `,
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
          
          // Create marker
          const marker = L.marker([donor.lat, donor.lng], { icon: customIcon })
          
          // Create popup content
          const popupContent = `
            <div style="min-width: 220px; font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 12px 0; color: #d32f2f; font-size: 16px; border-bottom: 2px solid #d32f2f; padding-bottom: 6px;">${donor.name}</h4>
              
              <div style="margin-bottom: 8px;">
                <span style="display: inline-block; background: #d32f2f; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${donor.bloodGroup}</span>
              </div>
              
              <p style="margin: 6px 0; font-size: 13px; color: #555;">
                <strong style="color: #333;">📧 Email:</strong> ${donor.email}
              </p>
              
              <p style="margin: 6px 0; font-size: 13px; color: #555;">
                <strong style="color: #333;">📞 Phone:</strong> ${donor.phone}
              </p>
              
              <p style="margin: 6px 0; font-size: 13px; color: #555;">
                <strong style="color: #333;">📍 Availability:</strong> 
                <span style="color: ${donor.availability === 'available' ? '#28a745' : '#dc3545'}; font-weight: bold; margin-left: 4px;">
                  ${donor.availability === 'available' ? '✅ Available' : '❌ Not Available'}
                </span>
              </p>
              
              <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #d32f2f;">
                <p style="margin: 0; font-size: 13px; color: #555;">
                  <strong style="color: #333;">🩸 Last Donation:</strong> 
                  <span style="color: ${donor.lastDonation === 'No donations yet' ? '#6c757d' : '#d32f2f'}; font-weight: bold; margin-left: 4px;">
                    ${donor.lastDonation}
                  </span>
                </p>
              </div>
            </div>
          `
          
          marker.bindPopup(popupContent)
          marker.addTo(map)
          markersRef.current.push(marker)
          console.log(`🗺️ ✅ Marker ${index + 1} added successfully for ${donor.name}`)
        } catch (markerError) {
          console.error(`🗺️ ❌ Error creating marker for ${donor.name}:`, markerError)
        }
      })
      
      console.log(`🗺️ Final marker count: ${markersRef.current.length}/${donorLocations.length}`)
      
      // Adjust map bounds to show all markers
      if (donorLocations.length > 0) {
        const bounds = L.latLngBounds(donorLocations.map(donor => [donor.lat, donor.lng]))
        map.fitBounds(bounds, { padding: [50, 50] })
        console.log('🗺️ Map bounds adjusted to show all markers')
      }
    } catch (error) {
      console.error('🗺️ Error updating markers:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Loading dashboard data with token:', token)
      
      // Load organization's blood requests
      const requestsResponse = await apiFetch('/api/blood-requests')
      
      console.log('Requests response status:', requestsResponse.status)
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        console.log('Requests data:', requestsData)
        console.log('Number of requests:', requestsData.data?.length || 0)
        setRequests(requestsData.data || [])
        
        // Log each request for debugging
        requestsData.data?.forEach((request, index) => {
          console.log(`Request ${index + 1}:`, {
            id: request._id,
            bloodGroup: request.bloodGroup,
            quantity: request.quantity,
            hospitalName: request.hospitalName,
            status: request.status
          })
        })
      } else {
        const errorData = await requestsResponse.text()
        console.log('Requests error:', errorData)
        setError('Failed to load blood requests')
      }

      // Load available donors
      try {
        const donorsResponse = await apiFetch('/api/blood-requests/available-donors')
        
        if (donorsResponse.ok) {
          const donorsData = await donorsResponse.json()
          console.log('Available donors data:', donorsData)
          setDonors(donorsData.data || [])
        } else {
          console.log('Failed to load donors, status:', donorsResponse.status)
        }
      } catch (donorError) {
        console.error('Error loading available donors:', donorError)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  // Fetch donor locations for the map
  const fetchDonorLocations = async () => {
    console.log('🗺️ Starting fetchDonorLocations...')
    try {
      const token = localStorage.getItem('token')
      console.log('🗺️ Token:', token ? 'exists' : 'missing')
      
      // Use the existing working endpoint for donors
      const response = await apiFetch('/api/blood-requests/available-donors')
      
      console.log('🗺️ API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🗺️ Raw donor data:', data)
        
        if (!data.data || !Array.isArray(data.data)) {
          console.log('🗺️ Invalid data format:', data)
          setDonorLocations([])
          setMapLoading(false)
          return
        }
        
        console.log('🗺️ Number of donors:', data.data.length)
        
        // Log each donor's location format
        data.data.forEach((donor, index) => {
          console.log(`🗺️ Donor ${index + 1}:`, {
            name: donor.fullName || donor.name,
            location: donor.location,
            hasLocation: !!(donor.location && donor.location.includes(','))
          })
        })
        
        // Filter donors with valid coordinates and format for map
        const locations = data.data
          .map((donor, index) => {
            let location = donor.location
            
            // If donor has no coordinates, try to detect from their location field
            if (!location || !location.includes(',')) {
              const donorLocation = (donor.location || '').toLowerCase()
              
              // Detect city and assign appropriate coordinates
              if (donorLocation.includes('kathmandu') || donorLocation.includes('ktm')) {
                location = '27.7172,85.3240' // Kathmandu center
                console.log(`🗺️ Detected Kathmandu location for ${donor.fullName || donor.name}:`, location)
              } else if (donorLocation.includes('biratnagar') || donorLocation.includes('brt')) {
                location = '26.4525,87.2718' // Biratnagar center
                console.log(`🗺️ Detected Biratnagar location for ${donor.fullName || donor.name}:`, location)
              } else if (donorLocation.includes('pokhara') || donorLocation.includes('pkr')) {
                location = '28.2096,83.9856' // Pokhara center
                console.log(`🗺️ Detected Pokhara location for ${donor.fullName || donor.name}:`, location)
              } else if (donorLocation.includes('lalitpur') || donorLocation.includes('ltp')) {
                location = '27.6588,85.3247' // Lalitpur center
                console.log(`🗺️ Detected Lalitpur location for ${donor.fullName || donor.name}:`, location)
              } else if (donorLocation.includes('bhaktapur') || donorLocation.includes('bkt')) {
                location = '27.6711,85.4298' // Bhaktapur center
                console.log(`🗺️ Detected Bhaktapur location for ${donor.fullName || donor.name}:`, location)
              } else if (donorLocation.includes('birgunj') || donorLocation.includes('brg')) {
                location = '27.0160,84.8660' // Birgunj center
                console.log(`🗺️ Detected Birgunj location for ${donor.fullName || donor.name}:`, location)
              } else if (donorLocation.includes('dharan') || donorLocation.includes('dhr')) {
                location = '26.8156,87.2830' // Dharan center
                console.log(`🗺️ Detected Dharan location for ${donor.fullName || donor.name}:`, location)
              } else {
                // If no city detected, use a mix of major cities for variety
                const majorCities = [
                  '27.7172,85.3240', // Kathmandu
                  '26.4525,87.2718', // Biratnagar
                  '28.2096,83.9856', // Pokhara
                  '27.6588,85.3247', // Lalitpur
                  '27.6711,85.4298', // Bhaktapur
                  '27.0160,84.8660', // Birgunj
                  '26.8156,87.2830', // Dharan
                  '26.4600,87.2800'  // Biratnagar area
                ]
                location = majorCities[index % majorCities.length]
                console.log(`🗺️ Using major city coordinates for ${donor.fullName || donor.name}:`, location)
              }
            }
            
            let [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()))
            
            // Add small offset for donors with same coordinates to prevent overlap
            const sameLocationDonors = data.data.filter(d => 
              (d.location || '').toLowerCase() === (donor.location || '').toLowerCase()
            )
            
            if (sameLocationDonors.length > 1) {
              const donorIndex = sameLocationDonors.findIndex(d => d._id === donor._id)
              const offset = 0.002 // Small offset in degrees (about 200-300 meters)
              lat += (donorIndex % 3) * offset
              lng += Math.floor(donorIndex / 3) * offset
              console.log(`🗺️ Added offset for ${donor.fullName || donor.name}:`, { lat, lng, originalIndex: donorIndex })
            }
            
            const isValid = !isNaN(lat) && !isNaN(lng)
            console.log(`🗺️ Parsing coordinates for ${donor.fullName || donor.name}:`, {
              original: location,
              parsed: { lat, lng },
              valid: isValid
            })
            
            if (isValid) {
              return {
                id: donor._id,
                name: donor.fullName || donor.name,
                bloodGroup: donor.bloodGroup,
                email: donor.email,
                phone: donor.phone,
                availability: donor.availability || 'available',
                lastDonation: donor.lastDonation || 'Unknown',
                lat,
                lng,
                location: location
              }
            }
            return null
          })
          .filter(Boolean)
        
        console.log('🗺️ Final valid locations:', locations)
        
        // Debug: Check if locations array has correct length
        console.log('🗺️ Expected donors:', data.data.length)
        console.log('🗺️ Processed locations:', locations.length)
        
        if (locations.length !== data.data.length) {
          console.log('🗺️ WARNING: Some donors were filtered out!')
          data.data.forEach((donor, index) => {
            const processed = locations.find(loc => loc.id === donor._id)
            console.log(`🗺️ Donor ${donor.fullName || donor.name}:`, processed ? '✅ Processed' : '❌ Filtered out')
          })
        }
        
        setDonorLocations(locations)
        setMapLoading(false)
      } else {
        const errorText = await response.text()
        console.error('🗺️ Failed to fetch donor locations:', response.status, errorText)
        setMapLoading(false)
      }
    } catch (error) {
      console.error('🗺️ Error fetching donor locations:', error)
      setMapLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // For creating new request, use POST /api/blood-requests
      // For updating, use PUT /api/blood-requests/:id
      let url, method
      if (editingRequest) {
        url = `/api/blood-requests/${editingRequest._id}`
        method = 'PUT'
      } else {
        url = '/api/blood-requests'
        method = 'POST'
      }

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(requestData)
      })

      console.log('Submit response status:', response.status)
      console.log('Submit URL:', url)
      console.log('Submit method:', method)
      console.log('Submit data:', requestData)

      const data = await response.json()
      console.log('Submit response data:', data)

      if (response.ok) {
        setSuccess(editingRequest ? 'Request updated successfully!' : 'Request created successfully!')
        setRequestData({
          bloodGroup: '',
          quantity: '',
          hospitalName: '',
          location: '',
          urgencyLevel: '',
          requiredDate: ''
        })
        setEditingRequest(null)
        // Refresh data to show new request
        await loadDashboardData()
      } else {
        setError(data.message || 'Failed to save request')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (request) => {
    console.log('Editing request:', request)
    
    // Format the date for input field (YYYY-MM-DD)
    const formattedDate = new Date(request.requiredDate).toISOString().split('T')[0]
    
    console.log('Formatted date:', formattedDate)
    
    setRequestData({
      bloodGroup: request.bloodGroup,
      quantity: request.quantity,
      hospitalName: request.hospitalName,
      location: request.location,
      urgencyLevel: request.urgencyLevel,
      requiredDate: formattedDate
    })
    setEditingRequest(request)
    
    console.log('Form data set for editing:', {
      bloodGroup: request.bloodGroup,
      quantity: request.quantity,
      hospitalName: request.hospitalName,
      location: request.location,
      urgencyLevel: request.urgencyLevel,
      requiredDate: formattedDate
    })
  }

  const handleDelete = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/blood-requests/delete/${requestId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('Blood request deleted successfully!', 'success')
        // Refresh data to remove deleted request
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      showNotification('Error deleting blood request', 'error')
    }
  }

  const handleDonationComplete = async (requestId, donorId) => {
    if (!confirm('Are you sure you want to mark this donation as complete?')) return

    try {
      const token = localStorage.getItem('token')
      
      // Find the donor response to get donor details
      const selectedDonor = selectedRequest?.donorResponses?.find(r => r.donorId === donorId)
      
      if (!selectedDonor) {
        showNotification('Donor information not found', 'error')
        return
      }

      const response = await apiFetch(`/api/blood-requests/${requestId}/donation-complete`, {
        method: 'POST',
        body: JSON.stringify({
          donorId: selectedDonor.donorId,
          donorName: selectedDonor.fullName,
          donorEmail: selectedDonor.email,
          donorPhone: selectedDonor.phone,
          donationDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        showNotification('Donation marked as complete! Thank you email sent.', 'success')
        // Refresh data to show updated status
        await loadDashboardData()
        // Close modal
        setShowDonorsModal(false)
        setSelectedRequest(null)
      } else {
        const errorData = await response.json()
        showNotification('Failed to mark donation complete: ' + errorData.message, 'error')
      }
    } catch (error) {
      console.error('Error marking donation complete:', error)
      showNotification('Error marking donation complete', 'error')
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' })
    }, 3000)
  }

  const handleCancel = () => {
    setRequestData({
      bloodGroup: '',
      quantity: '',
      hospitalName: '',
      location: '',
      urgencyLevel: '',
      requiredDate: ''
    })
    setEditingRequest(null)
    setError('')
    setSuccess('')
  }

  const handleViewDonors = (request) => {
    setSelectedRequest(request)
    setShowDonorsModal(true)
  }

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this blood request?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/blood-requests/${requestId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Blood request deleted successfully!')
        await loadDashboardData()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to delete request')
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      setError('Network error while deleting request')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
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
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li><a href="#home" onClick={closeMenu}>Home</a></li>
            <li>
              <button onClick={() => { setShowChangePassword(true); closeMenu(); }} className="change-password-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: '0.5rem 1rem', fontWeight: '500' }}>
                <i className="fas fa-key"></i>
                Change Password
              </button>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', fontWeight: '500' }}>
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </li>
          </ul>
          <div className="hamburger" onClick={toggleMenu}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </div>
        </div>
      </nav>

      {/* Dashboard Section */}
      <section className="dashboard-section">
        <div className="container">
          <h1 className="dashboard-title">
            <i className="fas fa-building"></i>
            Organization Dashboard
          </h1>

          {/* Blood Request Management */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-hand-holding-heart"></i>
                Blood Request Management
              </h2>
            </div>
            
            {/* Blood Request Form */}
            <div className="request-form-container">
              <h3>{editingRequest ? 'Edit Blood Request' : 'Create New Blood Request'}</h3>
              <form onSubmit={handleSubmit} className="request-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bloodGroup">
                      <i className="fas fa-tint"></i>
                      Blood Group *
                    </label>
                    <select 
                      id="bloodGroup" 
                      name="bloodGroup" 
                      required
                      value={requestData.bloodGroup}
                      onChange={handleInputChange}
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantity">
                      <i className="fas fa-vial"></i>
                      Quantity (Units) *
                    </label>
                    <input 
                      type="number" 
                      id="quantity" 
                      name="quantity" 
                      min="1" 
                      required 
                      placeholder="Enter quantity"
                      value={requestData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hospitalName">
                      <i className="fas fa-hospital"></i>
                      Hospital Name *
                    </label>
                    <input 
                      type="text" 
                      id="hospitalName" 
                      name="hospitalName" 
                      required 
                      placeholder="Enter hospital name"
                      value={requestData.hospitalName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">
                      <i className="fas fa-map-marker-alt"></i>
                      Location *
                    </label>
                    <input 
                      type="text" 
                      id="location" 
                      name="location" 
                      required 
                      placeholder="Enter location"
                      value={requestData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="urgencyLevel">
                      <i className="fas fa-exclamation-triangle"></i>
                      Urgency Level *
                    </label>
                    <select 
                      id="urgencyLevel" 
                      name="urgencyLevel" 
                      required
                      value={requestData.urgencyLevel}
                      onChange={handleInputChange}
                    >
                      <option value="">Select urgency</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="requiredDate">
                      <i className="fas fa-calendar"></i>
                      Required Date *
                    </label>
                    <input 
                      type="date" 
                      id="requiredDate" 
                      name="requiredDate" 
                      required
                      value={requestData.requiredDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Notification */}
                {notification.show && (
                  <div className={`notification ${notification.type} show`}>
                    <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-triangle'}`}></i>
                    {notification.message}
                  </div>
                )}

                <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <i className="fas fa-paper-plane"></i>
                    {loading ? 'Saving...' : (editingRequest ? 'Update Request' : 'Create Request')}
                  </button>
                  {editingRequest && (
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} style={{ marginLeft: '1rem' }}>
                      <i className="fas fa-times"></i>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Blood Requests List */}
            <div className="requests-list-container">
              <h3>Your Blood Requests</h3>
              {loading ? (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                  Loading...
                </div>
              ) : (
                <div className="requests-table">
                  {requests.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Blood Group</th>
                          <th>Quantity</th>
                          <th>Hospital</th>
                          <th>Location</th>
                          <th>Urgency</th>
                          <th>Required Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request, index) => (
                          <tr key={index}>
                            <td>
                              <span className="blood-badge">{request.bloodGroup}</span>
                            </td>
                            <td>{request.quantity}</td>
                            <td>{request.hospitalName}</td>
                            <td>{request.location}</td>
                            <td>
                              <span className={`urgency-badge urgency-${request.urgencyLevel.toLowerCase()}`}>
                                {request.urgencyLevel}
                              </span>
                            </td>
                            <td>{new Date(request.requiredDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge status-${request.status.toLowerCase()}`}>
                                {request.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn btn-view" 
                                  onClick={() => handleViewDonors(request)}
                                >
                                  <i className="fas fa-users"></i>
                                  View Donors ({request.donorResponses?.length || 0})
                                </button>
                                <button 
                                  className="btn btn-edit" 
                                  onClick={() => handleEdit(request)}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-delete" 
                                  onClick={() => handleDeleteRequest(request._id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-clipboard-list"></i>
                      <p>No blood requests found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Donor List Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-users"></i>
                Available Donors
              </h2>
            </div>
            <div className="donor-table">
              {donors.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Blood Group</th>
                      <th>Location</th>
                      <th>Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((donor, index) => (
                      <tr key={index}>
                        <td>{donor.name}</td>
                        <td>
                          <span className={`blood-group-badge bg-${donor.bloodGroup.toLowerCase().replace('+', 'plus').replace('-', 'minus')}`}>
                            {donor.bloodGroup}
                          </span>
                        </td>
                        <td>{donor.location}</td>
                        <td>
                          <span className={`status-badge ${donor.available ? 'status-available' : 'status-not-available'}`}>
                            {donor.available ? 'Available' : 'Not Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-users"></i>
                  <p>No available donors found</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Donor Locations Map */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-map"></i>
                Live Donor Locations
              </h2>
              <div className="map-controls">
                <span className="live-indicator">
                  <i className="fas fa-circle" style={{ color: '#28a745', fontSize: '8px' }}></i>
                  Live Updates Every 10s
                </span>
                <button 
                  className="btn btn-refresh"
                  onClick={fetchDonorLocations}
                  disabled={mapLoading}
                  style={{ 
                    marginLeft: '10px', 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: mapLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <i className="fas fa-sync-alt"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="map-container">
              {mapLoading ? (
                <div className="map-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading donor locations...</p>
                </div>
              ) : donorLocations.length === 0 ? (
                <div className="map-empty">
                  <i className="fas fa-map-marked-alt"></i>
                  <p>No donor locations available</p>
                  <p className="map-note">Make sure donors have location coordinates set in their profiles.</p>
                </div>
              ) : (
                <div 
                  ref={mapRef} 
                  className="donor-map"
                  style={{ 
                    height: '400px', 
                    width: '100%', 
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}
                ></div>
              )}
            </div>
            {donorLocations.length > 0 && (
              <div className="map-legend">
                <h4><i className="fas fa-info-circle"></i> Legend</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-marker" style={{ backgroundColor: '#28a745' }}></div>
                    <span>Available Donor</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-marker" style={{ backgroundColor: '#dc3545' }}></div>
                    <span>Not Available</span>
                  </div>
                </div>
                <p className="map-stats">
                  <strong>Total Donors:</strong> {donorLocations.length} | 
                  <strong>Available:</strong> {donorLocations.filter(d => d.availability === 'available').length}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Donor Responses Modal */}
      {showDonorsModal && selectedRequest && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fas fa-users"></i> Donor Responses</h3>
              <button className="close-btn" onClick={() => setShowDonorsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="request-info">
                <h4>Blood Request Details</h4>
                <p><strong>Blood Group:</strong> {selectedRequest.bloodGroup}</p>
                <p><strong>Quantity:</strong> {selectedRequest.quantity} units</p>
                <p><strong>Hospital:</strong> {selectedRequest.hospitalName}</p>
                <p><strong>Location:</strong> {selectedRequest.location}</p>
                <p><strong>Urgency:</strong> {selectedRequest.urgencyLevel}</p>
              </div>
              
              <div className="donor-responses">
                <h4>Donors Who Responded ({selectedRequest.donorResponses?.length || 0})</h4>
                {selectedRequest.donorResponses && selectedRequest.donorResponses.length > 0 ? (
                  <table className="donor-responses-table">
                    <thead>
                      <tr>
                        <th>Donor Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Response Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.donorResponses.map((response, index) => (
                        <tr key={index}>
                          <td>{response.donorName}</td>
                          <td>{response.donorEmail}</td>
                          <td>{response.donorPhone}</td>
                          <td>{new Date(response.responseDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge status-${response.status.toLowerCase()}`}>
                              {response.status}
                            </span>
                          </td>
                          <td>
                            {response.status.toLowerCase() === 'accepted' && (
                              <button
                                className="btn btn-complete"
                                onClick={() => handleDonationComplete(selectedRequest._id, response.donorId)}
                                title="Mark donation as complete and send thank you email"
                              >
                                <i className="fas fa-check-circle"></i>
                                Complete
                              </button>
                            )}
                            {response.status.toLowerCase() === 'completed' && (
                              <span className="completed-badge">
                                <i className="fas fa-trophy"></i>
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-users"></i>
                    <p>No donors have responded to this request yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Bloodline. All rights reserved.</p>
        </div>
      </footer>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePassword 
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            console.log('Password changed successfully');
            setShowChangePassword(false);
          }}
        />
      )}
    </div>
  )
}

export default OrgDashboard
