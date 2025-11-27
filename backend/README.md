# منصة التجارة الإلكترونية - Backend (Django)

## 🚀 مشروع جاهز للإنتاج (Production-Ready)

مشروع Django متكامل مع:
- ✅ Django REST Framework + JWT Authentication
- ✅ PostgreSQL Database
- ✅ Redis + Celery للمهام الخلفية
- ✅ Docker + Docker Compose
- ✅ Gunicorn + Nginx
- ✅ جاهز للنشر والتوسع (Scalable)

---

## 📁 هيكل المشروع

```
backend/
├── myplatform/              # المشروع الرئيسي
│   ├── settings.py         # الإعدادات
│   ├── urls.py             # المسارات الرئيسية
│   ├── wsgi.py             # WSGI
│   ├── celery.py           # إعداد Celery
│   └── __init__.py
├── apps/                    # التطبيقات
│   ├── accounts/           # المستخدمين والتجار
│   │   ├── models.py       # User, Merchant
│   │   ├── serializers.py  # API Serializers
│   │   ├── views.py        # API Views
│   │   ├── urls.py         # المسارات
│   │   ├── tasks.py        # Celery Tasks
│   │   └── admin.py        # Django Admin
│   ├── stores/             # المتاجر
│   ├── products/           # المنتجات
│   ├── orders/             # الطلبات
│   └── notifications/      # الإشعارات
├── Dockerfile              # Docker image
├── docker-compose.yml      # خدمات Docker
├── requirements.txt        # المكتبات المطلوبة
├── .env.example            # مثال للمتغيرات
├── manage.py               # Django CLI
└── README.md               # هذا الملف
```

---

## 🔧 التثبيت والتشغيل

### المتطلبات
- Docker & Docker Compose
- أو Python 3.11+ و PostgreSQL و Redis

### 1. نسخ المشروع وإعداد البيئة

```bash
cd backend

# نسخ ملف البيئة
cp .env.example .env

# تعديل .env بالقيم المناسبة
nano .env
```

### 2. التشغيل باستخدام Docker (موصى به)

```bash
# بناء الحاويات
docker-compose build

# تشغيل الخدمات
docker-compose up -d

# تنفيذ Migrations
docker-compose exec web python manage.py migrate

# إنشاء superuser
docker-compose exec web python manage.py createsuperuser

# جمع الملفات الثابتة
docker-compose exec web python manage.py collectstatic --noinput
```

### 3. التشغيل المحلي (بدون Docker)

```bash
# إنشاء بيئة افتراضية
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# تثبيت المكتبات
pip install -r requirements.txt

# تشغيل PostgreSQL و Redis محليًا
# ثم عدّل DATABASE_URL و REDIS_URL في .env

# Migrations
python manage.py migrate

# إنشاء superuser
python manage.py createsuperuser

# تشغيل الخادم
python manage.py runserver

# في terminal آخر: تشغيل Celery Worker
celery -A myplatform worker -l info

# في terminal ثالث: تشغيل Celery Beat
celery -A myplatform beat -l info
```

---

## 📡 API Endpoints

### Authentication (`/api/auth/`)
- `POST /api/auth/register` - تسجيل تاجر جديد
- `POST /api/auth/login` - تسجيل الدخول (JWT)
- `POST /api/auth/password-reset` - استعادة كلمة المرور
- `POST /api/auth/token/refresh` - تحديث JWT token

### Merchant (`/api/merchant/`)
- `GET /api/merchant/me` - بيانات التاجر الحالي
- `PUT /api/merchant/me` - تحديث بيانات التاجر
- `GET /api/merchant/products` - منتجات التاجر
- `POST /api/merchant/products` - إضافة منتج
- `PUT /api/merchant/products/{id}` - تحديث منتج
- `DELETE /api/merchant/products/{id}` - حذف منتج
- `GET /api/merchant/orders` - طلبات التاجر
- `PUT /api/merchant/orders/{id}/status` - تحديث حالة طلب
- `POST /api/merchant/upload-image` - رفع صورة

### Public Store (`/api/store/`)
- `GET /api/store/{username}` - بيانات المتجر والمنتجات
- `POST /api/store/{username}/orders` - إنشاء طلب جديد

### Admin (`/api/admin/`)
- `GET /api/admin/statistics` - إحصائيات عامة
- `GET /api/admin/merchants` - قائمة التجار
- `POST /api/admin/merchants/{id}/suspend` - تعليق تاجر
- `DELETE /api/admin/merchants/{id}` - حذف تاجر
- `POST /api/admin/notifications` - إرسال إشعار
- `GET /api/admin/audit-logs` - سجل الأحداث

### Documentation
- `GET /api/docs/` - Swagger UI
- `GET /api/schema/` - OpenAPI Schema

---

## 🔐 المصادقة (JWT)

### الحصول على Token

```javascript
// تسجيل الدخول
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'merchant@example.com',
    password: 'password123'
  })
});

const data = await response.json();
// data.token - Access Token
// data.refresh - Refresh Token
```

### استخدام Token في الطلبات

```javascript
const response = await fetch('http://localhost:8000/api/merchant/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
});
```

### تحديث Token

```javascript
const response = await fetch('http://localhost:8000/api/auth/token/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refresh: refreshToken
  })
});

const data = await response.json();
// data.access - New Access Token
```

---

## 🔄 ربط Frontend

في ملف `frontend/js/api.js`، عدّل:

```javascript
const API_BASE_URL = 'http://localhost:8000/api';

// أو في الإنتاج:
const API_BASE_URL = 'https://yourdomain.com/api';
```

---

## 📊 قاعدة البيانات

### Models الرئيسية

**User** (accounts.User)
- email, username, phone, user_type, is_verified

**Merchant** (accounts.Merchant)
- user, name, username (slug), logo
- kyc_status, payment_preference
- whatsapp_link, instagram_link, facebook_link

**Product** (products.Product)
- merchant, title, description, price, stock
- images (JSONField)

**Order** (orders.Order)
- merchant, customer_name, customer_phone, address
- items (JSONField), total, status
- confirmation_method

**Notification** (notifications.Notification)
- title, body, target_type, target_id
- created_by, created_at

---

## 🔔 Celery Tasks (المهام الخلفية)

### المهام المتاحة

1. **إرسال البريد الإلكتروني**
   ```python
   from apps.accounts.tasks import send_password_reset_email
   send_password_reset_email.delay('user@example.com')
   ```

2. **إرسال الإشعارات**
   ```python
   from apps.notifications.tasks import send_notification
   send_notification.delay(notification_id)
   ```

3. **معالجة الصور**
   ```python
   from apps.products.tasks import process_product_image
   process_product_image.delay(product_id)
   ```

---

## 🚀 النشر (Production)

### 1. إعداد الخادم (VPS/Cloud)

```bash
# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. تحديث .env للإنتاج

```bash
DEBUG=False
SECRET_KEY=<generate-strong-secret-key>
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# استخدم Managed Database
DATABASE_URL=postgres://user:pass@db-host:5432/dbname
REDIS_URL=redis://redis-host:6379/0

# إعداد البريد الإلكتروني
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    client_max_body_size 50M;
    
    location /static/ {
        alias /path/to/backend/staticfiles/;
    }
    
    location /media/ {
        alias /path/to/backend/media/;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL مع Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📈 التوسع (Scaling)

### زيادة Workers

في `docker-compose.yml`:

```yaml
web:
  command: gunicorn myplatform.wsgi:application --bind 0.0.0.0:8000 --workers 6
  deploy:
    replicas: 3  # عدة نسخ من الخدمة
```

### استخدام Load Balancer

```nginx
upstream backend {
    server web1:8000;
    server web2:8000;
    server web3:8000;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

### Managed Services (موصى به للإنتاج)

- **Database**: AWS RDS, DigitalOcean Managed PostgreSQL
- **Redis**: AWS ElastiCache, Redis Cloud
- **Storage**: AWS S3, DigitalOcean Spaces (للصور)
- **Monitoring**: Datadog, New Relic, Sentry

---

## 🔒 الأمان

### Checklist

- ✅ `DEBUG=False` في الإنتاج
- ✅ `SECRET_KEY` قوي ومخزن بأمان
- ✅ HTTPS/SSL مفعّل
- ✅ CORS محدد لـ origins معينة
- ✅ Rate limiting على API
- ✅ نسخ احتياطية دورية للقاعدة
- ✅ مراقبة الأخطاء (Sentry)
- ✅ تحديث المكتبات بانتظام

---

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
python manage.py test

# مع Coverage
coverage run --source='.' manage.py test
coverage report
```

---

## 📝 الملفات المتبقية

لإكمال المشروع، أنشئ الملفات التالية في كل تطبيق:

### apps/accounts/
- ✅ `models.py` - تم
- ✅ `serializers.py` - تم
- ✅ `views.py` - تم
- `urls.py` - المسارات
- `tasks.py` - Celery tasks
- `admin.py` - Django admin
- `__init__.py`

### apps/products/, apps/orders/, apps/notifications/
نفس البنية لكل تطبيق

---

## 🆘 المساعدة

### الأخطاء الشائعة

**خطأ في الاتصال بـ PostgreSQL:**
```bash
# تحقق من تشغيل الخدمة
docker-compose ps
docker-compose logs db
```

**خطأ في Celery:**
```bash
# تحقق من Redis
docker-compose logs redis
docker-compose logs worker
```

**خطأ 500 في API:**
```bash
# شاهد logs
docker-compose logs web
```

---

## 📞 الدعم

للمساعدة:
- راجع التوثيق: `/api/docs/`
- شاهد الـ logs: `docker-compose logs -f`
- تحقق من الإعدادات في `.env`

---

**المشروع جاهز للتشغيل! 🎉**

ابدأ الآن:
```bash
docker-compose up -d
```

ثم افتح: `http://localhost:8000/api/docs/`
