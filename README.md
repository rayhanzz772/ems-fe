# Employee Management System — Frontend

Frontend untuk Employee Management System (EMS), dibangun dengan Next.js, React, TypeScript, Tailwind CSS, shadcn/Base UI, Recharts, dan TanStack Query.

## Demo

**Live demo:** [ems.rayhancreative.web.id](https://ems.rayhancreative.web.id)

> Demo membutuhkan API backend yang aktif dan dapat diakses dari browser. Kredensial demo, jika tersedia, sebaiknya dibagikan melalui kanal terpisah dan tidak disimpan di repository.

## Fitur utama

- Authentication: login, logout, validasi session, dan redirect otomatis.
- Protected experience:
  - pengguna yang sudah login dan membuka `/login` diarahkan ke `/dashboard`;
  - halaman aplikasi memvalidasi user melalui endpoint `get-me`.
- Dashboard dengan ringkasan employee, chart department, status employee, dan aktivitas terbaru.
- Employee management:
  - list, search, filter, sort, pagination;
  - detail, create, update, soft-delete;
  - toggle status aktif/nonaktif;
  - export CSV.
- User management dengan role dinamis dari API.
- Department management dengan employee count dan status.
- Role management khusus administrator.
- Audit log dengan filter, sorting, detail, delete, dan export CSV.
- API Documentation/request tester berbasis OpenAPI.
- Loading state, skeleton, empty state, error state, toast notification, dan responsive mobile layout.
- TanStack Query untuk caching, refetch, dan invalidasi data setelah mutation.
- Dark mode dan komponen UI berbasis shadcn/Base UI.

## Tech stack

- [Next.js](https://nextjs.org/) `16.3.6`
- React `19`
- TypeScript `5`
- Tailwind CSS `4`
- shadcn/Base UI
- `@tanstack/react-query`
- Recharts
- Lucide React
- ESLint

## Prasyarat

Pastikan perangkat sudah memiliki:

- Node.js versi LTS yang kompatibel dengan Next.js 16.
- npm.
- Backend EMS yang berjalan dan dapat diakses.
- API URL serta URL OpenAPI dari backend.

## Setup lokal

### 1. Clone repository

```bash
git clone <repository-url>
cd ems-fe
```

### 2. Install dependency

```bash
npm install
```

### 3. Buat environment file

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/api-docs/openapi.json
```

Keterangan:

| Variable | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL API backend tanpa trailing slash |
| `NEXT_PUBLIC_API_DOCS_URL` | URL OpenAPI JSON untuk halaman API Documentation |

Jangan menyimpan secret, access token, atau credential production di `.env.local` yang di-commit ke repository.

### 4. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 5. Jalankan production build lokal

```bash
npm run build
npm run start
```

Production server dapat diakses melalui [http://localhost:3000](http://localhost:3000), kecuali port diubah oleh konfigurasi atau environment.

## Struktur route frontend

| Route | Keterangan | Akses |
| --- | --- | --- |
| `/` | Redirect/landing entry point | Public |
| `/login` | Login | Public |
| `/dashboard` | Ringkasan sistem dan chart | Login |
| `/employees` | Manajemen employee | Login |
| `/departments` | Manajemen department | Login |
| `/users` | Manajemen user | Login |
| `/roles` | Manajemen role | Admin |
| `/audit-logs` | Audit log | Login |
| `/api-documentation` | Mini API documentation/request tester | Login |

## Endpoint API

Semua path di bawah ini relatif terhadap:

```text
${NEXT_PUBLIC_API_URL}
```

Contoh: `/employees` menjadi `http://localhost:8000/api/v1/employees`.

### Authentication

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/auth/login` | Login dan menerima token |
| `GET` | `/auth/get-me` | Mengambil user yang sedang login |
| `POST` | `/auth/logout` | Logout dan menghapus token lokal |

Token disimpan di `localStorage` dengan key `access_token` dan dikirim sebagai Bearer token oleh API client.

### Dashboard

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/dashboard` | Mengambil summary, chart data, dan recent activity |

### Employees

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/employees` | List employee |
| `GET` | `/employees/:id/detail` | Detail employee |
| `POST` | `/employees/create` | Membuat employee; admin |
| `PUT` | `/employees/:id/update` | Memperbarui employee; admin |
| `DELETE` | `/employees/:id/delete` | Soft-delete employee; admin |
| `PATCH` | `/employees/:id/status` | Mengubah status employee; admin |
| `GET` | `/employees/export` | Export employee ke CSV |
| `GET` | `/employees/get-all-departments` | Mengambil pilihan department |

Parameter list yang digunakan frontend:

```text
page
per_page
q
status
department_id
position
hire_date_from
hire_date_to
sort_by
sort_order
```

Payload create/update employee umumnya berisi:

```json
{
  "first_name": "Alex",
  "last_name": "Morgan",
  "email": "alex@example.com",
  "phone_number": "+628123456789",
  "department_id": "department-id",
  "position": "Software Engineer",
  "hire_date": "2026-01-15",
  "address": "Jakarta",
  "status": true
}
```

`employee_code` dibuat oleh server dan tidak perlu dikirim oleh frontend.

### Users

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/users` | List user |
| `GET` | `/users/get-all-roles` | Mengambil daftar role untuk filter/form |
| `POST` | `/users/create` | Membuat user; admin |
| `PUT` | `/users/:id/update` | Memperbarui user; admin |
| `PATCH` | `/users/:id/status` | Mengubah status user; admin |
| `DELETE` | `/users/:id/delete` | Soft-delete user; admin |

### Departments

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/departments` | List department |
| `GET` | `/departments/:id/detail` | Detail department |
| `POST` | `/departments/create` | Membuat department; admin |
| `PUT` | `/departments/:id/update` | Memperbarui department; admin |
| `PATCH` | `/departments/:id/status` | Mengubah status department; admin |
| `DELETE` | `/departments/:id/delete` | Soft-delete department; admin |

### Roles

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/roles` | List role |
| `GET` | `/roles/:id/detail` | Detail role |
| `POST` | `/roles/create` | Membuat role; admin |
| `PUT` | `/roles/:id/update` | Memperbarui role; admin |
| `PATCH` | `/roles/:id/status` | Mengubah status role; admin |
| `DELETE` | `/roles/:id/delete` | Soft-delete role; admin |

Role `ADMIN` tidak dapat dinonaktifkan dari UI.

### Audit logs

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/audit-logs` | List audit log |
| `DELETE` | `/audit-logs/:id/delete` | Menghapus audit log |
| `GET` | `/audit-logs/export` | Export audit log ke CSV |

Parameter audit log yang digunakan:

```text
page
per_page
q
action
entity
user_id
date_from
date_to
sort_by
sort_order
```

## Format response pagination

Frontend membaca total data dari `metadata.total_row` bila tersedia. Bentuk response yang diharapkan:

```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "metadata": {
    "per_page": 10,
    "current_page": 1,
    "total_row": 42,
    "total_page": 5
  },
  "data": []
}
```

## Hak akses

Semua endpoint membutuhkan autentikasi. Secara umum:

| Role | Akses |
| --- | --- |
| `ADMIN` | Melihat data dan melakukan create, update, delete, status, export, serta mengelola roles |
| `HR` | Melihat data sesuai izin backend |
| `EMPLOYEE` | Melihat data sesuai izin backend |

Pembatasan di frontend hanya untuk UX. Otorisasi final tetap harus dilakukan oleh backend.

## Testing, lint, dan validasi

Saat ini `package.json` menyediakan script berikut:

```bash
npm run lint
npm run build
```

### Menjalankan lint

```bash
npm run lint
```

### Menjalankan type-check

Belum ada script khusus di `package.json`, sehingga gunakan:

```bash
npx tsc --noEmit
```

### Menjalankan production validation

```bash
npm run build
```

Perintah ini memvalidasi kompilasi Next.js, TypeScript, static generation, dan optimasi production.

### Unit/integration test

Repository ini belum memiliki test runner atau script `npm test`. Jika test runner ditambahkan kemudian, dokumentasi ini perlu diperbarui dengan command dan lokasi test yang sesuai.

## API Documentation

Halaman API Documentation menggunakan OpenAPI JSON dari:

```env
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/api-docs/openapi.json
```

Buka halaman berikut setelah aplikasi berjalan:

```text
http://localhost:3000/api-documentation
```

## Troubleshooting

### API request gagal atau muncul `NEXT_PUBLIC_API_URL is not configured`

Pastikan `.env.local` tersedia di root project dan restart development server setelah mengubah environment variable:

```bash
npm run dev
```

### Terlempar kembali ke `/login`

Periksa hal berikut:

- backend dapat diakses dari browser;
- token `access_token` masih valid;
- endpoint `/auth/get-me` mengembalikan HTTP 200;
- konfigurasi CORS backend mengizinkan origin frontend;
- cookie/session backend dikirim dengan konfigurasi yang benar.

### Data tidak tampil tetapi aplikasi berhasil build

Build hanya memvalidasi aplikasi frontend. Pastikan backend aktif, base URL benar, dan response API mengikuti format yang didokumentasikan.

## Catatan pengembangan

- Gunakan API helper terpusat di `lib/api.ts`.
- Gunakan TanStack Query untuk data server baru agar caching dan invalidasi konsisten.
- Pertahankan state form, dialog, dan filter sebagai state lokal bila tidak perlu dibagikan.
- Jangan menaruh credential atau token ke source code.
- Setelah mengubah fitur utama, jalankan minimal:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Lisensi

Lisensi proyek belum ditentukan. Tambahkan file `LICENSE` dan ubah bagian ini jika repository akan didistribusikan secara publik.