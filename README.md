# Employee Management System — Frontend

Frontend for the Employee Management System (EMS), built with Next.js, React, TypeScript, Tailwind CSS, shadcn/Base UI, Recharts, and TanStack Query.

## Demo

**Live demo:** [ems.rayhancreative.web.id](https://ems.rayhancreative.web.id)

> The demo requires an active backend API that is accessible from the browser. If demo credentials are available, share them through a separate channel and do not store them in the repository.

## Main features

- Authentication: login, logout, session validation, and automatic redirects.
- Protected experience:
  - authenticated users who open `/login` are redirected to `/dashboard`;
  - application pages validate the current user through the `get-me` endpoint.
- Dashboard with employee summaries, department charts, employee status, and recent activity.
- Employee management:
  - list, search, filter, sort, and pagination;
  - detail, create, update, and soft-delete;
  - active/inactive status toggle;
  - CSV export.
- User management with roles loaded dynamically from the API.
- Department management with employee counts and status controls.
- Role management for administrators.
- Audit logs with filtering, sorting, detail view, deletion, and CSV export.
- OpenAPI-based API documentation and request tester.
- Loading, skeleton, empty, error, toast, and responsive mobile states.
- TanStack Query for caching, refetching, and post-mutation cache invalidation.
- Dark mode and shadcn/Base UI components.

## Responsive design

<div style="display: flex; flex-wrap: wrap; gap: 6px;">
  <img src="./public/assets/images/prev1.png" width="32%" alt="Preview 1">
  <img src="./public/assets/images/prev2.png" width="32%" alt="Preview 2">
  <img src="./public/assets/images/prev3.png" width="32%" alt="Preview 3">
</div>

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

## Project structure

```bash
.
├── app
│   ├── (auth)
│   │   ├── login
│   │   └── logout
│   ├── (dashboard)
│   │   └── page
│   ├── (employees)
│   │   ├── page
│   │   └── [id]
│   ├── (departments)
│   │   └── page
│   ├── (users)
│   │   └── page
│   ├── (roles)
│   │   └── page
│   ├── (audit-logs)
│   │   └── page
│   └── (api-documentation)
│       └── page
├── components
├── lib
├── public
└── styles

```

## Prerequisites

Make sure the following are installed and available:

- An LTS version of Node.js compatible with Next.js 16.
- npm.
- A running and accessible EMS backend.
- The backend API URL and OpenAPI URL.

## Local setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd ems-fe
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/api-docs/openapi.json
```

| Variable                   | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`      | Backend API base URL without a trailing slash       |
| `NEXT_PUBLIC_API_DOCS_URL` | OpenAPI JSON URL used by the API Documentation page |

Do not commit secrets, access tokens, or production credentials to `.env.local`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run a local production build

```bash
npm run build
npm run start
```

The production server is available at [http://localhost:3000](http://localhost:3000), unless the port is changed by configuration or environment variables.

## Frontend routes

| Route                | Description                           | Access        |
| -------------------- | ------------------------------------- | ------------- |
| `/`                  | Redirect/landing entry point          | Public        |
| `/login`             | Login page                            | Public        |
| `/dashboard`         | System summary and charts             | Authenticated |
| `/employees`         | Employee management                   | Authenticated |
| `/departments`       | Department management                 | Authenticated |
| `/users`             | User management                       | Authenticated |
| `/roles`             | Role management                       | Admin         |
| `/audit-logs`        | Audit logs                            | Authenticated |
| `/api-documentation` | Mini API documentation/request tester | Authenticated |

## API endpoints

All paths below are relative to:

```text
${NEXT_PUBLIC_API_URL}
```

For example, `/employees` becomes `http://localhost:8000/api/v1/employees`.

### Authentication

| Method | Endpoint       | Description                          |
| ------ | -------------- | ------------------------------------ |
| `POST` | `/auth/login`  | Sign in and receive an access token  |
| `GET`  | `/auth/get-me` | Get the currently authenticated user |
| `POST` | `/auth/logout` | Sign out and remove the local token  |

The token is stored in `localStorage` under the `access_token` key and sent as a Bearer token by the API client.

### Dashboard

| Method | Endpoint     | Description                                       |
| ------ | ------------ | ------------------------------------------------- |
| `GET`  | `/dashboard` | Get summary data, chart data, and recent activity |

### Employees

| Method   | Endpoint                         | Description                         |
| -------- | -------------------------------- | ----------------------------------- |
| `GET`    | `/employees`                     | List employees                      |
| `GET`    | `/employees/:id/detail`          | Get employee details                |
| `POST`   | `/employees/create`              | Create an employee; admin only      |
| `PUT`    | `/employees/:id/update`          | Update an employee; admin only      |
| `DELETE` | `/employees/:id/delete`          | Soft-delete an employee; admin only |
| `PATCH`  | `/employees/:id/status`          | Update employee status; admin only  |
| `GET`    | `/employees/export`              | Export employees as CSV             |
| `GET`    | `/employees/get-all-departments` | Get department options              |

Employee list parameters used by the frontend:

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

Typical employee create/update payload:

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

The `employee_code` is generated by the server and does not need to be sent by the frontend.

### Users

| Method   | Endpoint               | Description                     |
| -------- | ---------------------- | ------------------------------- |
| `GET`    | `/users`               | List users                      |
| `GET`    | `/users/get-all-roles` | Get roles for filters and forms |
| `POST`   | `/users/create`        | Create a user; admin only       |
| `PUT`    | `/users/:id/update`    | Update a user; admin only       |
| `PATCH`  | `/users/:id/status`    | Update user status; admin only  |
| `DELETE` | `/users/:id/delete`    | Soft-delete a user; admin only  |

### Departments

| Method   | Endpoint                  | Description                          |
| -------- | ------------------------- | ------------------------------------ |
| `GET`    | `/departments`            | List departments                     |
| `GET`    | `/departments/:id/detail` | Get department details               |
| `POST`   | `/departments/create`     | Create a department; admin only      |
| `PUT`    | `/departments/:id/update` | Update a department; admin only      |
| `PATCH`  | `/departments/:id/status` | Update department status; admin only |
| `DELETE` | `/departments/:id/delete` | Soft-delete a department; admin only |

### Roles

| Method   | Endpoint            | Description                    |
| -------- | ------------------- | ------------------------------ |
| `GET`    | `/roles`            | List roles                     |
| `GET`    | `/roles/:id/detail` | Get role details               |
| `POST`   | `/roles/create`     | Create a role; admin only      |
| `PUT`    | `/roles/:id/update` | Update a role; admin only      |
| `PATCH`  | `/roles/:id/status` | Update role status; admin only |
| `DELETE` | `/roles/:id/delete` | Soft-delete a role; admin only |

The `ADMIN` role cannot be deactivated from the UI.

### Audit logs

| Method   | Endpoint                 | Description              |
| -------- | ------------------------ | ------------------------ |
| `GET`    | `/audit-logs`            | List audit logs          |
| `DELETE` | `/audit-logs/:id/delete` | Delete an audit log      |
| `GET`    | `/audit-logs/export`     | Export audit logs as CSV |

Audit log parameters used by the frontend:

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

## Pagination response format

The frontend reads the total record count from `metadata.total_row` when available. The expected response shape is:

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

## Access control

All API endpoints require authentication. In general:

| Role       | Access                                                                     |
| ---------- | -------------------------------------------------------------------------- |
| `ADMIN`    | View data, create, update, delete, change status, export, and manage roles |
| `HR`       | View data according to backend permissions                                 |
| `EMPLOYEE` | View data according to backend permissions                                 |

Frontend restrictions are intended for user experience only. Final authorization must always be enforced by the backend.

## Testing, linting, and validation

The current `package.json` provides these scripts:

```bash
npm run lint
npm run build
```

### Run lint

```bash
npm run lint
```

### Run the TypeScript check

There is currently no dedicated script in `package.json`, so run:

```bash
npx tsc --noEmit
```

### Run production validation

```bash
npm run build
```

This validates Next.js compilation, TypeScript, static generation, and production optimization.

### Unit/integration tests

This repository currently does not include a test runner or an `npm test` script. Update this documentation with the appropriate command and test locations if a test runner is added.

## API Documentation

The API Documentation page loads its OpenAPI JSON from:

```env
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/api-docs/openapi.json
```

After starting the application, open:

```text
http://localhost:3000/api-documentation
```

## Troubleshooting

### API requests fail or `NEXT_PUBLIC_API_URL is not configured` appears

Make sure `.env.local` exists in the project root and restart the development server after changing environment variables:

```bash
npm run dev
```

### The application redirects back to `/login`

Check the following:

- the backend is accessible from the browser;
- the `access_token` is still valid;
- `/auth/get-me` returns HTTP 200;
- the backend CORS configuration allows the frontend origin;
- backend cookies/session settings are configured correctly.

### Data does not appear even though the build succeeds

The build only validates the frontend. Make sure the backend is running, the base URL is correct, and API responses follow the documented format.

## Development notes

- Use the centralized API helper in `lib/api.ts`.
- Use TanStack Query for new server data so caching and invalidation remain consistent.
- Keep form, dialog, and filter state local unless it needs to be shared.
- Never put credentials or tokens in source code.
- After changing a major feature, run at least:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## License

No license has been specified for this project yet. Add a `LICENSE` file and update this section if the repository will be distributed publicly.
