/* ============================================
   BLOODLINE - Frontend JavaScript
   Now using real backend API
   ============================================ */

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// API UTILITY FUNCTIONS
// ============================================

/**
 * Make API request with authentication
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fullUrl = `${API_BASE_URL}${endpoint}`;
        console.log('API Request:', fullUrl, options);
        
        const response = await fetch(fullUrl, {
            ...options,
            headers
        });

        console.log('API Response status:', response.status);
        console.log('API Response headers:', response.headers);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned an invalid response. Make sure the backend server is running on http://localhost:3000');
        }

        const data = await response.json();

        if (!response.ok) {
            console.error('API Error Response:', data);
            const error = new Error(data.message || data.error || 'Request failed');
            // Pass along additional error details if available
            if (data.errors) {
                error.errors = data.errors;
            }
            if (response.status) {
                error.status = response.status;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        
        // Check if it's a network error (server not running)
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
            throw new Error('Cannot connect to server. Please make sure the backend server is running on http://localhost:3000');
        }
        
        throw error;
    }
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    try {
        const token = localStorage.getItem('token');
        const currentUser = localStorage.getItem('currentUser');
        console.log('isLoggedIn check - token:', token ? 'exists' : 'missing');
        console.log('isLoggedIn check - currentUser:', currentUser ? 'exists' : 'missing');
        return token !== null && currentUser !== null;
    } catch (e) {
        console.warn('localStorage access failed:', e);
        return false;
    }
}

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.warn('Failed to get current user:', e);
        return null;
    }
}

/**
 * Save user and token to localStorage
 */
function saveAuth(token, user) {
    try {
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) {
        console.error('Failed to save auth:', e);
    }
}

/**
 * Clear authentication
 */
function clearAuth() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    } catch (e) {
        console.error('Failed to clear auth:', e);
    }
}

// ============================================
// NAVIGATION & MOBILE MENU
// ============================================

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Handle login form submission
 */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const errorDiv = document.getElementById('loginError');

        // Clear previous errors
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');

        // Validation
        if (!email || !password) {
            errorDiv.textContent = 'Please fill in all fields.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            let response;
            
            if (role === 'donor') {
                response = await apiRequest('/auth/login-donor', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                console.log('Donor login response:', response);
                
                // Save authentication
                saveAuth(response.token, { ...response.donor, role: 'donor' });
                
                console.log('Saved auth data. Checking if logged in:', isLoggedIn());
                
                // Redirect to donor dashboard
                window.location.href = 'donor-dashboard.html';
            } else {
                response = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                console.log('Organization login response:', response);
                
                // Handle verification status
                if (response.verificationStatus === 'pending') {
                    errorDiv.textContent = 'Your details are being verified by admin. Please wait for approval.';
                    errorDiv.classList.add('show');
                    return;
                }
                
                if (response.verificationStatus === 'rejected') {
                    const rejectionMsg = response.rejectionReason 
                        ? `Your organization verification was rejected: ${response.rejectionReason}` 
                        : 'Your organization verification was rejected. Please contact admin for details.';
                    errorDiv.textContent = rejectionMsg;
                    errorDiv.classList.add('show');
                    return;
                }
                
                if (!response.organization || !response.organization.isVerified) {
                    errorDiv.textContent = 'Your organization is not verified. Please contact admin.';
                    errorDiv.classList.add('show');
                    return;
                }
                
                // Save authentication
                saveAuth(response.token, { ...response.organization, role: 'organization' });
                
                console.log('Saved auth data. Checking if logged in:', isLoggedIn());
                
                // Redirect to organization dashboard
                window.location.href = 'org-dashboard.html';
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
            errorDiv.classList.add('show');
        }
    });
}

/**
 * Handle registration form submission
 */
function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const bloodGroup = document.getElementById('bloodGroup').value;
        const location = document.getElementById('location').value.trim();
        const availability = document.getElementById('availability').value;
        const password = document.getElementById('regPassword').value;
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');

        // Clear previous messages
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');

        // Validation
        if (!fullName || !email || !phone || !bloodGroup || !location || !availability || !password) {
            errorDiv.textContent = 'Please fill in all fields.';
            errorDiv.classList.add('show');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Please enter a valid email address.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            const response = await apiRequest('/auth/register-donor', {
                method: 'POST',
                body: JSON.stringify({
                    fullName,
                    email,
                    phone,
                    bloodGroup,
                    location,
                    availability,
                    password
                })
            });

            // Show success message
            successDiv.textContent = 'Registration successful! Redirecting to login...';
            successDiv.classList.add('show');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } catch (error) {
            errorDiv.textContent = error.message || 'Registration failed. Please try again.';
            errorDiv.classList.add('show');
        }
    });
}

/**
 * Handle organization registration form submission
 */
// Utility function to convert file to base64
async function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// PAN card image preview
document.addEventListener('DOMContentLoaded', function() {
    const panCardInput = document.getElementById('panCardImage');
    const panCardPreview = document.getElementById('panCardPreview');
    const panCardPreviewImg = document.getElementById('panCardPreviewImg');
    
    if (panCardInput && panCardPreview && panCardPreviewImg) {
        panCardInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    panCardPreview.style.display = 'block';
                    panCardPreviewImg.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function initOrgRegisterForm() {
    const orgRegisterForm = document.getElementById('orgRegisterForm');
    if (!orgRegisterForm) return;

    orgRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('orgName').value.trim();
        const email = document.getElementById('orgEmail').value.trim();
        const location = document.getElementById('orgLocation').value.trim();
        const phone = document.getElementById('orgPhone').value.trim();
        const licenseNumber = document.getElementById('licenseNumber').value.trim();
        const panNumber = document.getElementById('panNumber').value.trim();
        const panCardImage = document.getElementById('panCardImage').files[0];
        const password = document.getElementById('orgPassword').value;
        const confirmPassword = document.getElementById('orgConfirmPassword').value;
        const errorDiv = document.getElementById('orgRegisterError');
        const successDiv = document.getElementById('orgRegisterSuccess');

        // Debug: Log all form values
        console.log('=== FORM DEBUG ===');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Location:', location);
        console.log('Phone:', phone);
        console.log('License Number:', licenseNumber);
        console.log('PAN Number:', panNumber);
        console.log('PAN Card Image:', panCardImage);
        console.log('Password length:', password.length);
        console.log('Confirm Password length:', confirmPassword.length);
        console.log('==================');

        // Clear previous messages
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        successDiv.textContent = '';
        successDiv.classList.remove('show');

        // Validation
        if (!name || !email || !location || !phone || !licenseNumber || !panNumber || !panCardImage || !password || !confirmPassword) {
            console.log('VALIDATION FAILED - Missing fields');
            console.log('Missing:', {
                name: !name,
                email: !email,
                location: !location,
                phone: !phone,
                licenseNumber: !licenseNumber,
                panNumber: !panNumber,
                panCardImage: !panCardImage,
                password: !password,
                confirmPassword: !confirmPassword
            });
            errorDiv.textContent = 'Please fill in all fields including PAN number and PAN card image.';
            errorDiv.classList.add('show');
            return;
        }

        // Password validation
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long.';
            errorDiv.classList.add('show');
            return;
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            console.log('Making registration request...');
            console.log('Form data:', { name, email, location, phone, licenseNumber, panNumber, hasPanCardImage: !!panCardImage });
            
            // Convert PAN card image to base64
            let panCardImageData = '';
            if (panCardImage) {
                console.log('Converting PAN card image to base64...');
                panCardImageData = await convertToBase64(panCardImage);
                console.log('PAN card image converted, length:', panCardImageData.length);
            }
            
            const requestData = {
                name,
                email,
                location,
                address: location, // Map location to address for backend
                phone,
                licenseNumber,
                panNumber,
                panCardImage: panCardImageData,
                password
            };
            
            console.log('Final request data:', { ...requestData, panCardImage: panCardImageData.length ? '[BASE64_DATA]' : null });
            
            const response = await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            console.log('Registration response:', response);

            // Only save auth data if organization is approved
            if (response.organization && response.organization.verificationStatus === 'approved') {
                // Save authentication
                saveAuth(response.token, { ...response.organization, role: 'organization' });
                
                // Show success message
                successDiv.textContent = 'Organization registered successfully! Redirecting to dashboard...';
                successDiv.classList.add('show');

                // Redirect to organization dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = 'org-dashboard.html';
                }, 2000);
            } else {
                // Don't save auth data for pending/rejected organizations
                // Show success message
                successDiv.textContent = 'Organization registered successfully! Please wait for admin approval before logging in.';
                successDiv.classList.add('show');

                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Registration failed. Please try again.';
            errorDiv.classList.add('show');
        }
    });
}

/**
 * Handle logout
 */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                clearAuth();
                window.location.href = 'index.html';
            }
        });
    }
}

/**
 * Protect dashboard pages - redirect if not logged in
 */
function protectDashboard() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('dashboard')) {
        if (!isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
    }
}

// ============================================
// DONOR DASHBOARD
// ============================================

/**
 * Load donor profile data from API
 */
async function loadDonorProfile() {
    console.log('Loading donor profile...');
    const user = getCurrentUser();
    console.log('Current user:', user);
    
    if (!user || user.role !== 'donor') {
        console.log('Redirecting to login - user not found or not donor');
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('Making profile request...');
        const response = await apiRequest('/auth/profile');
        console.log('Profile response:', response);
        console.log('Response keys:', Object.keys(response));
        const donor = response.user || response.donor;
        console.log('Donor data:', donor);

        // Populate profile information
        document.getElementById('donorName').textContent = donor.fullName || '-';
        document.getElementById('donorBloodGroup').textContent = donor.bloodGroup || '-';
        document.getElementById('donorLocation').textContent = donor.location || '-';
        document.getElementById('donorEmail').textContent = donor.email || '-';
        document.getElementById('donorPhone').textContent = donor.phone || '-';

        // Set availability toggle
        const toggleBtn = document.getElementById('availabilityToggle');
        const availabilityStatus = document.getElementById('availabilityStatus');
        
        if (donor.availability === 'available') {
            toggleBtn.classList.remove('unavailable');
            availabilityStatus.textContent = 'Available';
        } else {
            toggleBtn.classList.add('unavailable');
            availabilityStatus.textContent = 'Not Available';
        }

        // Toggle availability
        toggleBtn.addEventListener('click', async () => {
            const newAvailability = donor.availability === 'available' ? 'not-available' : 'available';
            
            try {
                await apiRequest('/auth/availability', {
                    method: 'PUT',
                    body: JSON.stringify({ availability: newAvailability })
                });

                // Update UI
                if (newAvailability === 'available') {
                    toggleBtn.classList.remove('unavailable');
                    availabilityStatus.textContent = 'Available';
                    donor.availability = 'available';
                } else {
                    toggleBtn.classList.add('unavailable');
                    availabilityStatus.textContent = 'Not Available';
                    donor.availability = 'not-available';
                }

                // Update stored user
                saveAuth(localStorage.getItem('token'), donor);
            } catch (error) {
                alert('Failed to update availability: ' + error.message);
            }
        });
    } catch (error) {
        console.error('Failed to load profile:', error);
        if (error.message.includes('token') || error.message.includes('401') || error.message.includes('403')) {
            clearAuth();
            window.location.href = 'login.html';
        }
    }
}

/**
 * Load notifications for donor from API
 */
async function loadDonorNotifications() {
    const user = getCurrentUser();
    if (!user || user.role !== 'donor') return;
    
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    try {
        const response = await apiRequest('/donor/notifications');
        const requests = response.requests || [];
        
        if (requests.length === 0) {
            notificationsList.innerHTML = `
                <div class="notification-item">
                    <p style="color: var(--text-light); text-align: center;">
                        <i class="fas fa-bell" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No blood requests matching your blood group at the moment.</p>
                    </p>
                </div>
            `;
            return;
        }

        const requestsHTML = requests.map(req => {
            const urgencyClass = `urgency-${req.urgency}`;
            const date = new Date(req.createdAt).toLocaleString();
            
            return `
                <div class="notification-item">
                    <div class="notification-header">
                        <div class="notification-title">
                            <i class="fas fa-exclamation-circle"></i>
                            Blood Request - ${req.bloodGroup}
                        </div>
                        <span class="urgency-badge ${urgencyClass}">
                            ${req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                        </span>
                    </div>
                    <div class="notification-details">
                        <p><strong>Location:</strong> ${req.location}</p>
                        <p><strong>Requested:</strong> ${date}</p>
                    </div>
                </div>
            `;
        }).join('');

        notificationsList.innerHTML = requestsHTML;
    } catch (error) {
        console.error('Failed to load notifications:', error);
        notificationsList.innerHTML = `
            <div class="notification-item">
                <p style="color: var(--error); text-align: center;">
                    Failed to load notifications. Please refresh the page.
                </p>
            </div>
        `;
    }
}

// ============================================
// ORGANIZATION DASHBOARD
// ============================================

/**
 * Show verification status message
 */
function showVerificationMessage(status, message) {
    // Hide the main dashboard content
    const dashboardContent = document.querySelector('.dashboard-content, .blood-request-section, .donor-list-section');
    if (dashboardContent) {
        dashboardContent.style.display = 'none';
    }
    
    // Create or show verification message
    let messageDiv = document.getElementById('verificationMessage');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'verificationMessage';
        messageDiv.className = 'verification-message';
        messageDiv.innerHTML = `
            <div class="container" style="margin-top: 50px;">
                <div class="auth-card" style="max-width: 600px; margin: 0 auto;">
                    <div class="auth-header">
                        <i class="fas ${status === 'pending' ? 'fa-clock' : status === 'rejected' ? 'fa-times-circle' : 'fa-exclamation-triangle'}"></i>
                        <h2>${status === 'pending' ? 'Verification Pending' : status === 'rejected' ? 'Verification Rejected' : 'Not Verified'}</h2>
                    </div>
                    <div class="verification-content" style="text-align: center; padding: 20px;">
                        <p style="font-size: 1.1rem; margin-bottom: 20px;">${message}</p>
                        ${status === 'pending' ? '<p style="color: #666;"><i class="fas fa-info-circle"></i> Admin will review your PAN details and approve/reject your organization.</p>' : ''}
                        ${status === 'rejected' ? '<p style="color: #dc3545;"><i class="fas fa-phone"></i> Contact admin if you believe this is an error.</p>' : ''}
                        <div style="margin-top: 30px;">
                            <button onclick="window.location.href='login.html'" class="btn btn-primary">
                                <i class="fas fa-arrow-left"></i> Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert into the page
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(messageDiv);
        }
    } else {
        messageDiv.querySelector('p').textContent = message;
    }
}

/**
 * Handle blood request form submission
 */
function initBloodRequestForm() {
    const requestForm = document.getElementById('requestBloodForm');
    if (!requestForm) return;

    // Check organization verification status first
    const authData = getAuthData();
    if (authData && authData.role !== 'donor') {
        // This is an organization, check verification status
        if (authData.verificationStatus === 'pending') {
            showVerificationMessage('pending', 'Your details are being verified by admin. Please wait for approval.');
            return;
        }
        
        if (authData.verificationStatus === 'rejected') {
            const rejectionReason = authData.rejectionReason || 'Please contact admin for details.';
            showVerificationMessage('rejected', `Your organization verification was rejected: ${rejectionReason}`);
            return;
        }
        
        if (!authData.isVerified || authData.verificationStatus !== 'approved') {
            showVerificationMessage('not-verified', 'Your organization is not verified. Please contact admin.');
            return;
        }
    }

    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bloodGroup = document.getElementById('requiredBloodGroup').value;
        const location = document.getElementById('requestLocation').value.trim();
        const urgency = document.getElementById('urgencyLevel').value;
        const quantity = document.getElementById('quantity')?.value || 1;
        const hospitalName = document.getElementById('hospitalName')?.value || 'General Hospital';
        const requiredDate = document.getElementById('requiredDate')?.value || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const errorDiv = document.getElementById('requestError');
        const successDiv = document.getElementById('requestSuccess');

        // Clear previous messages
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');

        // Validation
        if (!bloodGroup || !location || !urgency || !quantity || !hospitalName || !requiredDate) {
            errorDiv.textContent = 'Please fill in all required fields.';
            errorDiv.classList.add('show');
            return;
        }

        // Validate quantity is a positive integer
        if (quantity < 1 || !Number.isInteger(Number(quantity))) {
            errorDiv.textContent = 'Quantity must be at least 1 unit.';
            errorDiv.classList.add('show');
            return;
        }

        // Validate required date is in the future
        if (new Date(requiredDate) <= new Date()) {
            errorDiv.textContent = 'Required date must be in the future.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            const requestData = {
                bloodGroup,
                quantity: parseInt(quantity),
                hospitalName,
                location,
                urgencyLevel: urgency,
                requiredDate
            };

            console.log('Sending blood request:', requestData);

            const response = await apiRequest('/blood-requests', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            console.log('Blood request response:', response);

            // Show success message with notification stats
            if (response.notificationStats) {
                successDiv.textContent = `Blood request submitted successfully! ${response.notificationStats.emailsSent} matching donors have been notified by email.`;
            } else {
                successDiv.textContent = 'Blood request submitted successfully!';
            }
            successDiv.classList.add('show');

            // Reset form
            requestForm.reset();

            // Reload donor list
            loadDonorList();
        } catch (error) {
            console.error('Blood request error:', error);
            console.error('Error details:', {
                message: error.message,
                errors: error.errors,
                status: error.status,
                stack: error.stack
            });
            
            // Show specific validation errors if available
            if (error.errors && Array.isArray(error.errors)) {
                errorDiv.textContent = `Validation failed: ${error.errors.join(', ')}`;
            } else {
                errorDiv.textContent = error.message || 'Failed to submit request. Please try again.';
            }
            errorDiv.classList.add('show');
        }
    });
}

/**
 * Load donor list for organization from API
 */
async function loadDonorList() {
    const donorList = document.getElementById('donorList');
    if (!donorList) return;

    try {
        const response = await apiRequest('/auth/donors');
        const donors = response.donors;

        if (donors.length === 0) {
            donorList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No available donors at the moment.</p>
                </div>
            `;
            return;
        }

        donorList.innerHTML = donors.map(donor => {
            const statusClass = donor.availability === 'available' ? 'status-available' : 'status-not-available';
            
            return `
                <div class="donor-card">
                    <div class="donor-card-header">
                        <div class="donor-name">${donor.fullName}</div>
                        <span class="status-badge ${statusClass}">
                            ${donor.availability === 'available' ? 'Available' : 'Not Available'}
                        </span>
                    </div>
                    <div class="donor-details">
                        <div class="donor-detail-item">
                            <i class="fas fa-tint"></i>
                            <span><strong>Blood Group:</strong> ${donor.bloodGroup}</span>
                        </div>
                        <div class="donor-detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span><strong>Location:</strong> ${donor.location}</span>
                        </div>
                        <div class="donor-detail-item">
                            <i class="fas fa-phone"></i>
                            <span><strong>Phone:</strong> ${donor.phone}</span>
                        </div>
                        <div class="donor-detail-item">
                            <i class="fas fa-envelope"></i>
                            <span><strong>Email:</strong> ${donor.email}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary contact-btn" onclick="contactDonor('${donor.email}', '${donor.phone}')">
                        <i class="fas fa-phone-alt"></i>
                        Contact Donor
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load donors:', error);
        donorList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--error);">
                <p>Failed to load donors. Please refresh the page.</p>
            </div>
        `;
    }
}

/**
 * Contact donor function (global for onclick handlers)
 */
window.contactDonor = function(email, phone) {
    alert(`Contact Information:\n\nEmail: ${email}\nPhone: ${phone}\n\nIn a real application, this would open a contact form or initiate a call.`);
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize page-specific functionality based on current page
 */
function initPage() {
    try {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';

        // Initialize common features
        try {
            initMobileMenu();
        } catch (e) {
            console.warn('Mobile menu initialization failed:', e);
        }

        try {
            initLogout();
        } catch (e) {
            console.warn('Logout initialization failed:', e);
        }

        try {
            protectDashboard();
        } catch (e) {
            console.warn('Dashboard protection failed:', e);
        }

        // Page-specific initialization
        try {
            switch (currentPage) {
                case 'login.html':
                    initLoginForm();
                    break;
                case 'register.html':
                    initRegisterForm();
                    break;
                case 'org-register.html':
                    initOrgRegisterForm();
                    break;
                case 'donor-dashboard.html':
                    loadDonorProfile();
                    loadDonorNotifications();
                    break;
                case 'org-dashboard.html':
                    initBloodRequestForm();
                    loadDonorList();
                    break;
                default:
                    // Landing page - no specific initialization needed
                    break;
            }
        } catch (e) {
            console.warn('Page-specific initialization failed:', e);
        }
    } catch (e) {
        console.error('Page initialization error:', e);
    }
} // Added missing closing brace here

// ============================================
// DONOR BLOOD REQUESTS
// ============================================

/**
 * Load blood requests for logged-in donor
 */
async function loadDonorRequests() {
    console.log('Loading donor blood requests...');
    const user = getCurrentUser();
    
    if (!user || user.role !== 'donor') {
        console.log('User not logged in as donor');
        return;
    }

    try {
        const response = await apiRequest('/donor/requests');
        console.log('Donor requests response:', response);
        
        if (response.success) {
            displayDonorRequests(response.data);
        } else {
            console.error('Failed to load donor requests:', response.message);
            document.getElementById('notificationsList').innerHTML = 
                '<div class="notification-item">Unable to load blood requests. Please try again.</div>';
        }
    } catch (error) {
        console.error('Error loading donor requests:', error);
        document.getElementById('notificationsList').innerHTML = 
            '<div class="notification-item">Error loading blood requests. Please try again.</div>';
    }
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    // DOM already loaded
    initPage();
}
