// ============================================
// Authentication Utilities
// ============================================

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('merchantData');
    return userData ? JSON.parse(userData) : null;
}

// Get username
function getUsername() {
    return localStorage.getItem('username');
}

// Save authentication data
function saveAuthData(token, username, merchantData) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    if (merchantData) {
        localStorage.setItem('merchantData', JSON.stringify(merchantData));
    }
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('merchantData');
}

// Redirect to login if not authenticated
function requireAuth(redirectUrl = '/login.html') {
    if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// Redirect to dashboard if already authenticated
function redirectIfAuthenticated(dashboardUrl = null) {
    if (isAuthenticated()) {
        const username = getUsername();
        const url = dashboardUrl || `/dashboard.html?username=${username}`;
        window.location.href = url;
        return true;
    }
    return false;
}

// Logout function
function logout() {
    clearAuthData();
    window.location.href = '/index.html';
}

// Export functions
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getUsername = getUsername;
window.saveAuthData = saveAuthData;
window.clearAuthData = clearAuthData;
window.requireAuth = requireAuth;
window.redirectIfAuthenticated = redirectIfAuthenticated;
window.logout = logout;
