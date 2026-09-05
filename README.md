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
