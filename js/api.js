// ============================================
// API Service Layer
// Handles all API communication with Django backend
// ============================================

const API_BASE_URL = '/api'; // Change this to your Django backend URL if different

// ============================================
// CSRF Token Management
// ============================================
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function getCSRFToken() {
  return getCookie('csrftoken');
}

// ============================================
// API Request Wrapper
// ============================================
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add CSRF token for non-GET requests
  if (options.method && options.method !== 'GET') {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }
  
  // Add authorization token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Prepare fetch options
  const fetchOptions = {
    ...options,
    headers,
  };
  
  // Convert body to JSON if it's an object
  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Handle errors
    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || data.error || 'حدث خطأ في الاتصال بالخادم',
        data: data,
      };
    }
    
    return data;
  } catch (error) {
    // Network error or parsing error
    if (!error.status) {
      throw {
        status: 0,
        message: 'فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
        data: null,
      };
    }
    throw error;
  }
}

// ============================================
// Authentication API
// ============================================
const authAPI = {
  // Register new merchant
  async register(data) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: data,
    });
  },
  
  // Login merchant
  async login(email, password) {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  
  // Request password reset
  async requestPasswordReset(email) {
    return await apiRequest('/auth/password-reset', {
      method: 'POST',
      body: { email },
    });
  },
  
  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('merchantData');
  },
};

// ============================================
// Merchant API
// ============================================
const merchantAPI = {
  // Get merchant profile
  async getProfile() {
    return await apiRequest('/merchant/me', {
      method: 'GET',
    });
  },
  
  // Update merchant profile
  async updateProfile(data) {
    return await apiRequest('/merchant/me', {
      method: 'PUT',
      body: data,
    });
  },
  
  // Get merchant orders
  async getOrders(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/merchant/orders?${queryParams}` : '/merchant/orders';
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },
  
  // Update order status
  async updateOrderStatus(orderId, status) {
    return await apiRequest(`/merchant/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status },
    });
  },
  
  // Get products
  async getProducts() {
    return await apiRequest('/merchant/products', {
      method: 'GET',
    });
  },
  
  // Create product
  async createProduct(data) {
    return await apiRequest('/merchant/products', {
      method: 'POST',
      body: data,
    });
  },
  
  // Update product
  async updateProduct(productId, data) {
    return await apiRequest(`/merchant/products/${productId}`, {
      method: 'PUT',
      body: data,
    });
  },
  
  // Delete product
  async deleteProduct(productId) {
    return await apiRequest(`/merchant/products/${productId}`, {
      method: 'DELETE',
    });
  },
  
  // Upload product image
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    return await apiRequest('/merchant/upload-image', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  },
};

// ============================================
// Store API (Public)
// ============================================
const storeAPI = {
  // Get store data and products
  async getStore(username) {
    return await apiRequest(`/store/${username}`, {
      method: 'GET',
    });
  },
  
  // Create order (public)
  async createOrder(username, orderData) {
    return await apiRequest(`/store/${username}/orders`, {
      method: 'POST',
      body: orderData,
    });
  },
};

// ============================================
// Admin API
// ============================================
const adminAPI = {
  // Get dashboard statistics
  async getStatistics() {
    return await apiRequest('/admin/statistics', {
      method: 'GET',
    });
  },
  
  // Get all merchants
  async getMerchants(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/merchants?${queryParams}` : '/admin/merchants';
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },
  
  // Get merchant details
  async getMerchantDetails(merchantId) {
    return await apiRequest(`/admin/merchants/${merchantId}`, {
      method: 'GET',
    });
  },
  
  // Suspend merchant
  async suspendMerchant(merchantId, reason) {
    return await apiRequest(`/admin/merchants/${merchantId}/suspend`, {
      method: 'POST',
      body: { reason },
    });
  },
  
  // Delete merchant
  async deleteMerchant(merchantId, reason) {
    return await apiRequest(`/admin/merchants/${merchantId}`, {
      method: 'DELETE',
      body: { reason },
    });
  },
  
  // Send notification
  async sendNotification(data) {
    return await apiRequest('/admin/notifications', {
      method: 'POST',
      body: data,
    });
  },
  
  // Get audit logs
  async getAuditLogs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/audit-logs?${queryParams}` : '/admin/audit-logs';
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },
};

// Export APIs
window.authAPI = authAPI;
window.merchantAPI = merchantAPI;
window.storeAPI = storeAPI;
window.adminAPI = adminAPI;
