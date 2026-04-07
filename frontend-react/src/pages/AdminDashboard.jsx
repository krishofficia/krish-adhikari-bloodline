import React, { useState, useEffect } from 'react'
import '../admin-styles.css'

// Add custom CSS for enhanced admin styling
const enhancedAdminStyles = `
  /* ============================================
     ENHANCED ADMIN DASHBOARD STYLES
     Modern, Clean, Consistent with Home Page
     ============================================ */
  
  /* Enhanced Admin Header */
  .admin-header {
    background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 50%, #8b0000 100%);
    color: white;
    padding: 4rem 2rem;
    border-radius: 20px;
    margin-bottom: 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  }
  
  .admin-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="admin-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="25" cy="15" r="0.8" fill="rgba(255,255,255,0.03)"/><circle cx="15" cy="25" r="1.2" fill="rgba(255,255,255,0.04)"/></pattern></defs><rect width="100" height="100" fill="url(%23admin-pattern)"/></svg>');
    opacity: 0.1;
    animation: floatPattern 25s ease-in-out infinite;
  }
  
  .admin-header h1 {
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    animation: titleGlow 3s ease-in-out infinite alternate;
  }
  
  .admin-header p {
    margin: 0;
    opacity: 0.95;
    font-size: 1.2rem;
    font-weight: 300;
  }
  
  .admin-header .btn-logout {
    position: absolute;
    top: 2rem;
    right: 2rem;
    background: rgba(255,255,255,0.1);
    color: white;
    padding: 0.75rem 1.5rem;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50px;
    font-weight: 600;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }
  
  .admin-header .btn-logout:hover {
    background: rgba(255,255,255,0.2);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }
  
  /* Enhanced Statistics Cards */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .stat-card {
    background: white;
    border-radius: 20px;
    padding: 2.5rem;
    text-align: center;
    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    border: 1px solid #f0f0f0;
  }
  
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #d32f2f, #ef5350);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  .stat-card:hover::before {
    transform: scaleX(1);
  }
  
  .stat-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  
  .stat-card i {
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #d32f2f, #ef5350);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    color: white;
    font-size: 1.8rem;
    transition: all 0.3s ease;
  }
  
  .stat-card:hover i {
    transform: scale(1.1) rotate(5deg);
  }
  
  .stat-card h3 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #d32f2f;
    margin: 0;
    line-height: 1;
  }
  
  .stat-card p {
    font-size: 1rem;
    color: #616161;
    margin: 0.5rem 0 0 0;
    font-weight: 500;
  }
  
  /* Enhanced Tabs */
  .tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    background: white;
    padding: 1rem;
    border-radius: 15px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
  }
  
  .tab {
    padding: 1rem 2rem;
    background: #f8f9fa;
    border: none;
    border-radius: 12px 12px 0 0;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
  }
  
  .tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(211,47,47,0.1), transparent);
    transition: left 0.5s ease;
  }
  
  .tab:hover::before {
    left: 100%;
  }
  
  .tab:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }
  
  .tab.active {
    background: linear-gradient(135deg, #d32f2f, #b71c1c);
    color: white;
    border-color: #d32f2f;
    box-shadow: 0 5px 15px rgba(211,47,47,0.2);
  }
  
  /* Enhanced Table Containers */
  .table-container {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
    margin-bottom: 2rem;
    border: 1px solid #f0f0f0;
  }
  
  .table-header {
    background: linear-gradient(135deg, #d32f2f, #b71c1c);
    color: white;
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .table-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .search-box {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .search-box input {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 25px;
    width: 250px;
    font-size: 0.9rem;
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid rgba(255,255,255,0.2);
    transition: all 0.3s ease;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.15);
    box-shadow: 0 0 10px rgba(255,255,255,0.1);
  }
  
  .search-box input::placeholder {
    color: rgba(255,255,255,0.7);
  }
  
  /* Enhanced Table Content */
  .table-content {
    overflow-x: auto;
  }
  
  .table-content table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table-content th, 
  .table-content td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .table-content th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .table-content tr:hover {
    background: #f8f9fa;
  }
  
  .table-content tr:hover td {
    color: #d32f2f;
  }
  
  /* Enhanced Action Buttons */
  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
  }
  
  .btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.3s ease;
  }
  
  .btn:hover::before {
    left: 100%;
  }
  
  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .btn-approve {
    background: #28a745;
    color: white;
  }
  
  .btn-approve:hover {
    background: #218838;
  }
  
  .btn-reject {
    background: #dc3545;
    color: white;
  }
  
  .btn-reject:hover {
    background: #c82333;
  }
  
  .btn-edit {
    background: #007bff;
    color: white;
  }
  
  .btn-edit:hover {
    background: #0056b3;
  }
  
  .btn-delete {
    background: #6c757d;
    color: white;
  }
  
  .btn-delete:hover {
    background: #545b62;
  }
  
  /* Enhanced Status Badges */
  .status-badge {
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .blood-badge {
    background: linear-gradient(135deg, #d32f2f, #b71c1c);
    color: white;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 25px;
  }
  
  /* Enhanced Modal */
  .modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.5);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    background: white;
    padding: 3rem;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    max-width: 600px;
    width: 90%;
    animation: slideIn 0.3s ease;
    position: relative;
    border: 1px solid #f0f0f0;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .admin-header {
      padding: 2rem 1rem;
    }
    
    .admin-header h1 {
      font-size: 2rem;
    }
    
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .tabs {
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .tab {
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
    }
    
    .search-box input {
      width: 200px;
    }
    
    .action-buttons {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .btn {
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
    }
  }
  
  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .admin-header h1 {
      font-size: 1.75rem;
    }
    
    .tab {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }
  }
  
  /* Loading and Error States */
  .loading-state, .error-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 20px;
    margin: 2rem auto;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  }
  
  .loading-state i, .error-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .loading-state i {
    color: #d32f2f;
    animation: spin 1s linear infinite;
  }
  
  .error-state i {
    color: #dc3545;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from {
      transform: translateY(-50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes floatPattern {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes titleGlow {
    from { text-shadow: 2px 2px 4px rgba(211,47,47,0.3); }
    to { text-shadow: 2px 2px 8px rgba(211,47,47,0.5), 0 0 20px rgba(255,255,255,0.2); }
  }
`;

function AdminDashboard() {
  console.log('AdminDashboard component rendering...')
  
  // Inject enhanced CSS styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = enhancedAdminStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])
  
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

  const handleEditOrg = (org) => {
    console.log('Edit button clicked for org:', org)
    setSelectedItem(org)
    setShowEditOrgModal(true)
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
      console.log('Updating donor:', selectedItem._id, donorData)
      
      const response = await fetch(`/api/admin/donors/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donorData)
      })

      console.log('Update response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Update successful:', data)
        
        setShowEditDonorModal(false)
        setSelectedItem(null)
        loadDashboardData() // Refresh data
        
        // Show success message
        alert('Donor updated successfully!')
      } else {
        const errorData = await response.json()
        console.error('Update failed:', errorData)
        alert(`Failed to update donor: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating donor:', error)
      alert('Error updating donor. Please try again.')
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
      console.error('Delete error:', error)
    }
  }

  const handleDeleteDonor = async (donorId) => {
    console.log('Delete button clicked for donorId:', donorId)
    if (!confirm('Are you sure you want to delete this donor?')) return

    try {
      const token = localStorage.getItem('token')
      console.log('Making delete request to:', `/api/admin/donors/${donorId}`)
      const response = await fetch(`/api/admin/donors/${donorId}`, {
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
      console.error('Delete error:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleUpdateOrg = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      console.log('Updating organization:', selectedItem._id, formData)
      
      const response = await fetch(`/api/admin/organizations/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      console.log('Update organization response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Organization update successful:', data)
        
        setShowEditOrgModal(false)
        setSelectedItem(null)
        loadDashboardData() // Refresh data
        
        alert('Organization updated successfully!')
      } else {
        const errorData = await response.json()
        console.error('Organization update failed:', errorData)
        alert(`Failed to update organization: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      alert('Error updating organization. Please try again.')
    }
  }

  const filteredOrganizations = organizations.filter(org => 
    (org.name && org.name.toLowerCase().includes(searchTerms.organizations.toLowerCase())) ||
    (org.email && org.email.toLowerCase().includes(searchTerms.organizations.toLowerCase()))
  )

  const filteredDonors = donors.filter(donor => 
    (donor.fullName && donor.fullName.toLowerCase().includes(searchTerms.donors.toLowerCase())) ||
    (donor.email && donor.email.toLowerCase().includes(searchTerms.donors.toLowerCase()))
  )

  const filteredPendingOrgs = pendingOrgs.filter(org => 
    (org.name && org.name.toLowerCase().includes(searchTerms.pending.toLowerCase())) ||
    (org.email && org.email.toLowerCase().includes(searchTerms.pending.toLowerCase()))
  )

  if (loading) {
    console.log('AdminDashboard showing loading state...')
    return (
      <div className="loading-state">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  if (error) {
    console.log('AdminDashboard showing error state...')
    return (
      <div className="error-state">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Error loading admin dashboard: {error}</p>
      </div>
    )
  }

  console.log('AdminDashboard rendering main content...')

  return (
    <div>
      {/* Navigation Bar - Consistent with Home Page */}
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

      {/* Enhanced Admin Dashboard Content */}
      <div className="admin-dashboard">
        {/* Enhanced Admin Header */}
        <div className="admin-header">
          <h1><i className="fas fa-shield-alt"></i> Admin Dashboard</h1>
          <p>Manage Organizations and Donors</p>
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        {/* Enhanced Statistics Cards */}
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

        {/* Enhanced Tabs */}
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
                          <span className="status-badge status-{org.verificationStatus}">
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
                          <span className="status-badge status-{donor.availability === 'available' ? 'status-available' : 'status-not-available'}">
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

      {/* Enhanced Reject Modal */}
      {showRejectModal && (
        <div className="modal">
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

      {/* Enhanced Edit Donor Modal */}
      {showEditDonorModal && selectedItem && (
        <div className="modal">
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
              console.log('Form data being submitted:', formData)
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

      {/* Enhanced Edit Organization Modal */}
      {showEditOrgModal && selectedItem && (
        <div className="modal">
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
