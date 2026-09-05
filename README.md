# PeoplePay 360 Backend (Django REST Framework)

Enterprise HRMS & Payroll System REST API backend built with Django 5, Django REST Framework, and PostgreSQL.

## System Architecture & App Structure

- `peoplepay360_backend/`: Core project configuration (settings, root routing, WSGI/ASGI)
- `core/`: Shared utilities (`TimeStampedModel` abstract base class, unified `api_response` format helper)
- `employees/`: Employee lifecycle, profile details, emergency contacts, search/filter APIs
- `contracts/`: Period-based contracts, salary/wage details, contract renewal/termination
- `working_schedule/`: Weekly shifts, daily work hours, expected hours per employee
- `attendance/`: Daily check-in/out, worked hours calculation, correction request workflow
- `time_off/`: Leave policies (types), leave balance allocations, request submission & manager approvals
- `payroll/`: Salary structures, salary rules, payrun wizard processing, payslips
- `dashboard/`: Analytics metrics and reporting breakdown endpoints

---

## Local Setup & Quick Start

### 1. Prerequisites
- Python 3.10+
- PostgreSQL database server

### 2. Virtual Environment Setup
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Copy `.env.example` to `.env` and fill in your PostgreSQL credentials:
```bash
cp .env.example .env
```

Ensure your PostgreSQL server is running and a database named `peoplepay360_db` is created:
```sql
CREATE DATABASE peoplepay360_db;
```

### 5. Database Migrations
Run initial Django migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Run Development Server
```bash
python manage.py runserver
```

The API server will run at `http://127.0.0.1:8000/`.

---

---

## Authentication & User Role Management API Endpoints

### 1. Public Self-Registration
* **URL:** `POST /api/auth/register/`
* **Access:** Public (`permission_classes = [AllowAny]`)
* **Description:** Registers a new User account and auto-creates a linked `Employee` profile. Assigns the user strictly to the `"Employee"` role group (ignoring any privilege escalation attempts). Automatically generates a DRF Auth Token.

#### Request Body
```json
{
  "username": "johndoe",
  "password": "Password123!",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+15550192834",
  "department": "Engineering",
  "job_position": "Software Engineer"
}
```

#### Success Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "token": "a1b2c3d4e5f67890123456789abcdef012345678",
    "user": {
      "id": 12,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_superuser": false,
      "roles": [
        "Employee"
      ],
      "employee_id": 8
    }
  },
  "errors": null
}
```

#### Validation Error Response (`HTTP 400 Bad Request`)
```json
{
  "success": false,
  "message": "Registration failed.",
  "data": null,
  "errors": {
    "username": "Username is already taken.",
    "email": "Email is already registered."
  }
}
```

---

### 2. User Authentication (Login & Logout)
* **Login URL:** `POST /api/auth/login/` (Public)
* **Logout URL:** `POST /api/auth/logout/` (Authenticated)

#### Login Request Body
```json
{
  "username": "admin",
  "password": "password123"
}
```

#### Login Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "9944b09199c62bcf9418ad846d0a400ed254425b",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@peoplepay360.com",
      "first_name": "System",
      "last_name": "Admin",
      "is_superuser": true,
      "roles": [
        "Admin"
      ],
      "employee_id": 1
    }
  },
  "errors": null
}
```

---

### 3. Admin List Users
* **URL:** `GET /api/auth/users/` (or with query filter `GET /api/auth/users/?role=Employee`)
* **Access:** Restricted to `"Admin"` role users.
* **Description:** Retrieves all user accounts in the system with their assigned roles and linked employee details.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Users retrieved successfully.",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@peoplepay360.com",
      "first_name": "System",
      "last_name": "Admin",
      "is_superuser": true,
      "roles": [
        "Admin"
      ],
      "employee_id": 1,
      "employee_name": "System Admin"
    },
    {
      "id": 12,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_superuser": false,
      "roles": [
        "Employee"
      ],
      "employee_id": 8,
      "employee_name": "John Doe"
    }
  ],
  "errors": null
}
```

---

### 4. Admin Role Assignment
* **URL:** `PATCH /api/auth/users/{user_id}/assign-role/`
* **Access:** Restricted to `"Admin"` role users.
* **Description:** Replaces a user's group roles entirely with the provided list of roles.

#### Request Body
```json
{
  "roles": [
    "HR Manager"
  ]
}
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "User roles updated successfully.",
  "data": {
    "id": 12,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": [
      "HR Manager"
    ],
    "employee_id": 8
  },
  "errors": null
}
```

#### Invalid Role Error Response (`HTTP 400 Bad Request`)
```json
{
  "success": false,
  "message": "Invalid role assignment.",
  "data": null,
  "errors": {
    "roles": "Invalid role(s): SuperUserRole. Valid roles are: Admin, HR Manager, HR Payroll Manager, HR Payroll User, Employee."
  }
}
```

---

## Base API Endpoints

- Health Check: `GET /api/`
- Employees: `GET /api/employees/`
- Contracts: `GET /api/contracts/`
- Working Schedule: `GET /api/working-schedule/`
- Attendance: `GET /api/attendance/`
- Time Off: `GET /api/time-off/`
- Payroll: `GET /api/payroll/`
- Dashboard: `GET /api/dashboard/`

---

## Standard API Response Format

All API endpoints return JSON formatted with the standard envelope structure:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {},
  "errors": null
}
```
