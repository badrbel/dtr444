// ============================================
// Utility Functions
// ============================================

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.remove();
        // Remove container if empty
        if (container.children.length === 0) {
            container.remove();
        }
    }, duration);
}

// ============================================
// Modal Management
// ============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============================================
// Form Validation
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    // Algerian phone format: starts with 0 and has 10 digits
    const re = /^(0)(5|6|7)[0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateUsername(username) {
    // Only letters, numbers, underscore, hyphen
    const re = /^[a-zA-Z0-9_-]+$/;
    return re.test(username) && username.length >= 3;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.add('error');

    // Remove existing error message
    const existingError = field.parentElement.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }

    // Add new error message
    if (message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('error');

    const errorDiv = field.parentElement.querySelector('.form-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(el => el.remove());
}

// ============================================
// Copy to Clipboard
// ============================================
async function copyToClipboard(text, successMessage = 'تم نسخ الرابط') {
    try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage, 'success');
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(successMessage, 'success');
            return true;
        } catch (err) {
            showToast('فشل النسخ', 'error');
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// ============================================
// Date Formatting (Arabic)
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-DZ', options);
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    };
    return date.toLocaleDateString('ar-DZ', options);
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`;

    return formatDateShort(dateString);
}

// ============================================
// Number Formatting (Arabic)
// ============================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-DZ', {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('ar-DZ').format(number);
}

// ============================================
// Loading States
// ============================================
function setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span> جاري التحميل...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; padding: 3rem;">
      <div class="spinner spinner-primary" style="width: 40px; height: 40px; border-width: 4px;"></div>
    </div>
  `;
}

function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
}

// ============================================
// URL Parameters
// ============================================
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function setUrlParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// ============================================
// Debounce Function
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// Image Preview
// ============================================
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview || !input.files || !input.files[0]) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
}

// ============================================
// Confirmation Dialog
// ============================================
function confirm(message, onConfirm, onCancel) {
    const confirmed = window.confirm(message);
    if (confirmed && onConfirm) {
        onConfirm();
    } else if (!confirmed && onCancel) {
        onCancel();
    }
    return confirmed;
}

// ============================================
// Export Functions
// ============================================
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validatePassword = validatePassword;
window.validateUsername = validateUsername;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.clearAllErrors = clearAllErrors;
window.copyToClipboard = copyToClipboard;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.getTimeAgo = getTimeAgo;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.setButtonLoading = setButtonLoading;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.getUrlParameter = getUrlParameter;
window.setUrlParameter = setUrlParameter;
window.debounce = debounce;
window.previewImage = previewImage;
