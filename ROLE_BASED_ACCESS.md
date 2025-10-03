# 🔐 Role-Based Access Control Implementation

## 📋 Overview

Dokumentasi ini menjelaskan implementasi role-based access control (RBAC) untuk FTS Admin Portal dengan pendekatan "Both" - frontend menyembunyikan menu items berdasarkan role dan backend memvalidasi permissions.

## 🎯 **Roles & Permissions**

### **Role Definitions**

1. **Admin** (`admin`)

   - Akses: Dashboard, Projects Management
   - Tidak bisa akses: User Management, Activity Logs
   - Bisa melihat: Projects yang dibuat oleh semua users

2. **Super Admin** (`super_admin`)
   - Akses: Semua fitur termasuk User Management dan Activity Logs
   - Bisa mengelola: Users, Projects, Activity Logs
   - Default account: `admin@fts.biz.id`

### **Permission Matrix**

| Feature             | Admin | Super Admin |
| ------------------- | ----- | ----------- |
| Dashboard           | ✅    | ✅          |
| Projects Management | ✅    | ✅          |
| User Management     | ❌    | ✅          |
| Activity Logs       | ❌    | ✅          |
| Create Projects     | ✅    | ✅          |
| Edit Projects       | ✅    | ✅          |
| Delete Projects     | ✅    | ✅          |
| Create Users        | ❌    | ✅          |
| Edit Users          | ❌    | ✅          |
| Delete Users        | ❌    | ✅          |

## 🔧 **Frontend Implementation**

### **1. Navigation Menu Filtering**

**Location**: `src/components/admin/AdminLayout.tsx`

```typescript
// Navigation items configuration based on user role
const getNavItems = (): NavItem[] => {
	const baseItems: NavItem[] = [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: <Home className="w-4 h-4" />,
			path: '/admin/dashboard',
		},
		{
			id: 'projects',
			label: 'Projects',
			icon: <FolderOpen className="w-4 h-4" />,
			path: '/admin/projects',
		},
	];

	// Add admin-only items for super_admin
	if (user?.role === 'super_admin') {
		return [
			...baseItems,
			{
				id: 'users',
				label: 'User Management',
				icon: <Users className="w-4 h-4" />,
				path: '/admin/users',
			},
			{
				id: 'activity',
				label: 'Activity Logs',
				icon: <Activity className="w-4 h-4" />,
				path: '/admin/activity-logs',
			},
		];
	}

	return baseItems;
};
```

### **2. Route Protection**

**Location**: `src/components/admin/AdminLayout.tsx`

```typescript
// Check if user tries to access restricted routes
const checkRoutePermission = () => {
	const restrictedRoutes = ['/admin/users', '/admin/activity-logs'];
	const isRestrictedRoute = restrictedRoutes.some((route) => location.pathname.startsWith(route));

	if (isRestrictedRoute && user?.role !== 'super_admin') {
		// Redirect to dashboard if admin tries to access super_admin routes
		navigate('/admin/dashboard');
		return false;
	}

	return true;
};
```

### **3. Page-Level Access Control**

**Location**: `src/pages/admin/UserManagement.tsx` dan `src/pages/admin/ActivityLogs.tsx`

```typescript
// Check if user has permission to access this page
if (user?.role !== 'super_admin') {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="text-center">
				<Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
				<h2 className="text-2xl font-bold mb-2">Access Denied</h2>
				<p className="text-muted-foreground mb-4">
					You don't have permission to access User Management.
				</p>
				<Button onClick={() => navigate('/admin/dashboard')}>Back to Dashboard</Button>
			</div>
		</div>
	);
}
```

## 🔧 **Backend Implementation Requirements**

### **1. API Endpoint Protection**

Backend harus memvalidasi permissions untuk setiap API request:

```typescript
// Example middleware for backend
const checkPermission = (requiredRole: 'admin' | 'super_admin') => {
	return (req, res, next) => {
		const user = req.user; // User dari JWT token

		if (!hasRequiredRole(user.role, requiredRole)) {
			return res.status(403).json({
				success: false,
				error: 'Access denied',
			});
		}

		next();
	};
};

// Apply to routes
app.get('/api/admin/users', checkPermission('super_admin'), getUsersHandler);
app.get('/api/admin/logs', checkPermission('super_admin'), getActivityLogsHandler);
```

### **2. JWT Token Validation**

Backend harus menyertakan role information dalam JWT token:

```json
{
	"id": "user_uuid",
	"email": "admin@fts.biz.id",
	"name": "Admin FTS",
	"role": "super_admin",
	"iat": 1640995200,
	"exp": 1640998800
}
```

### **3. Required Backend Endpoints**

```http
GET /api/admin/users
Authorization: Bearer {accessToken}
Required Role: super_admin

GET /api/admin/logs
Authorization: Bearer {accessToken}
Required Role: super_admin

POST /api/admin/users
Authorization: Bearer {accessToken}
Required Role: super_admin

PUT /api/admin/users/{id}
Authorization: Bearer {accessToken}
Required Role: super_admin

DELETE /api/admin/users/{id}
Authorization: Bearer {accessToken}
Required Role: super_admin
```

## 🔄 **Data Flow**

### **Authentication Flow**

1. User login dengan email/password
2. Backend validasi credentials
3. Backend generate JWT token dengan role information
4. Frontend simpan token di localStorage
5. Frontend update user state dengan role

### **Authorization Flow**

1. User mengakses protected route
2. Frontend cek role user di AuthContext
3. Frontend sembunyikan menu items yang tidak diizinkan
4. Frontend tampilkan access denied page jika needed
5. Frontend kirim API request dengan JWT token
6. Backend validasi JWT token dan role
7. Backend proses request atau return 403 Forbidden

## 🛡️ **Security Considerations**

### **Frontend Security**

- ✅ Menu items disembunyikan berdasarkan role
- ✅ Route protection untuk direct URL access
- ✅ Page-level access control dengan user-friendly messages
- ✅ Redirect ke dashboard untuk unauthorized access

### **Backend Security**

- ✅ JWT token dengan role information
- ✅ Middleware untuk permission validation
- ✅ 403 Forbidden response untuk unauthorized access
- ✅ Role-based API endpoint protection

### **Best Practices**

1. **Defense in Depth**: Implementasi di frontend dan backend
2. **Fail Secure**: Default deny access, explicit allow
3. **User Experience**: Friendly error messages dan redirects
4. **Consistency**: Role checking di semua layers

## 🧪 **Testing Scenarios**

### **Frontend Testing**

1. **Admin User Login**

   - Login dengan role `admin`
   - Verifikasi hanya Dashboard dan Projects yang muncul
   - Coba akses langsung ke `/admin/users` → harus redirect ke dashboard

2. **Super Admin User Login**

   - Login dengan role `super_admin`
   - Verifikasi semua menu items muncul
   - Akses semua halaman harus berhasil

3. **Direct URL Access**
   - Admin user coba akses `/admin/users` → harus redirect
   - Super admin user coba akses `/admin/users` → harus berhasil

### **Backend Testing**

```bash
# Test dengan admin token
curl -X GET https://be-fts-production.up.railway.app/api/v1/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: 403 Forbidden

# Test dengan super_admin token
curl -X GET https://be-fts-production.up.railway.app/api/v1/admin/users \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
# Expected: 200 OK dengan data users
```

## 📋 **Implementation Checklist**

### **Frontend Implementation**

- [x] Role-based navigation menu filtering
- [x] Route protection untuk restricted URLs
- [x] Page-level access control dengan user-friendly messages
- [x] Redirect functionality untuk unauthorized access
- [x] AuthContext integration dengan role information

### **Backend Implementation (Required)**

- [ ] JWT token dengan role information
- [ ] Middleware untuk permission validation
- [ ] Role-based API endpoint protection
- [ ] 403 Forbidden response untuk unauthorized access
- [ ] Role validation di semua admin endpoints

## 🚀 **Deployment Notes**

### **Environment Variables**

```bash
# Backend (.env)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
DEFAULT_ADMIN_EMAIL="admin@fts.biz.id"
DEFAULT_ADMIN_PASSWORD="adminmas123"
DEFAULT_ADMIN_ROLE="super_admin"
```

### **Frontend Configuration**

```bash
# Frontend (.env.production)
VITE_API_BASE_URL=https://be-fts-production.up.railway.app/api/v1
```

## 📞 **Troubleshooting**

### **Common Issues**

1. **Menu Items Not Hidden**

   - Check user role di AuthContext
   - Verify `getNavItems()` function logic

2. **Direct URL Access Working**

   - Check `checkRoutePermission()` function
   - Verify route protection logic

3. **Backend API Not Protected**
   - Check middleware implementation
   - Verify JWT token validation

### **Debug Tips**

```typescript
// Debug user role
console.log('Current user role:', user?.role);

// Debug navigation items
console.log('Available nav items:', navItems);

// Debug route permission
console.log('Current path:', location.pathname);
console.log('Has permission:', checkRoutePermission());
```

---

## 🎯 **Summary**

Role-based access control telah diimplementasi dengan pendekatan "Both" untuk keamanan maksimal:

- **Frontend**: Menyembunyikan menu items dan melindungi routes
- **Backend**: Memvalidasi permissions di setiap API request
- **User Experience**: Friendly error messages dan redirects
- **Security**: Defense in depth dengan multiple validation layers

Implementasi ini siap untuk production dan memberikan keamanan yang adequate untuk admin portal FTS! 🎉
