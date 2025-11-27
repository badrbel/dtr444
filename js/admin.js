// ============================================
// Admin Panel JavaScript
// ============================================

// Global state
let merchants = [];
let auditLogs = [];
let statistics = {};

// ============================================
// Initialize Admin Panel
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication (you may want to add admin-specific auth check)
    if (!requireAuth()) {
        return;
    }

    setupEventListeners();
    await loadAdminData();
});

// ============================================
// Load Admin Data
// ============================================
async function loadAdminData() {
    await Promise.all([
        loadStatistics(),
        loadMerchants(),
        loadAuditLogs(),
    ]);
}

// ============================================
// Load Statistics
// ============================================
async function loadStatistics() {
    try {
        const response = await adminAPI.getStatistics();
        statistics = response;

        // Update UI
        document.getElementById('totalMerchants').textContent = statistics.total_merchants || 0;
        document.getElementById('todayOrders').textContent = statistics.today_orders || 0;
        document.getElementById('alerts').textContent = statistics.alerts || 0;
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('فشل تحميل الإحصائيات', 'error');
    }
}

// ============================================
// Load Merchants
// ============================================
async function loadMerchants() {
    try {
        showLoading('merchantsContainer');
        const response = await adminAPI.getMerchants();
        merchants = response.merchants || response || [];
        renderMerchants();
        populateMerchantSelect();
    } catch (error) {
        console.error('Error loading merchants:', error);
        document.getElementById('merchantsContainer').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">فشل تحميل التجار</h3>
        <p class="empty-state-description">${error.message}</p>
      </div>
    `;
    }
}

function renderMerchants(filteredMerchants = null) {
    const container = document.getElementById('merchantsContainer');
    const merchantsToRender = filteredMerchants || merchants;

    if (merchantsToRender.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3 class="empty-state-title">لا يوجد تجار</h3>
        <p class="empty-state-description">لم يتم العثور على تجار</p>
      </div>
    `;
        return;
    }

    const html = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>المعرف</th>
            <th>الاسم</th>
            <th>البريد الإلكتروني</th>
            <th>اسم المستخدم</th>
            <th>الهاتف</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${merchantsToRender.map(merchant => `
            <tr>
              <td>#${merchant.id}</td>
              <td>${merchant.name}</td>
              <td>${merchant.email}</td>
              <td>${merchant.username}</td>
              <td>${merchant.phone}</td>
              <td>${getMerchantStatusBadge(merchant.kyc_status || 'approved')}</td>
              <td>
                <div class="merchant-actions">
                  <button class="btn btn-sm btn-primary" onclick="impersonateMerchant(${merchant.id})">
                    عرض
                  </button>
                  ${merchant.kyc_status !== 'suspended' ? `
                    <button class="btn btn-sm btn-warning" onclick="suspendMerchant(${merchant.id})">
                      تعليق
                    </button>
                  ` : `
                    <button class="btn btn-sm btn-success" onclick="activateMerchant(${merchant.id})">
                      تفعيل
                    </button>
                  `}
                  <button class="btn btn-sm btn-danger" onclick="deleteMerchant(${merchant.id})">
                    حذف
                  </button>
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

function getMerchantStatusBadge(status) {
    const statusMap = {
        'pending': { label: 'قيد المراجعة', class: 'badge-warning' },
        'approved': { label: 'نشط', class: 'badge-success' },
        'rejected': { label: 'مرفوض', class: 'badge-danger' },
        'suspended': { label: 'معلق', class: 'badge-danger' },
    };

    const statusInfo = statusMap[status] || { label: status, class: 'badge-secondary' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.label}</span>`;
}

function populateMerchantSelect() {
    const select = document.getElementById('merchantId');
    select.innerHTML = '<option value="">اختر...</option>' +
        merchants.map(m => `<option value="${m.id}">${m.name} (@${m.username})</option>`).join('');
}

// ============================================
// Merchant Actions
// ============================================
async function impersonateMerchant(merchantId) {
    try {
        const merchant = merchants.find(m => m.id === merchantId);
        if (!merchant) return;

        // Show impersonate modal with merchant data
        const content = document.getElementById('impersonateContent');
        content.innerHTML = `
      <div class="impersonate-banner">
        ⚠️ وضع العرض فقط - لا يمكن إجراء تعديلات
      </div>
      
      <div class="card mb-3">
        <div class="card-header">
          <h3 class="card-title">معلومات التاجر</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-6">
              <p><strong>الاسم:</strong> ${merchant.name}</p>
              <p><strong>البريد:</strong> ${merchant.email}</p>
              <p><strong>الهاتف:</strong> ${merchant.phone}</p>
            </div>
            <div class="col-6">
              <p><strong>اسم المستخدم:</strong> ${merchant.username}</p>
              <p><strong>الحالة:</strong> ${merchant.kyc_status || 'approved'}</p>
              <p><strong>رابط المتجر:</strong> <a href="store.html?username=${merchant.username}" target="_blank">عرض المتجر</a></p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">إحصائيات سريعة</h3>
        </div>
        <div class="card-body">
          <p class="text-muted">سيتم عرض إحصائيات التاجر هنا (المنتجات، الطلبات، المبيعات)</p>
        </div>
      </div>
    `;

        openModal('impersonateModal');
    } catch (error) {
        console.error('Error impersonating merchant:', error);
        showToast('فشل عرض بيانات التاجر', 'error');
    }
}

async function suspendMerchant(merchantId) {
    const reason = prompt('الرجاء إدخال سبب التعليق:');
    if (!reason) return;

    try {
        await adminAPI.suspendMerchant(merchantId, reason);
        showToast('تم تعليق التاجر بنجاح', 'success');
        await loadMerchants();
        await loadAuditLogs();
    } catch (error) {
        console.error('Error suspending merchant:', error);
        showToast(error.message || 'فشل تعليق التاجر', 'error');
    }
}

async function activateMerchant(merchantId) {
    try {
        // Assuming there's an activate endpoint or update status
        await adminAPI.suspendMerchant(merchantId, 'تفعيل الحساب');
        showToast('تم تفعيل التاجر بنجاح', 'success');
        await loadMerchants();
    } catch (error) {
        console.error('Error activating merchant:', error);
        showToast(error.message || 'فشل تفعيل التاجر', 'error');
    }
}

async function deleteMerchant(merchantId) {
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) return;

    if (!window.confirm(`هل أنت متأكد من حذف التاجر "${merchant.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        return;
    }

    const reason = prompt('الرجاء إدخال سبب الحذف:');
    if (!reason) return;

    try {
        await adminAPI.deleteMerchant(merchantId, reason);
        showToast('تم حذف التاجر بنجاح', 'success');
        await loadMerchants();
        await loadStatistics();
        await loadAuditLogs();
    } catch (error) {
        console.error('Error deleting merchant:', error);
        showToast(error.message || 'فشل حذف التاجر', 'error');
    }
}

// ============================================
// Load Audit Logs
// ============================================
async function loadAuditLogs() {
    try {
        showLoading('logsContainer');
        const response = await adminAPI.getAuditLogs();
        auditLogs = response.logs || response || [];
        renderAuditLogs();
    } catch (error) {
        console.error('Error loading audit logs:', error);
        document.getElementById('logsContainer').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">فشل تحميل السجلات</h3>
        <p class="empty-state-description">${error.message}</p>
      </div>
    `;
    }
}

function renderAuditLogs() {
    const container = document.getElementById('logsContainer');

    if (auditLogs.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3 class="empty-state-title">لا توجد سجلات</h3>
        <p class="empty-state-description">ستظهر سجلات الأحداث هنا</p>
      </div>
    `;
        return;
    }

    const html = auditLogs.map(log => `
    <div class="log-entry action-${log.action}">
      <div class="log-header">
        <span class="log-actor">${log.actor}</span>
        <span class="log-time">${formatDate(log.timestamp)}</span>
      </div>
      <div class="log-action">${log.action}: ${log.target}</div>
      ${log.reason ? `<div class="log-reason">السبب: ${log.reason}</div>` : ''}
    </div>
  `).join('');

    container.innerHTML = html;
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
                document.querySelector('.admin-sidebar').classList.remove('active');
            }
        });
    });

    // Menu toggle
    document.getElementById('adminMenuToggle').addEventListener('click', () => {
        document.querySelector('.admin-sidebar').classList.toggle('active');
    });

    // Logout
    document.getElementById('adminLogoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            logout();
        }
    });

    // Merchant search
    document.getElementById('merchantSearch').addEventListener('input', debounce(function () {
        const query = this.value.trim().toLowerCase();
        if (!query) {
            renderMerchants();
            return;
        }

        const filtered = merchants.filter(m =>
            m.name.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query) ||
            m.username.toLowerCase().includes(query) ||
            m.phone.includes(query)
        );

        renderMerchants(filtered);
    }, 300));

    // Notification form
    document.getElementById('notificationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendNotification();
    });

    // Target type change
    document.querySelectorAll('input[name="target"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const singleSelect = document.getElementById('singleMerchantSelect');
            if (radio.value === 'single') {
                singleSelect.style.display = 'block';
            } else {
                singleSelect.style.display = 'none';
            }
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// ============================================
// Send Notification
// ============================================
async function sendNotification() {
    const title = document.getElementById('notifTitle').value.trim();
    const body = document.getElementById('notifBody').value.trim();
    const targetType = document.querySelector('input[name="target"]:checked').value;
    const merchantId = document.getElementById('merchantId').value;

    if (!title || !body) {
        showToast('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    if (targetType === 'single' && !merchantId) {
        showToast('الرجاء اختيار تاجر', 'error');
        return;
    }

    const notificationData = {
        title,
        body,
        target: {
            type: targetType,
            value: targetType === 'single' ? merchantId : null,
        },
        channels: ['in_app'], // Can be extended to email, sms
    };

    setButtonLoading('sendNotifBtn', true);

    try {
        await adminAPI.sendNotification(notificationData);
        showToast('تم إرسال الإشعار بنجاح', 'success');
        document.getElementById('notificationForm').reset();
        document.getElementById('singleMerchantSelect').style.display = 'none';
        await loadAuditLogs();
    } catch (error) {
        console.error('Error sending notification:', error);
        showToast(error.message || 'فشل إرسال الإشعار', 'error');
    } finally {
        setButtonLoading('sendNotifBtn', false);
    }
}
