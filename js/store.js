// ============================================
// Store (Public Storefront) JavaScript
// ============================================

let storeData = null;
let products = [];
let selectedProduct = null;

// ============================================
// Initialize Store
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const username = getUrlParameter('username');

    if (!username) {
        showError('رابط المتجر غير صحيح');
        return;
    }

    await loadStore(username);
    setupEventListeners();
});

// ============================================
// Load Store Data
// ============================================
async function loadStore(username) {
    try {
        showLoading('productsContainer');

        const response = await storeAPI.getStore(username);
        storeData = response.store || response;
        products = response.products || storeData.products || [];

        // Update store branding
        updateStoreBranding();

        // Render products
        renderProducts();

    } catch (error) {
        console.error('Error loading store:', error);
        showError(error.message || 'فشل تحميل المتجر');
    }
}

// ============================================
// Update Store Branding
// ============================================
function updateStoreBranding() {
    if (!storeData) return;

    // Update title
    document.title = storeData.name || 'المتجر';
    document.getElementById('storeTitle').textContent = storeData.name || 'المتجر';
    document.getElementById('storeName').textContent = storeData.name || 'المتجر';

    // Update logo if available
    if (storeData.logo_url) {
        const logo = document.getElementById('storeLogo');
        logo.src = storeData.logo_url;
        logo.style.display = 'block';
    }
}

// ============================================
// Render Products
// ============================================
function renderProducts() {
    const container = document.getElementById('productsContainer');

    if (products.length === 0) {
        container.innerHTML = `
      <div class="store-empty">
        <div class="store-empty-icon">📦</div>
        <h2 class="store-empty-title">لا توجد منتجات حاليًا</h2>
        <p class="store-empty-description">يرجى العودة لاحقًا</p>
      </div>
    `;
        return;
    }

    const html = products.map(product => {
        const isOutOfStock = product.stock !== undefined && product.stock <= 0;

        return `
      <div class="store-product-card" onclick="openOrderModal(${product.id})">
        <img 
          src="${product.images && product.images[0] || 'https://via.placeholder.com/400x300?text=منتج'}" 
          alt="${product.title}" 
          class="store-product-image"
        >
        <div class="store-product-info">
          <h3 class="store-product-title">${product.title}</h3>
          ${product.description ? `
            <p class="store-product-description">${product.description}</p>
          ` : ''}
          <div class="store-product-price">${formatCurrency(product.price)}</div>
          ${product.stock !== undefined ? `
            <div class="store-product-stock ${isOutOfStock ? 'out-of-stock' : ''}">
              ${isOutOfStock ? 'غير متوفر' : `متوفر (${product.stock})`}
            </div>
          ` : ''}
          <div class="store-product-actions">
            ${!isOutOfStock ? `
              <button class="btn btn-primary btn-block" onclick="event.stopPropagation(); openOrderModal(${product.id})">
                اطلب الآن
              </button>
            ` : `
              <button class="btn btn-secondary btn-block" disabled>
                غير متوفر
              </button>
            `}
          </div>
        </div>
      </div>
    `;
    }).join('');

    container.innerHTML = html;
}

// ============================================
// Open Order Modal
// ============================================
function openOrderModal(productId) {
    selectedProduct = products.find(p => p.id === productId);

    if (!selectedProduct) return;

    // Check if out of stock
    if (selectedProduct.stock !== undefined && selectedProduct.stock <= 0) {
        showToast('هذا المنتج غير متوفر حاليًا', 'warning');
        return;
    }

    // Update selected product info
    const infoContainer = document.getElementById('selectedProductInfo');
    infoContainer.innerHTML = `
    <img 
      src="${selectedProduct.images && selectedProduct.images[0] || 'https://via.placeholder.com/80x80?text=منتج'}" 
      alt="${selectedProduct.title}" 
      class="selected-product-image"
    >
    <div class="selected-product-info">
      <div class="selected-product-title">${selectedProduct.title}</div>
      <div class="selected-product-price">${formatCurrency(selectedProduct.price)}</div>
    </div>
  `;

    // Set product ID
    document.getElementById('selectedProductId').value = productId;

    // Reset form
    document.getElementById('orderForm').reset();
    document.getElementById('quantity').value = 1;

    // Open modal
    openModal('orderModal');
}

// ============================================
// Setup Event Listeners
// ============================================
function setupEventListeners() {
    // Submit order button
    document.getElementById('submitOrderBtn').addEventListener('click', submitOrder);

    // Quantity change - update price display
    document.getElementById('quantity').addEventListener('input', function () {
        if (selectedProduct) {
            const quantity = parseInt(this.value) || 1;
            const total = selectedProduct.price * quantity;
            // Could update a total display here if needed
        }
    });
}

// ============================================
// Submit Order
// ============================================
async function submitOrder() {
    // Get form data
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const notes = document.getElementById('notes').value.trim();

    // Validation
    if (!customerName) {
        showFieldError('customerName', 'الاسم مطلوب');
        return;
    }

    if (!validatePhone(customerPhone)) {
        showFieldError('customerPhone', 'رقم الهاتف غير صحيح');
        return;
    }

    if (!customerAddress) {
        showFieldError('customerAddress', 'العنوان مطلوب');
        return;
    }

    if (!quantity || quantity < 1) {
        showFieldError('quantity', 'الكمية يجب أن تكون 1 على الأقل');
        return;
    }

    // Check stock
    if (selectedProduct.stock !== undefined && quantity > selectedProduct.stock) {
        showToast(`الكمية المتوفرة: ${selectedProduct.stock} فقط`, 'error');
        return;
    }

    // Prepare order data
    const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        address: customerAddress,
        items: [
            {
                product_id: selectedProduct.id,
                quantity: quantity,
                price: selectedProduct.price,
            }
        ],
        total: selectedProduct.price * quantity,
        notes: notes,
    };

    // Submit order
    setButtonLoading('submitOrderBtn', true);

    try {
        const username = getUrlParameter('username');
        await storeAPI.createOrder(username, orderData);

        showToast('تم إرسال الطلب بنجاح، سيتواصل معك التاجر قريبًا.', 'success', 5000);

        // Close modal and reset
        closeModal('orderModal');
        document.getElementById('orderForm').reset();

        // Reload store to update stock
        await loadStore(username);

    } catch (error) {
        console.error('Error submitting order:', error);
        showToast(error.message || 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى', 'error');
    } finally {
        setButtonLoading('submitOrderBtn', false);
    }
}

// ============================================
// Show Error
// ============================================
function showError(message) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = `
    <div class="store-empty">
      <div class="store-empty-icon">❌</div>
      <h2 class="store-empty-title">حدث خطأ</h2>
      <p class="store-empty-description">${message}</p>
    </div>
  `;
}
