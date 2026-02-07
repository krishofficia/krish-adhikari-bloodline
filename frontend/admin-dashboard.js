/**
 * Admin Dashboard JavaScript
 */

let currentTab = 'pending';
let pendingOrgs = [];
let allOrgs = [];
let allDonors = [];
let currentEditingDonor = null;
let currentRejectingOrg = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadStatistics();
    loadPendingOrganizations();
});

// Check admin authentication
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminUser');
    
    console.log('=== ADMIN DASHBOARD AUTH CHECK ===');
    console.log('Token exists:', !!token);
    console.log('Admin exists:', !!admin);
    console.log('Token value:', token);
    console.log('Admin value:', admin);
    console.log('==========================');
    
    if (!token || !admin) {
        console.log('Redirecting to admin login - missing auth');
        console.log('Token:', token);
        console.log('Admin:', admin);
        window.location.href = 'admin-login.html';
        return;
    }
    
    console.log('Admin auth check passed - loading dashboard functions');
    console.log('Loading statistics...');
    loadStatistics();
    console.log('Loading pending organizations...');
    loadPendingOrganizations();
}

// API request helper
async function adminApiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const response = await fetch(`http://localhost:3000/api/admin${endpoint}`, finalOptions);
    
    if (!response.ok) {
        const error = new Error('Request failed');
        error.status = response.status;
        throw error;
    }
    
    return await response.json();
}

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    currentTab = tabName;
    
    // Load data based on tab
    switch(tabName) {
        case 'pending':
            loadPendingOrganizations();
            break;
        case 'organizations':
            loadAllOrganizations();
            break;
        case 'donors':
            loadAllDonors();
            break;
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const [pendingResponse, allResponse, donorsResponse] = await Promise.all([
            adminApiRequest('/organizations/pending'),
            adminApiRequest('/organizations'),
            adminApiRequest('/donors')
        ]);
        
        const pendingCount = pendingResponse.organizations?.length || 0;
        const totalCount = allResponse.organizations?.length || 0;
        const donorsCount = donorsResponse.donors?.length || 0;
        const verifiedCount = allResponse.organizations?.filter(org => org.verificationStatus === 'approved')?.length || 0;
        
        document.getElementById('totalOrgs').textContent = totalCount;
        document.getElementById('pendingOrgs').textContent = pendingCount;
        document.getElementById('totalDonors').textContent = donorsCount;
        document.getElementById('verifiedOrgs').textContent = verifiedCount;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load pending organizations
async function loadPendingOrganizations() {
    try {
        const response = await adminApiRequest('/organizations/pending');
        pendingOrgs = response.organizations || [];
        renderPendingOrganizations();
    } catch (error) {
        console.error('Error loading pending organizations:', error);
        showAlert('Error loading pending organizations', 'error');
    }
}

// Render pending organizations
function renderPendingOrganizations() {
    const tbody = document.getElementById('pendingTableBody');
    tbody.innerHTML = '';
    
    if (pendingOrgs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #28a745;"></i>
                    No pending verifications
                </td>
            </tr>
        `;
        return;
    }
    
    pendingOrgs.forEach(org => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${org.name}</td>
            <td>${org.email}</td>
            <td>${org.phone}</td>
            <td>${org.licenseNumber || 'N/A'}</td>
            <td>${org.panNumber}</td>
            <td>${new Date(org.createdAt).toLocaleDateString()}</td>
            <td>
                ${org.panCardImage ? `<img src="${org.panCardImage}" alt="PAN Card" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; cursor: pointer;" onclick="viewPANImage('${org.panCardImage}')">` : 'No PAN Card'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-approve" onclick="approveOrganization('${org._id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-reject" onclick="openRejectModal('${org._id}', '${org.name}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load all organizations
async function loadAllOrganizations() {
    try {
        const response = await adminApiRequest('/organizations');
        allOrgs = response.organizations || [];
        renderAllOrganizations();
    } catch (error) {
        console.error('Error loading organizations:', error);
        showAlert('Error loading organizations', 'error');
    }
}

// Render all organizations
function renderAllOrganizations() {
    const tbody = document.getElementById('orgTableBody');
    tbody.innerHTML = '';
    
    if (allOrgs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-building" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #667eea;"></i>
                    No organizations found
                </td>
            </tr>
        `;
        return;
    }
    
    allOrgs.forEach(org => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${org.name}</td>
            <td>${org.email}</td>
            <td>${org.phone}</td>
            <td>${org.licenseNumber}</td>
            <td>${org.panNumber}</td>
            <td>
                <span class="status-badge status-${org.verificationStatus}">
                    ${org.verificationStatus.toUpperCase()}
                </span>
            </td>
            <td>${new Date(org.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    ${org.verificationStatus === 'pending' ? `
                        <button class="btn btn-approve" onclick="approveOrganization('${org._id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-reject" onclick="openRejectModal('${org._id}', '${org.name}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load all donors
async function loadAllDonors() {
    try {
        const response = await adminApiRequest('/donors');
        allDonors = response.donors || [];
        renderAllDonors();
    } catch (error) {
        console.error('Error loading donors:', error);
        showAlert('Error loading donors', 'error');
    }
}

// Render all donors
function renderAllDonors() {
    const tbody = document.getElementById('donorTableBody');
    tbody.innerHTML = '';
    
    if (allDonors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-user" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #667eea;"></i>
                    No donors found
                </td>
            </tr>
        `;
        return;
    }
    
    allDonors.forEach(donor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donor.fullName}</td>
            <td>${donor.email}</td>
            <td>${donor.phone}</td>
            <td>${donor.bloodGroup}</td>
            <td>${donor.location}</td>
            <td>
                <span class="status-badge ${donor.availability === 'available' ? 'status-approved' : 'status-rejected'}">
                    ${donor.availability}
                </span>
            </td>
            <td>${new Date(donor.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="openEditDonorModal('${donor._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="deleteDonor('${donor._id}', '${donor.fullName}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Approve organization
async function approveOrganization(orgId) {
    if (!confirm('Are you sure you want to approve this organization?')) {
        return;
    }
    
    try {
        const response = await adminApiRequest(`/organizations/${orgId}/approve`, {
            method: 'POST'
        });
        
        if (response.success || response.message) {
            showAlert('Organization approved successfully!', 'success');
            loadStatistics();
            if (currentTab === 'pending') {
                loadPendingOrganizations();
            } else if (currentTab === 'organizations') {
                loadAllOrganizations();
            }
        } else {
            showAlert('Error approving organization', 'error');
        }
    } catch (error) {
        console.error('Error approving organization:', error);
        showAlert('Error approving organization', 'error');
    }
}

// Open reject modal
function openRejectModal(orgId, orgName) {
    currentRejectingOrg = orgId;
    document.getElementById('rejectModal').style.display = 'block';
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectionReason').focus();
}

// Close reject modal
function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    currentRejectingOrg = null;
}

// Handle reject form submission
document.getElementById('rejectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const rejectionReason = document.getElementById('rejectionReason').value;
    
    if (!rejectionReason || rejectionReason.trim() === '') {
        showAlert('Rejection reason is required', 'error');
        return;
    }
    
    try {
        const response = await adminApiRequest(`/organizations/${currentRejectingOrg}/reject`, {
            method: 'POST',
            body: JSON.stringify({ rejectionReason })
        });
        
        if (response.success || response.message) {
            showAlert('Organization rejected successfully!', 'success');
            closeRejectModal();
            loadStatistics();
            if (currentTab === 'pending') {
                loadPendingOrganizations();
            } else if (currentTab === 'organizations') {
                loadAllOrganizations();
            }
        } else {
            showAlert('Error rejecting organization', 'error');
        }
    } catch (error) {
        console.error('Error rejecting organization:', error);
        showAlert('Error rejecting organization', 'error');
    }
});

// Open edit donor modal
function openEditDonorModal(donorId) {
    const donor = allDonors.find(d => d._id === donorId);
    if (!donor) return;
    
    currentEditingDonor = donorId;
    
    // Populate form with donor data
    document.getElementById('editFullName').value = donor.fullName;
    document.getElementById('editEmail').value = donor.email;
    document.getElementById('editPhone').value = donor.phone;
    document.getElementById('editBloodGroup').value = donor.bloodGroup;
    document.getElementById('editLocation').value = donor.location;
    document.getElementById('editAvailability').value = donor.availability;
    
    document.getElementById('editDonorModal').style.display = 'block';
}

// Close edit donor modal
function closeEditDonorModal() {
    document.getElementById('editDonorModal').style.display = 'none';
    currentEditingDonor = null;
}

// Handle edit donor form submission
document.getElementById('editDonorForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updateData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        bloodGroup: formData.get('bloodGroup'),
        location: formData.get('location'),
        availability: formData.get('availability')
    };
    
    try {
        const response = await adminApiRequest(`/donors/${currentEditingDonor}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        if (response.success) {
            showAlert('Donor updated successfully!', 'success');
            closeEditDonorModal();
            loadAllDonors();
            loadStatistics();
        }
    } catch (error) {
        console.error('Error updating donor:', error);
        showAlert('Error updating donor', 'error');
    }
});

// Delete donor
async function deleteDonor(donorId, donorName) {
    if (!confirm(`Are you sure you want to delete donor "${donorName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await adminApiRequest(`/donors/${donorId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showAlert('Donor deleted successfully!', 'success');
            loadAllDonors();
            loadStatistics();
        }
    } catch (error) {
        console.error('Error deleting donor:', error);
        showAlert('Error deleting donor', 'error');
    }
}

// Search functions
function searchPending() {
    const searchTerm = document.getElementById('pendingSearch').value.toLowerCase();
    const filtered = pendingOrgs.filter(org => 
        org.name.toLowerCase().includes(searchTerm) ||
        org.email.toLowerCase().includes(searchTerm) ||
        org.panNumber.toLowerCase().includes(searchTerm) ||
        (org.licenseNumber && org.licenseNumber.toLowerCase().includes(searchTerm))
    );
    renderFilteredPending(filtered);
}

function searchOrganizations() {
    const searchTerm = document.getElementById('orgSearch').value.toLowerCase();
    const filtered = allOrgs.filter(org => 
        org.name.toLowerCase().includes(searchTerm) ||
        org.email.toLowerCase().includes(searchTerm) ||
        org.panNumber.toLowerCase().includes(searchTerm) ||
        org.licenseNumber.toLowerCase().includes(searchTerm)
    );
    renderFilteredOrganizations(filtered);
}

function searchDonors() {
    const searchTerm = document.getElementById('donorSearch').value.toLowerCase();
    const filtered = allDonors.filter(donor => 
        donor.fullName.toLowerCase().includes(searchTerm) ||
        donor.email.toLowerCase().includes(searchTerm) ||
        donor.bloodGroup.toLowerCase().includes(searchTerm) ||
        donor.location.toLowerCase().includes(searchTerm)
    );
    renderFilteredDonors(filtered);
}

// Render filtered results
function renderFilteredPending(filtered) {
    const tbody = document.getElementById('pendingTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #667eea;"></i>
                    No matching organizations found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    filtered.forEach(org => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${org.name}</td>
            <td>${org.email}</td>
            <td>${org.phone}</td>
            <td>${org.licenseNumber || 'N/A'}</td>
            <td>${org.panNumber}</td>
            <td>${new Date(org.createdAt).toLocaleDateString()}</td>
            <td>
                ${org.panCardImage ? `<img src="${org.panCardImage}" alt="PAN Card" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; cursor: pointer;" onclick="viewPANImage('${org.panCardImage}')">` : 'No PAN Card'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-approve" onclick="approveOrganization('${org._id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-reject" onclick="openRejectModal('${org._id}', '${org.name}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderFilteredOrganizations(filtered) {
    const tbody = document.getElementById('orgTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #667eea;"></i>
                    No matching organizations found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    filtered.forEach(org => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${org.name}</td>
            <td>${org.email}</td>
            <td>${org.phone}</td>
            <td>${org.licenseNumber}</td>
            <td>${org.panNumber}</td>
            <td>
                <span class="status-badge status-${org.verificationStatus}">
                    ${org.verificationStatus.toUpperCase()}
                </span>
            </td>
            <td>${new Date(org.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    ${org.verificationStatus === 'pending' ? `
                        <button class="btn btn-approve" onclick="approveOrganization('${org._id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-reject" onclick="openRejectModal('${org._id}', '${org.name}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderFilteredDonors(filtered) {
    const tbody = document.getElementById('donorTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #667eea;"></i>
                    No matching donors found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    filtered.forEach(donor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donor.fullName}</td>
            <td>${donor.email}</td>
            <td>${donor.phone}</td>
            <td>${donor.bloodGroup}</td>
            <td>${donor.location}</td>
            <td>
                <span class="status-badge ${donor.availability === 'available' ? 'status-approved' : 'status-rejected'}">
                    ${donor.availability}
                </span>
            </td>
            <td>${new Date(donor.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="openEditDonorModal('${donor._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="deleteDonor('${donor._id}', '${donor.fullName}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show alert
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const adminDashboard = document.querySelector('.admin-dashboard');
    adminDashboard.insertBefore(alert, adminDashboard.children[1]); // Insert after header
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const rejectModal = document.getElementById('rejectModal');
    const editModal = document.getElementById('editDonorModal');
    
    if (event.target === rejectModal) {
        closeRejectModal();
    }
    
    if (event.target === editModal) {
        closeEditDonorModal();
    }
}

// View PAN card image
function viewPANImage(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        cursor: default;
    `;
    
    modal.appendChild(img);
    
    modal.addEventListener('click', function() {
        modal.remove();
    });
    
    document.body.appendChild(modal);
}

// Logout admin
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'admin-login.html';
}
