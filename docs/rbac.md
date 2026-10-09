Updated todo list

# Frontend Integration Guide: RBAC

## 1. Base URL

```js
const API_URL = 'http://localhost:8000/api/v1'
```

Production:

```js
const API_URL = 'https://your-api-domain.com/api/v1'
```

## 2. Login

```http
POST /auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Contoh:

```js
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email,
    password
  })
})

const result = await response.json()
```

Backend akan membuat cookie `token` dengan konfigurasi HttpOnly.

FE wajib menggunakan:

```js
credentials: 'include'
```

Jangan menyimpan token ke `localStorage`.

## 3. Restore Session

Saat aplikasi pertama kali dibuka, panggil:

```http
GET /auth/get-me
```

Contoh:

```js
const response = await fetch(`${API_URL}/auth/get-me`, {
  credentials: 'include'
})

const result = await response.json()

if (result.success) {
  setCurrentUser(result.data)
}
```

Response:

```json
{
  "success": true,
  "message": "success",
  "metadata": {},
  "data": {
    "id": "user-id",
    "email": "admin@example.com",
    "status": true,
    "role": "ADMIN"
  }
}
```

## 4. Logout

```http
POST /auth/logout
```

```js
await fetch(`${API_URL}/auth/logout`, {
  method: 'POST',
  credentials: 'include'
})

clearCurrentUser()
redirectToLogin()
```

## 5. API Client

Buat satu API client agar semua request konsisten:

```js
async function apiClient(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  const result = await response.json()

  if (response.status === 401) {
    clearCurrentUser()
    redirectToLogin()
    throw new Error('Session expired')
  }

  if (response.status === 403) {
    throw new Error('You do not have permission')
  }

  if (!response.ok) {
    throw new Error(result.message || 'Request failed')
  }

  return result
}
```

Penggunaan:

```js
const employees = await apiClient('/employees')
```

## 6. Permission Keys

Permission yang tersedia:

```text
dashboard.read

user.read
user.create
user.update
user.delete

role.read
role.create
role.update
role.delete
role.permission.assign

department.read
department.create
department.update
department.delete

employee.read
employee.create
employee.update
employee.delete
employee.export

audit_log.read
audit_log.export
```

## 7. Permission Guard

Buat helper:

```js
function can(permission) {
  return currentUserPermissions.includes(permission)
}
```

Contoh tombol:

```jsx
{can('employee.create') && (
  <button onClick={openCreateEmployee}>
    Create Employee
  </button>
)}
```

Contoh menu:

```js
const menuItems = [
  {
    label: 'Employees',
    path: '/employees',
    permission: 'employee.read'
  },
  {
    label: 'Users',
    path: '/users',
    permission: 'user.read'
  }
]

const visibleMenus = menuItems.filter((item) => can(item.permission))
```

UI guard hanya untuk pengalaman pengguna. Keamanan utama tetap dilakukan oleh backend.

## 8. Role Permission Management

List role:

```http
GET /roles
```

Detail permission sebuah role:

```http
GET /roles/:id/permissions
```

Update permission sebuah role:

```http
PUT /roles/:id/permissions
Content-Type: application/json
```

Request:

```json
{
  "permission_ids": [
    "permission-id-1",
    "permission-id-2"
  ]
}
```

Update tersebut mengganti seluruh permission role. Jika ingin menghapus semua permission:

```json
{
  "permission_ids": []
}
```

## 9. Handling HTTP Status

| Status | Tindakan FE |
|---|---|
| `200` | Tampilkan data atau success state |
| `201` | Tampilkan create success |
| `400` | Tampilkan validation error |
| `401` | Hapus session dan arahkan ke login |
| `403` | Tampilkan access denied |
| `404` | Tampilkan data tidak ditemukan |
| `409` | Tampilkan conflict atau duplicate error |
| `500` | Tampilkan server error |

Contoh response error:

```json
{
  "success": false,
  "message": "Permission required: employee.delete",
  "metadata": {},
  "data": null
}
```

## 10. Kondisi Permission Saat Ini

Saat ini `GET /auth/get-me` baru mengembalikan `role`, belum daftar permission.

Sementara:

```js
const role = currentUser.role

const rolePermissions = {
  ADMIN: ['*'],
  HR: [
    'dashboard.read',
    'employee.read',
    'employee.create',
    'employee.update',
    'employee.export',
    'department.read',
    'user.read',
    'audit_log.read'
  ],
  EMPLOYEE: [
    'dashboard.read',
    'employee.read'
  ]
}

function can(permission) {
  const permissions = rolePermissions[role] || []

  return permissions.includes('*') || permissions.includes(permission)
}
```

Namun, solusi yang disarankan untuk backend berikutnya:

```http
GET /auth/permissions
```

Response ideal:

```json
{
  "success": true,
  "data": {
    "permissions": [
      "dashboard.read",
      "employee.read",
      "employee.create"
    ]
  }
}
```

## 11. Checklist FE

- [ ] Set API base URL untuk development dan production.
- [ ] Gunakan `credentials: 'include'`.
- [ ] Jangan menyimpan JWT di `localStorage`.
- [ ] Restore session melalui `/auth/get-me`.
- [ ] Buat API client terpusat.
- [ ] Tangani status `401` dan `403`.
- [ ] Buat helper `can(permission)`.
- [ ] Sembunyikan menu berdasarkan permission.
- [ ] Lindungi route halaman berdasarkan permission.
- [ ] Lindungi tombol create, edit, delete, dan export.
- [ ] Test menggunakan akun `ADMIN`, `HR`, dan `EMPLOYEE`.
- [ ] Siapkan fallback sampai endpoint `/auth/permissions` tersedia.