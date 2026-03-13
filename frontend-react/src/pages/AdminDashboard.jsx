import React, { useState, useEffect } from 'react'
import '../admin-styles.css'

function AdminDashboard() {
  console.log('AdminDashboard component rendering...')
  
  const [activeTab, setActiveTab] = useState('pending')
  const [stats, setStats] = useState({
    totalOrgs: 0,
    pendingOrgs: 0,
    totalDonors: 0,
    verifiedOrgs: 0
  })
  const [pendingOrgs, setPendingOrgs] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [donors, setDonors] = useState([])
  const [searchTerms, setSearchTerms] = useState({
    pending: '',
    organizations: '',
    donors: ''
  })
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showEditDonorModal, setShowEditDonorModal] = useState(false)
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  console.log('AdminDashboard state initialized')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Load organizations
      const orgsResponse = await fetch('/api/admin/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        setOrganizations(orgsData.organizations || [])
        
        // Calculate stats from organizations data
        const totalOrgs = orgsData.organizations?.length || 0
        const pendingOrgs = orgsData.organizations?.filter(org => org.verificationStatus === 'pending').length || 0
        const verifiedOrgs = orgsData.organizations?.filter(org => org.verificationStatus === 'approved').length || 0
        
        setStats({
          totalOrgs,
          pendingOrgs,
          totalDonors: 0, // Will be updated below
          verifiedOrgs
        })
      }

      // Load pending organizations
      const pendingResponse = await fetch('/api/admin/organizations/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingOrgs(pendingData.organizations || [])
      }

      // Load donors
      const donorsResponse = await fetch('/api/admin/donors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (donorsResponse.ok) {
        const donorsData = await donorsResponse.json()
        setDonors(donorsData.donors || [])
        
        // Update total donors in stats
        setStats(prev => ({
          ...prev,
          totalDonors: donorsData.donors?.length || 0
        }))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load admin dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (orgId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/organizations/${orgId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        loadDashboardData()
      }
    } catch (error) {
      console.error('Error approving organization:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  const handleSearch = (tab, term) => {
    setSearchTerms(prev => ({
      ...prev,
      [tab]: term
    }))
  }

  const handleApproveOrg = async (orgId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/organizations/${orgId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadDashboardData() // Refresh data
      } else {
        const errorData = await response.json()
        console.error('Approve failed:', errorData.message)
      }
    } catch (error) {
      console.error('Error approving organization:', error)
    }
  }

  const handleRejectOrg = (org) => {
    console.log('Reject button clicked for org:', org)
    setSelectedItem(org)
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async (reason) => {
    console.log('Reject submit called with reason:', reason)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/organizations/${selectedItem._id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: reason })
      })

      console.log('Reject response status:', response.status)
      
      if (response.ok) {
        console.log('Reject successful')
        setShowRejectModal(false)
        setSelectedItem(null)
        loadDashboardData() // Refresh data
      } else {
        try {
          const errorData = await response.json()
          console.error('Reject failed:', errorData.message)
        } catch (jsonError) {
          console.error('Reject failed - non-JSON response:', await response.text())
        }
      }
    } catch (error) {
      console.error('Error rejecting organization:', error)
    }
  }

  const handleEditDonor = (donor) => {
    setSelectedItem(donor)
    setShowEditDonorModal(true)
  }

  const handleUpdateDonor = async (donorData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/update-donor/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donorData)
      })

      if (response.ok) {
        setShowEditDonorModal(false)
        setSelectedItem(null)
        loadDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Error updating donor:', error)
    }
  }

  const handleDeleteOrg = async (orgId) => {
    console.log('Delete button clicked for orgId:', orgId)
    if (!confirm('Are you sure you want to delete this organization?')) return

    try {
      const token = localStorage.getItem('token')
      console.log('Making delete request to:', `/api/admin/organizations/${orgId}`)
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Delete response status:', response.status)
      
      if (response.ok) {
        console.log('Delete successful')
        loadDashboardData() // Refresh data
      } else {
        try {
          const errorData = await response.json()
          console.error('Delete failed:', errorData.message)
        } catch (jsonError) {
          console.error('Delete failed - non-JSON response:', await response.text())
        }
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  const handleEditOrg = (org) => {
    setSelectedItem(org)
    setShowEditOrgModal(true)
  }

  const handleUpdateOrg = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/organizations/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Update the organization in the local state
        setOrganizations(prev => prev.map(org => 
          org._id === selectedItem._id ? { ...org, ...formData } : org
        ))
        setShowEditOrgModal(false)
        setSelectedItem(null)
        alert('Organization updated successfully!')
      } else {
        const errorData = await response.json()
        alert('Failed to update organization: ' + errorData.message)
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      alert('Error updating organization')
    }
  }

  const filteredPendingOrgs = pendingOrgs.filter(org => 
    (org.name && org.name.toLowerCase().includes(searchTerms.pending.toLowerCase())) ||
    (org.email && org.email.toLowerCase().includes(searchTerms.pending.toLowerCase()))
  )

  const filteredOrganizations = organizations.filter(org => 
    (org.name && org.name.toLowerCase().includes(searchTerms.organizations.toLowerCase())) ||
    (org.email && org.email.toLowerCase().includes(searchTerms.organizations.toLowerCase()))
  )

  const filteredDonors = donors.filter(donor => 
    (donor.fullName && donor.fullName.toLowerCase().includes(searchTerms.donors.toLowerCase())) ||
    (donor.email && donor.email.toLowerCase().includes(searchTerms.donors.toLowerCase()))
  )

  if (loading) {
    console.log('AdminDashboard showing loading state...')
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  if (error) {
    console.log('AdminDashboard showing error state...')
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: 'var(--error-color)' }}></i>
        <p>Error loading admin dashboard: {error}</p>
      </div>
    )
  }

  console.log('AdminDashboard rendering main content...')

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
            <li><a href="#login">Login</a></li>
            <li><a href="#register">Register</a></li>
            <li><a href="#admin" className="active">Admin</a></li>
          </ul>
          <div className="hamburger">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Admin Dashboard Content */}
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1><i className="fas fa-shield-alt"></i> Admin Dashboard</h1>
          <p>Manage Organizations and Donors</p>
          <button className="btn btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-building"></i>
            <h3>{stats.totalOrgs}</h3>
            <p>Total Organizations</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-clock"></i>
            <h3>{stats.pendingOrgs}</h3>
            <p>Pending Verifications</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-user"></i>
            <h3>{stats.totalDonors}</h3>
            <p>Total Donors</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-check-circle"></i>
            <h3>{stats.verifiedOrgs}</h3>
            <p>Verified Organizations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`} 
            onClick={() => handleTabChange('pending')}
          >
            <i className="fas fa-clock"></i> Pending Verifications
          </button>
          <button 
            className={`tab ${activeTab === 'organizations' ? 'active' : ''}`} 
            onClick={() => handleTabChange('organizations')}
          >
            <i className="fas fa-building"></i> All Organizations
          </button>
          <button 
            className={`tab ${activeTab === 'donors' ? 'active' : ''}`} 
            onClick={() => handleTabChange('donors')}
          >
            <i className="fas fa-user"></i> Donors
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'pending' && (
          <div id="pending" className="tab-content active">
            <div className="table-container">
              <div className="table-header">
                <h2><i className="fas fa-clock"></i> Pending Verifications</h2>
                <div className="search-box">
                  <input 
                    type="text" 
                    placeholder="Search organizations..." 
                    value={searchTerms.pending}
                    onChange={(e) => handleSearch('pending', e.target.value)}
                  />
                </div>
              </div>
              <div className="table-content">
                <table>
                  <thead>
                    <tr>
                      <th>Organization Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>License Number</th>
                      <th>PAN Number</th>
                      <th>Registration Date</th>
                      <th>PAN Photo</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingOrgs.map((org, index) => (
                      <tr key={index}>
                        <td>{org.name}</td>
                        <td>{org.email}</td>
                        <td>{org.phone}</td>
                        <td>{org.licenseNumber}</td>
                        <td>{org.panNumber}</td>
                        <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                        <td>
                          {org.panCardImage ? (
                            <a href={org.panCardImage} target="_blank" rel="noopener noreferrer">
                              <i className="fas fa-image"></i> View PAN Card
                            </a>
                          ) : 'Not uploaded'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-approve" 
                              onClick={() => handleApproveOrg(org._id)}
                            >
                              <i className="fas fa-check"></i> Approve
                            </button>
                            <button 
                              className="btn btn-reject" 
                              onClick={() => handleRejectOrg(org)}
                            >
                              <i className="fas fa-times"></i> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organizations' && (
          <div id="organizations" className="tab-content active">
            <div className="table-container">
              <div className="table-header">
                <h2><i className="fas fa-building"></i> All Organizations</h2>
                <div className="search-box">
                  <input 
                    type="text" 
                    placeholder="Search organizations..." 
                    value={searchTerms.organizations}
                    onChange={(e) => handleSearch('organizations', e.target.value)}
                  />
                </div>
              </div>
              <div className="table-content">
                <table>
                  <thead>
                    <tr>
                      <th>Organization Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>License Number</th>
                      <th>PAN Number</th>
                      <th>Verification Status</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrganizations.map((org, index) => (
                      <tr key={index}>
                        <td>{org.name}</td>
                        <td>{org.email}</td>
                        <td>{org.phone}</td>
                        <td>{org.licenseNumber}</td>
                        <td>{org.panNumber}</td>
                        <td>
                          <span className={`status-badge status-${org.verificationStatus}`}>
                            {org.verificationStatus}
                          </span>
                        </td>
                        <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-edit" onClick={() => handleEditOrg(org)}>
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button className="btn btn-delete" onClick={() => handleDeleteOrg(org._id)}>
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <div id="donors" className="tab-content active">
            <div className="table-container">
              <div className="table-header">
                <h2><i className="fas fa-user"></i> Donors</h2>
                <div className="search-box">
                  <input 
                    type="text" 
                    placeholder="Search donors..." 
                    value={searchTerms.donors}
                    onChange={(e) => handleSearch('donors', e.target.value)}
                  />
                </div>
              </div>
              <div className="table-content">
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Blood Group</th>
                      <th>Location</th>
                      <th>Availability</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map((donor, index) => (
                      <tr key={index}>
                        <td>{donor.fullName || 'N/A'}</td>
                        <td>{donor.email}</td>
                        <td>{donor.phone}</td>
                        <td>
                          <span className="blood-badge">{donor.bloodGroup}</span>
                        </td>
                        <td>{donor.location}</td>
                        <td>
                          <span className={`status-badge ${donor.availability === 'available' ? 'status-available' : 'status-not-available'}`}>
                            {donor.availability === 'available' ? 'Available' : 'Not Available'}
                          </span>
                        </td>
                        <td>{donor.createdAt ? new Date(donor.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-edit" 
                              onClick={() => handleEditDonor(donor)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="btn btn-delete" 
                              onClick={() => handleDeleteDonor(donor._id)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <h3><i className="fas fa-times-circle"></i> Reject Organization</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const reason = e.target.rejectionReason.value
              handleRejectSubmit(reason)
            }}>
              <div className="form-group">
                <label htmlFor="rejectionReason">Rejection Reason *</label>
                <textarea 
                  id="rejectionReason" 
                  name="rejectionReason" 
                  required 
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              <div className="form-buttons">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-reject">
                  Reject Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Donor Modal */}
      {showEditDonorModal && selectedItem && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <h3><i className="fas fa-user-edit"></i> Edit Donor</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = {
                fullName: e.target.fullName.value,
                email: e.target.email.value,
                phone: e.target.phone.value,
                bloodGroup: e.target.bloodGroup.value,
                location: e.target.location.value,
                availability: e.target.availability.value
              }
              handleUpdateDonor(formData)
            }}>
              <div className="form-group">
                <label htmlFor="editFullName">Full Name</label>
                <input 
                  type="text" 
                  id="editFullName" 
                  name="fullName" 
                  required 
                  defaultValue={selectedItem.fullName}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editEmail">Email</label>
                <input 
                  type="email" 
                  id="editEmail" 
                  name="email" 
                  required 
                  defaultValue={selectedItem.email}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editPhone">Phone</label>
                <input 
                  type="tel" 
                  id="editPhone" 
                  name="phone" 
                  required 
                  defaultValue={selectedItem.phone}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editBloodGroup">Blood Group</label>
                <select id="editBloodGroup" name="bloodGroup" required defaultValue={selectedItem.bloodGroup}>
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="editLocation">Location</label>
                <input 
                  type="text" 
                  id="editLocation" 
                  name="location" 
                  required 
                  defaultValue={selectedItem.location}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editAvailability">Availability</label>
                <select id="editAvailability" name="availability" required defaultValue={selectedItem.availability || 'available'}>
                  <option value="available">Available</option>
                  <option value="not-available">Not Available</option>
                </select>
              </div>
              <div className="form-buttons">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowEditDonorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-edit">
                  Update Donor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditOrgModal && selectedItem && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <h3><i className="fas fa-building"></i> Edit Organization</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = {
                name: e.target.name.value,
                email: e.target.email.value,
                phone: e.target.phone.value,
                licenseNumber: e.target.licenseNumber.value,
                panNumber: e.target.panNumber.value,
                verificationStatus: e.target.verificationStatus.value
              }
              handleUpdateOrg(formData)
            }}>
              <div className="form-group">
                <label htmlFor="editOrgName">Organization Name</label>
                <input 
                  type="text" 
                  id="editOrgName" 
                  name="name" 
                  required 
                  defaultValue={selectedItem.name}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editOrgEmail">Email</label>
                <input 
                  type="email" 
                  id="editOrgEmail" 
                  name="email" 
                  required 
                  defaultValue={selectedItem.email}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editOrgPhone">Phone</label>
                <input 
                  type="tel" 
                  id="editOrgPhone" 
                  name="phone" 
                  required 
                  defaultValue={selectedItem.phone}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editLicenseNumber">License Number</label>
                <input 
                  type="text" 
                  id="editLicenseNumber" 
                  name="licenseNumber" 
                  required 
                  defaultValue={selectedItem.licenseNumber}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editPanNumber">PAN Number</label>
                <input 
                  type="text" 
                  id="editPanNumber" 
                  name="panNumber" 
                  required 
                  defaultValue={selectedItem.panNumber}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editVerificationStatus">Verification Status</label>
                <select id="editVerificationStatus" name="verificationStatus" required defaultValue={selectedItem.verificationStatus}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-buttons">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowEditOrgModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-edit">
                  Update Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
