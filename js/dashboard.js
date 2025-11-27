// ============================================
// Dashboard JavaScript
// ============================================

// Check authentication
if (!requireAuth()) {
    // Will redirect to login
}

// Global state
let merchantData = null;
let products = [];
let orders = [];
let notifications = [];

// ============================================
// Initialize Dashboard
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadMerchantData();
    setupEventListeners();
    await loadDashboardData();
});

// ============================================
// Load Merchant Data
// ============================================
async function loadMerchantData() {
    try {
        const response = await merchantAPI.getProfile();
        merchantData = response;

        // Update UI
        document.getElementById('merchantName').textContent = merchantData.name;

        // Update profile form
        if (merchantData) {
            document.getElementById('profileName').value = merchantData.name || '';
            document.getElementById('profileEmail').value = merchantData.email || '';
            document.getElementById('profilePhone').value = merchantData.phone || '';

            // Payment settings
            if (merchantData.payment_preference) {
                document.querySelector(`input[name="paymentMethod"][value="${merchantData.payment_preference}"]`).checked = true;
                togglePaymentOptions();
            }

            if (merchantData.contact_links) {
                document.getElementById('whatsappLink').value = merchantData.contact_links.whatsapp || '';
                document.getElementById('instagramLink').value = merchantData.contact_links.instagram || '';
                document.getElementById('facebookLink').value = merchantData.contact_links.facebook || '';
            }
        }
    } catch (error) {
        console.error('Error loading merchant data:', error);
        showToast('فشل تحميل بيانات التاجر', 'error');
    }
}

// ============================================
// Load Dashboard Data
// ============================================
async function loadDashboardData() {
    await Promise.all([
        loadProducts(),
        loadOrders(),
        loadNotifications(),
    ]);

    updateStatistics();
}

// ============================================
// Load Products
// ============================================
async function loadProducts() {
    try {
        showLoading('productsContainer');
        const response = await merchantAPI.getProducts();
        products = response.products || response || [];
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsContainer').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">فشل تحميل المنتجات</h3>
        <p class="empty-state-description">${error.message}</p>
      </div>
    `;
    }
}

function renderProducts() {
    const container = document.getElementById('productsContainer');

    if (products.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3 class="empty-state-title">لا توجد منتجات</h3>
        <p class="empty-state-description">ابدأ بإضافة منتجك الأول</p>
        <button class="btn btn-primary" onclick="openAddProductModal()">+ إضافة منتج</button>
      </div>
    `;
        return;
    }

    const html = `
    <div class="products-grid">
      ${products.map(product => `
        <div class="product-card">
          <img src="${product.images && product.images[0] || 'https://via.placeholder.com/400x300?text=منتج'}" 
               alt="${product.title}" 
               class="product-image">
          <div class="product-info">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-description">${product.description || 'لا يوجد وصف'}</p>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-stock">المخزون: ${product.stock || 0}</div>
            <div class="product-actions">
              <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">تعديل</button>
              <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">حذف</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

    container.innerHTML = html;
}

// ============================================
// Load Orders
// ============================================
async function loadOrders() {
    try {
        showLoading('ordersContainer');
        const response = await merchantAPI.getOrders();
        orders = response.orders || response || [];
        renderOrders();
        renderRecentOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersContainer').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">فشل تحميل الطلبات</h3>
        <p class="empty-state-description">${error.message}</p>
      </div>
    `;
    }
}

function renderOrders() {
    const container = document.getElementById('ordersContainer');

    if (orders.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3 class="empty-state-title">لا توجد طلبات</h3>
        <p class="empty-state-description">ستظهر الطلبات هنا عندما يطلب العملاء من متجرك</p>
      </div>
    `;
        return;
    }

    const html = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>العميل</th>
            <th>الهاتف</th>
            <th>المبلغ</th>
            <th>الحالة</th>
            <th>التاريخ</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>#${order.id}</td>
              <td>${order.customer_name}</td>
              <td>${order.customer_phone}</td>
              <td>${formatCurrency(order.total)}</td>
              <td>${getOrderStatusBadge(order.status)}</td>
              <td>${formatDateShort(order.created_at)}</td>
              <td>
                <div class="d-flex gap-1">
                  ${order.status === 'new' ? `
                    <button class="btn btn-sm btn-success" onclick="updateOrderStatus(${order.id}, 'confirmed')">تأكيد</button>
                    <button class="btn btn-sm btn-danger" onclick="updateOrderStatus(${order.id}, 'cancelled')">إلغاء</button>
                  ` : ''}
                  <a href="https://wa.me/${order.customer_phone.replace(/\D/g, '')}" 
                     target="_blank" 
                     class="btn btn-sm btn-primary">واتساب</a>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

    container.innerHTML = html;
}

function renderRecentOrders() {
    const container = document.getElementById('recentOrdersContainer');
    const recentOrders = orders.slice(0, 5);

    if (recentOrders.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">لا توجد طلبات حديثة</p>';
        return;
    }

    const html = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>العميل</th>
            <th>المبلغ</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${recentOrders.map(order => `
            <tr>
              <td>#${order.id}</td>
              <td>${order.customer_name}</td>
              <td>${formatCurrency(order.total)}</td>
              <td>${getOrderStatusBadge(order.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

    container.innerHTML = html;
}

function getOrderStatusBadge(status) {
    const statusMap = {
        'new': { label: 'جديد', class: 'badge-info' },
        'pending_confirmation': { label: 'في انتظار التأكيد', class: 'badge-warning' },
        'confirmed': { label: 'مؤكد', class: 'badge-success' },
        'out_for_delivery': { label: 'قيد التوصيل', class: 'badge-primary' },
        'delivered': { label: 'تم التوصيل', class: 'badge-success' },
        'cancelled': { label: 'ملغي', class: 'badge-danger' },
    };

    const statusInfo = statusMap[status] || { label: status, class: 'badge-secondary' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.label}</span>`;
}

async function updateOrderStatus(orderId, status) {
    try {
        await merchantAPI.updateOrderStatus(orderId, status);
        showToast('تم تحديث حالة الطلب بنجاح', 'success');
        await loadOrders();
        updateStatistics();
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast(error.message || 'فشل تحديث حالة الطلب', 'error');
    }
}

// ============================================
// Load Notifications
// ============================================
async function loadNotifications() {
    try {
        // Notifications are part of merchant data
        notifications = merchantData.notifications || [];
        renderNotifications();
        updateNotificationBadge();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function renderNotifications() {
    const container = document.getElementById('notificationsContainer');

    if (notifications.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔔</div>
        <h3 class="empty-state-title">لا توجد إشعارات</h3>
        <p class="empty-state-description">ستظهر الإشعارات من الإدارة هنا</p>
      </div>
    `;
        return;
    }

    const html = notifications.map(notif => `
    <div class="notification-card ${notif.read ? '' : 'unread'}">
      <div class="notification-header">
        <h4 class="notification-title">${notif.title}</h4>
        <span class="notification-time">${getTimeAgo(notif.created_at)}</span>
      </div>
      <div class="notification-body">${notif.body}</div>
      ${!notif.read ? `
        <div class="notification-actions">
          <button class="btn btn-sm btn-primary" onclick="markNotificationRead(${notif.id})">علامة مقروء</button>
        </div>
      ` : ''}
    </div>
  `).join('');

    container.innerHTML = html;
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

async function markNotificationRead(notificationId) {
    // Update locally
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
        notif.read = true;
        renderNotifications();
        updateNotificationBadge();
        showToast('تم وضع علامة مقروء', 'success');
    }
}

// ============================================
// Update Statistics
// ============================================
function updateStatistics() {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const pendingOrders = orders.filter(o => ['new', 'pending_confirmation'].includes(o.status));
    const totalSales = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    document.getElementById('todayOrders').textContent = todayOrders.length;
    document.getElementById('totalSales').textContent = formatCurrency(totalSales);
    document.getElementById('pendingOrders').textContent = pendingOrders.length;
}

// ============================================
// Product Management
// ============================================
function openAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'إضافة منتج';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productImagePreview').style.display = 'none';
    openModal('productModal');
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('productModalTitle').textContent = 'تعديل منتج';
    document.getElementById('productId').value = product.id;
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock || 0;

    if (product.images && product.images[0]) {
        const preview = document.getElementById('productImagePreview');
        preview.src = product.images[0];
        preview.style.display = 'block';
    }

    openModal('productModal');
}

async function deleteProduct(productId) {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
        await merchantAPI.deleteProduct(productId);
        showToast('تم حذف المنتج بنجاح', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(error.message || 'فشل حذف المنتج', 'error');
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);

            // Update active state
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Close sidebar on mobile
            if (window.innerWidth <= 1024) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    });

    // Menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            logout();
        }
    });

    // Copy store link
    document.getElementById('copyStoreLinkBtn').addEventListener('click', () => {
        const username = getUsername();
        const storeLink = `${window.location.origin}/store.html?username=${username}`;
        copyToClipboard(storeLink, 'تم نسخ رابط المتجر');
    });

    // Add product button
    document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);

    // Save product
    document.getElementById('saveProductBtn').addEventListener('click', saveProduct);

    // Product image preview
    document.getElementById('productImage').addEventListener('change', function () {
        previewImage(this, 'productImagePreview');
    });

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });

    // Payment form
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePaymentSettings();
    });

    // Payment method change
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', togglePaymentOptions);
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function togglePaymentOptions() {
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const codOptions = document.getElementById('codOptions');
    const contactOptions = document.getElementById('contactOptions');

    if (method === 'COD') {
        codOptions.style.display = 'block';
        contactOptions.style.display = 'none';
    } else if (method === 'CONTACT') {
        codOptions.style.display = 'none';
        contactOptions.style.display = 'block';
    } else {
        codOptions.style.display = 'none';
        contactOptions.style.display = 'none';
    }
}

async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const title = document.getElementById('productTitle').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const imageFile = document.getElementById('productImage').files[0];

    if (!title || !price) {
        showToast('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    setButtonLoading('saveProductBtn', true);

    try {
        let imageUrl = null;

        // Upload image if selected
        if (imageFile) {
            const uploadResponse = await merchantAPI.uploadImage(imageFile);
            imageUrl = uploadResponse.url;
        }

        const productData = {
            title,
            description,
            price,
            stock,
            images: imageUrl ? [imageUrl] : undefined,
        };

        if (productId) {
            // Update existing product
            await merchantAPI.updateProduct(productId, productData);
            showToast('تم تحديث المنتج بنجاح', 'success');
        } else {
            // Create new product
            await merchantAPI.createProduct(productData);
            showToast('تم إضافة المنتج بنجاح', 'success');
        }

        closeModal('productModal');
        await loadProducts();

    } catch (error) {
        console.error('Error saving product:', error);
        showToast(error.message || 'فشل حفظ المنتج', 'error');
    } finally {
        setButtonLoading('saveProductBtn', false);
    }
}

async function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();

    setButtonLoading('saveProfileBtn', true);

    try {
        await merchantAPI.updateProfile({ name, email, phone });
        showToast('تم حفظ التغييرات بنجاح', 'success');
        await loadMerchantData();
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast(error.message || 'فشل حفظ التغييرات', 'error');
    } finally {
        setButtonLoading('saveProfileBtn', false);
    }
}

async function savePaymentSettings() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const confirmMethod = document.querySelector('input[name="confirmMethod"]:checked')?.value;
    const whatsapp = document.getElementById('whatsappLink').value.trim();
    const instagram = document.getElementById('instagramLink').value.trim();
    const facebook = document.getElementById('facebookLink').value.trim();

    setButtonLoading('savePaymentBtn', true);

    try {
        await merchantAPI.updateProfile({
            payment_preference: paymentMethod,
            confirmation_method: confirmMethod,
            contact_links: {
                whatsapp,
                instagram,
                facebook,
            },
        });

        showToast('تم حفظ إعدادات الدفع بنجاح', 'success');
        await loadMerchantData();
    } catch (error) {
        console.error('Error saving payment settings:', error);
        showToast(error.message || 'فشل حفظ الإعدادات', 'error');
    } finally {
        setButtonLoading('savePaymentBtn', false);
    }
}
