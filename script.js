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

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned an invalid response. Make sure the backend server is running on http://localhost:3000');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
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
        return localStorage.getItem('token') !== null && localStorage.getItem('currentUser') !== null;
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
        if (!email || !password || !role) {
            errorDiv.textContent = 'Please fill in all fields.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            const response = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password, role })
            });

            // Save authentication
            saveAuth(response.token, response.user);

            // Redirect based on role
            if (role === 'donor') {
                window.location.href = 'donor-dashboard.html';
            } else {
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
            const response = await apiRequest('/register', {
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
function initOrgRegisterForm() {
    const orgRegisterForm = document.getElementById('orgRegisterForm');
    if (!orgRegisterForm) return;

    orgRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('orgName').value.trim();
        const email = document.getElementById('orgEmail').value.trim();
        const location = document.getElementById('orgLocation').value.trim();
        const password = document.getElementById('orgPassword').value;
        const confirmPassword = document.getElementById('orgConfirmPassword').value;
        const errorDiv = document.getElementById('orgRegisterError');
        const successDiv = document.getElementById('orgRegisterSuccess');

        // Clear previous messages
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');

        // Validation
        if (!name || !email || !location || !password || !confirmPassword) {
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
            const response = await apiRequest('/register-organization', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    email,
                    location,
                    password
                })
            });

            // Save authentication
            saveAuth(response.token, response.user);

            // Show success message
            successDiv.textContent = 'Organization registration successful! Redirecting to dashboard...';
            successDiv.classList.add('show');

            // Redirect to organization dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'org-dashboard.html';
            }, 2000);
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
    const user = getCurrentUser();
    if (!user || user.role !== 'donor') {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await apiRequest('/profile');
        const donor = response.user;

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
                await apiRequest('/donor/availability', {
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
        const requests = response.requests;

        if (requests.length === 0) {
            notificationsList.innerHTML = `
                <div class="notification-item">
                    <p style="color: var(--text-light); text-align: center;">
                        No blood requests matching your blood group at the moment.
                    </p>
                </div>
            `;
            return;
        }

        notificationsList.innerHTML = requests.map(req => {
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
 * Handle blood request form submission
 */
function initBloodRequestForm() {
    const requestForm = document.getElementById('requestBloodForm');
    if (!requestForm) return;

    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bloodGroup = document.getElementById('requiredBloodGroup').value;
        const location = document.getElementById('requestLocation').value.trim();
        const urgency = document.getElementById('urgency').value;
        const errorDiv = document.getElementById('requestError');
        const successDiv = document.getElementById('requestSuccess');

        // Clear previous messages
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');

        // Validation
        if (!bloodGroup || !location || !urgency) {
            errorDiv.textContent = 'Please fill in all fields.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            await apiRequest('/blood-request', {
                method: 'POST',
                body: JSON.stringify({ bloodGroup, location, urgency })
            });

            // Show success message
            successDiv.textContent = 'Blood request submitted successfully!';
            successDiv.classList.add('show');

            // Reset form
            requestForm.reset();

            // Reload donor list
            loadDonorList();
        } catch (error) {
            errorDiv.textContent = error.message || 'Failed to submit request. Please try again.';
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
        const response = await apiRequest('/donors');
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
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    // DOM already loaded
    initPage();
}
