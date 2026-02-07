/* ============================================
   BLOOD REQUEST MANAGEMENT - Frontend JavaScript
   ============================================ */

class BloodRequestManager {
    constructor() {
        this.apiBaseURL = 'http://localhost:3000/api';
        this.currentEditId = null;
        this.organizationId = null;
        this.token = null;
        
        this.init();
    }

    init() {
        // Get organization data from localStorage
        const organizationData = localStorage.getItem('currentUser');
        if (organizationData) {
            const data = JSON.parse(organizationData);
            this.organizationId = data.id;
            this.token = localStorage.getItem('token');
        }

        // Initialize event listeners
        this.setupEventListeners();
        
        // Load blood requests
        this.loadBloodRequests();
        
        // Set minimum date for required date input
        this.setMinDate();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('bloodRequestForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetForm());
        }
    }

    setMinDate() {
        const requiredDateInput = document.getElementById('requiredDate');
        if (requiredDateInput) {
            const today = new Date().toISOString().split('T')[0];
            requiredDateInput.min = today;
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const requestData = {
            bloodGroup: formData.get('bloodGroup'),
            quantity: parseInt(formData.get('quantity')),
            hospitalName: formData.get('hospitalName'),
            location: formData.get('location'),
            urgencyLevel: formData.get('urgencyLevel'),
            requiredDate: formData.get('requiredDate')
        };

        try {
            this.showLoading(true);
            this.clearMessages();

            let response;
            if (this.currentEditId) {
                // Update existing request
                response = await fetch(`${this.apiBaseURL}/blood-requests/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(requestData)
                });
            } else {
                // Create new request
                response = await fetch(`${this.apiBaseURL}/blood-requests`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(requestData)
                });
            }

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(result.message);
                this.resetForm();
                this.loadBloodRequests();
            } else {
                this.showError(result.message || 'Failed to save blood request');
            }
        } catch (error) {
            console.error('Error saving blood request:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadBloodRequests() {
        if (!this.organizationId) return;

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseURL}/blood-requests/org/${this.organizationId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.displayBloodRequests(result.bloodRequests);
            } else {
                this.showError(result.message || 'Failed to load blood requests');
                this.displayEmptyState();
            }
        } catch (error) {
            console.error('Error loading blood requests:', error);
            this.showError('Network error. Please try again.');
            this.displayEmptyState();
        } finally {
            this.showLoading(false);
        }
    }

    displayBloodRequests(requests) {
        const container = document.getElementById('requestsList');
        
        if (!requests || requests.length === 0) {
            this.displayEmptyState();
            return;
        }

        const tableHTML = `
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
                    ${requests.map(request => this.createRequestRow(request)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    createRequestRow(request) {
        const formattedDate = new Date(request.requiredDate).toLocaleDateString();
        const statusClass = `status-${request.status.toLowerCase()}`;
        const urgencyClass = `urgency-${request.urgencyLevel.toLowerCase()}`;

        return `
            <tr>
                <td>
                    <span style="font-weight: bold; color: var(--primary-color);">
                        ${request.bloodGroup}
                    </span>
                </td>
                <td>${request.quantity} units</td>
                <td>${request.hospitalName}</td>
                <td>${request.location}</td>
                <td>
                    <span class="urgency-badge ${urgencyClass}">
                        ${request.urgencyLevel}
                    </span>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${request.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="bloodRequestManager.editRequest('${request._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="bloodRequestManager.deleteRequest('${request._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    displayEmptyState() {
        const container = document.getElementById('requestsList');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tint"></i>
                <h3>No Blood Requests Found</h3>
                <p>You haven't created any blood requests yet. Create your first request using the form above.</p>
            </div>
        `;
    }

    async editRequest(requestId) {
        try {
            this.showLoading(true);
            
            // Find the request in the current list (for simplicity, we'll reload all requests)
            const response = await fetch(`${this.apiBaseURL}/blood-requests/org/${this.organizationId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                const request = result.bloodRequests.find(r => r._id === requestId);
                if (request) {
                    this.populateForm(request);
                    this.currentEditId = requestId;
                    
                    // Update button text
                    const submitBtn = document.getElementById('submitBtn');
                    if (submitBtn) {
                        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Request';
                    }
                    
                    // Show cancel button
                    const cancelBtn = document.getElementById('cancelBtn');
                    if (cancelBtn) {
                        cancelBtn.style.display = 'inline-block';
                    }
                    
                    // Scroll to form
                    document.querySelector('.request-form-container').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }
            }
        } catch (error) {
            console.error('Error loading request for edit:', error);
            this.showError('Failed to load request details');
        } finally {
            this.showLoading(false);
        }
    }

    populateForm(request) {
        document.getElementById('bloodGroup').value = request.bloodGroup;
        document.getElementById('quantity').value = request.quantity;
        document.getElementById('hospitalName').value = request.hospitalName;
        document.getElementById('location').value = request.location;
        document.getElementById('urgencyLevel').value = request.urgencyLevel;
        
        // Format date for input
        const date = new Date(request.requiredDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('requiredDate').value = formattedDate;
    }

    async deleteRequest(requestId) {
        if (!confirm('Are you sure you want to delete this blood request? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseURL}/blood-requests/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(result.message);
                this.loadBloodRequests();
            } else {
                this.showError(result.message || 'Failed to delete blood request');
            }
        } catch (error) {
            console.error('Error deleting blood request:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    resetForm() {
        const form = document.getElementById('bloodRequestForm');
        if (form) {
            form.reset();
        }
        
        this.currentEditId = null;
        
        // Reset button text
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Create Request';
        }
        
        // Hide cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
        
        this.clearMessages();
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('requestSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('requestError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    clearMessages() {
        const errorDiv = document.getElementById('requestError');
        const successDiv = document.getElementById('requestSuccess');
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
        
        if (successDiv) {
            successDiv.style.display = 'none';
            successDiv.textContent = '';
        }
    }
}

// Initialize the blood request manager when the page loads
let bloodRequestManager;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bloodRequestForm')) {
        bloodRequestManager = new BloodRequestManager();
    }
});
