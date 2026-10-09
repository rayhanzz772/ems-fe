Updated todo list

Semua endpoint di bawah ini berada di bawah:

```js
router.use(authMiddleware);
```

Artinya request wajib memiliki token/cookie yang valid. Setelah itu, `requirePermission(...)` mengecek permission user.

## 1. Get Role Permissions

```js
router.get(
  "/:id/permissions",
  requirePermission("role.read"),
  Controller.getRolePermissions,
);
```

**Endpoint:**

```http
GET /api/v1/roles/:id/permissions
```

**Fungsi:** mengambil daftar permission yang dimiliki oleh sebuah role.

**Permission yang dibutuhkan:**

```text
role.read
```

**Contoh:**

```http
GET /api/v1/roles/role-123/permissions
```

**Response data:**

```json
[
  {
    "id": "permission-1",
    "key": "employee.read",
    "resource": "employee",
    "action": "read",
    "description": "View employees"
  }
]
```

Biasanya digunakan FE untuk menampilkan halaman detail role atau form edit permission.

---

## 2. Create Role

```js
router.post("/create", requirePermission("role.create"), Controller.createRole);
```

**Endpoint:**

```http
POST /api/v1/roles/create
```

**Fungsi:** membuat role baru.

**Permission yang dibutuhkan:**

```text
role.create
```

**Request body:**

```json
{
  "name": "MANAGER",
  "description": "Manager role",
  "status": true
}
```

**Catatan:** nama role harus unik.

---

## 3. Update Role

```js
router.put(
  "/:id/update",
  requirePermission("role.update"),
  Controller.updateRole,
);
```

**Endpoint:**

```http
PUT /api/v1/roles/:id/update
```

**Fungsi:** mengubah informasi role, seperti nama, deskripsi, atau status.

**Permission yang dibutuhkan:**

```text
role.update
```

**Request body:**

```json
{
  "description": "Updated manager role",
  "status": true
}
```

Semua field bersifat optional, tetapi minimal satu field harus dikirim.

---

## 4. Update Role Permissions

```js
router.put(
  "/:id/permissions",
  requirePermission("role.permission.assign"),
  Controller.updateRolePermissions,
);
```

**Endpoint:**

```http
PUT /api/v1/roles/:id/permissions
```

**Fungsi:** mengatur permission yang dimiliki oleh role.

**Permission yang dibutuhkan:**

```text
role.permission.assign
```

**Request body:**

```json
{
  "permission_ids": [
    "permission-employee-read",
    "permission-employee-create",
    "permission-employee-update"
  ]
}
```

Endpoint ini mengganti seluruh daftar permission role. Jika ingin menghapus semua permission:

```json
{
  "permission_ids": []
}
```

FE biasanya memakai endpoint ini pada halaman:

```text
Role Management -> Edit Role -> Permission Checklist
```

---

## 5. Delete Role

```js
router.delete(
  "/:id/delete",
  requirePermission("role.delete"),
  Controller.deleteRole,
);
```

**Endpoint:**

```http
DELETE /api/v1/roles/:id/delete
```

**Fungsi:** menghapus role.

**Permission yang dibutuhkan:**

```text
role.delete
```

Role tidak dapat dihapus jika masih digunakan oleh user.

Jika masih ada user dengan role tersebut, backend mengembalikan:

```http
409 Conflict
```

---

## 6. Toggle Role Status

```js
router.patch(
  "/:id/status",
  requirePermission("role.update"),
  Controller.toggleRoleStatus,
);
```

**Endpoint:**

```http
PATCH /api/v1/roles/:id/status
```

**Fungsi:** mengubah status role dari aktif menjadi nonaktif, atau sebaliknya.

**Permission yang dibutuhkan:**

```text
role.update
```

Endpoint ini tidak membutuhkan request body karena status dibalik secara otomatis.

Contoh:

```text
status: true  -> false
status: false -> true
```

Role yang nonaktif seharusnya tidak dapat digunakan untuk mengakses endpoint yang membutuhkan permission.

## Ringkasan

| Method   | Endpoint                 | Permission               | Fungsi                        |
| -------- | ------------------------ | ------------------------ | ----------------------------- |
| `GET`    | `/roles/:id/permissions` | `role.read`              | Melihat permission role       |
| `POST`   | `/roles/create`          | `role.create`            | Membuat role                  |
| `PUT`    | `/roles/:id/update`      | `role.update`            | Mengubah data role            |
| `PUT`    | `/roles/:id/permissions` | `role.permission.assign` | Mengatur permission role      |
| `DELETE` | `/roles/:id/delete`      | `role.delete`            | Menghapus role                |
| `PATCH`  | `/roles/:id/status`      | `role.update`            | Mengaktifkan/nonaktifkan role |
