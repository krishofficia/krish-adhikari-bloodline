/**
 * Admin Login JavaScript - Clean Version
 */

document.addEventListener('DOMContentLoaded', function() {
    // Setup form submission
    const form = document.getElementById('adminLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    
    // Handle admin login
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        console.log('=== ADMIN LOGIN DEBUG ===');
        console.log('Username:', username);
        console.log('Password length:', password.length);
        console.log('Current admin token:', localStorage.getItem('adminToken'));
        console.log('Current admin user:', localStorage.getItem('adminUser'));
        console.log('==========================');

        // Clear any existing admin data first
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        console.log('Cleared existing admin data');

        // Disable button
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const response = await fetch('http://localhost:3000/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const data = await response.json();
            console.log('Admin login response:', data);
            
            // Save admin authentication
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
            
            console.log('=== ADMIN LOGIN SUCCESS ===');
            console.log('Response data:', data);
            console.log('Token saved:', data.token);
            console.log('Admin saved:', data.admin);
            console.log('About to redirect to dashboard...');
            console.log('==========================');
            
            showAlert('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard
            setTimeout(function() {
                console.log('Executing redirect to admin-dashboard.html');
                window.location.href = 'admin-dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Network error. Please try again.', 'error');
        } finally {
            // Re-enable button
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Admin Dashboard';
        }
    });
});

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Show alert message
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    
    // Remove existing alerts
    alertContainer.innerHTML = '';
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type;
    alert.innerHTML = '<i class="fas ' + (type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle') + '"></i> ' + message;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(function() {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Handle Enter key in form
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const form = document.getElementById('adminLoginForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});
