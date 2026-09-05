# PeoplePay 360 — Complete Enterprise HRMS & Payroll Prototype

**PeoplePay 360** is a full-stack, enterprise-grade Human Resource Management System (HRMS) and Payroll Processing platform built with **Django REST Framework** (Backend) and **React TypeScript + Vite + Tailwind CSS** (Frontend).

---

## Architecture & Technology Stack

### Backend (`peoplepay360_backend`)
- **Core Framework**: Django 5.x & Django REST Framework (DRF)
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **PDF Engine**: ReportLab (Pure Python PDF rendering, zero system-level dependencies)
- **Authentication**: Token-Based Authentication (`rest_framework.authtoken`) & Custom Role Permissions

### Frontend (`peoplepay_frontend`)
- **Core Framework**: React 18 + TypeScript + Vite
- **Styling**: Vanilla CSS tokens & Tailwind CSS (Dark/Light multi-theme adaptive design system)
- **Icons**: Lucide React
- **State & Routing**: React Router v6, custom Hooks (`useAuth`, `usePermissions`, `useTheme`)

---

## Core Feature Modules & Capabilities

### 1. Executive Dashboard (`/dashboard`)
- Real-time workforce metrics: Total Headcount, Active Rate %, Pending Leave Applications, and Current Payrun Net Total.
- Quick navigation shortcuts to core operational modules.

### 2. Employee Directory & Lifecycle (`/employees`)
- Dual display modes: Interactive **List View** and **Kanban Board** grouped by department.
- **Admin-Only Hard Delete**: Cascades profile data, active contracts, attendance, leave requests, payslips, and linked Django User accounts.
- **Admin-Only Termination Workflow**:
  - Automatically cancels active contracts (`state='cancelled'`, `date_end=today`).
  - Disables user portal access (`user.is_active=False`).
  - Auto-cancels pending leave requests (`status='submitted'`).
  - Excludes employee from future payroll wage calculations ($0 wage, `is_excluded=True`).
- **Reactivation Workflow**: Restores employee status, re-enables login account, and reactivates cancelled contracts (`state='running'`).

### 3. Contracts Management (`/contracts`)
- Period-based contract creation with wage rates, job titles, and department tracking.
- State machine support: `Draft`, `Running`, `Expired`, `Cancelled`.

### 4. Working Schedule Engine (`/schedules`)
- Full interactive CRUD on working schedules.
- Configurable shift rules: Fixed vs Flexible schedule types, weekly target hours, and custom day-shift breakdowns (start/end times, break durations).

### 5. Attendance Management (`/attendance`)
- Real-time check-in and check-out tracking per employee.
- Automatic worked hours computation and attendance correction request workflow.

### 6. Time Off & Leave Engine (`/time-off`)
- Working-day calculator incorporating weekends (Saturday/Sunday) and national holidays.
- Leave Types (Paid/Unpaid, Fixed/No-Limit allocations).
- Leave Request submission with automatic **Unpaid Leave spillover split** when balance is exceeded.

### 7. Payroll Processing & Engine (`/payroll`)
- **Structure & Rules Wizard**: Salary Structures containing sequence-ordered Salary Rules (Base, Percentage, Allowances, Deductions).
- **Attendance-Based Wage Proration**: Automatically scales base wage according to actual worked hours vs expected scheduled hours (`calculate_worked_percentage`).
- **Payslip Adjustments**: Add overtime or festival incentive additions/deductions prior to payrun validation.
- **ReportLab PDF Payslip Export**: Generate branded, downloadable PDF payslips with exact breakdown details.

### 8. Reports & Analytics (`/reports`)
- **Monthly Payroll Cost Report**: Departmental headcount and financial breakdown with CSV export.
- **Leave Liability Valuation Report**: Real-time monetary valuation of unutilized employee leave balances with trend analytics and CSV export.
- **Full Ledger Export**: Single-click downloadable full payroll ledger in CSV format.

---

## Role-Based Access Control (RBAC)

The system enforces a strict linear role hierarchy:

| Role | HR Access (Employees, Contracts, Schedules, Attendance, Time Off) | Payroll Access (Structures, Rules, Payruns, Payslips, Reports) |
| :--- | :--- | :--- |
| **Employee** | Self-service profile, attendance check-in, and leave submission | View own PDF payslips |
| **HR Manager** | **Full CRUD** (Create, edit, approve leave/attendance corrections) | **No Access** (0 visibility) |
| **HR Payroll User** | **Full CRUD** (Create/edit employees, contracts, schedules, attendance, approve leave) | **Operational Access** (View structures, compute draft payruns, add adjustments, view reports) |
| **HR Payroll Manager** | **Full CRUD** (Inherits HR Manager capabilities) | **Full Management** (Create/edit structures & rules, validate/mark-paid payruns) |
| **Admin** | **Full Access** + Exclusive **Hard Delete** & **Employee Termination/Reactivation** | **Full Management** + User Account & Role Management |

---

## Local Setup & Quick Start

### 1. Backend Setup (Django)

```bash
# Navigate to workspace root
cd /path/to/PeoplePay

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run migrations & seed data (optional)
python manage.py migrate

# Start Django Development Server
python manage.py runserver
```
The Django REST Framework backend runs at `http://127.0.0.1:8000/`.

### 2. Frontend Setup (React TypeScript)

```bash
# Navigate to frontend directory
cd /path/to/PeoplePay/peoplepay_frontend

# Install Node dependencies
npm install

# Start Vite Development Server
npm run dev
```
The React frontend application runs at `http://localhost:5173/`.

---

## Verification & Testing

### Run Backend Unit Tests
```bash
python manage.py test
```
*Executes 87 automated unit tests covering models, serializers, permissions, engine calculations, and API endpoints.*

### Run Frontend Production Build
```bash
cd peoplepay_frontend
npm run build
```
*Performs TypeScript type checking (`tsc -b`) and Vite production bundle compilation.*

---

## Standard API Response Envelope

All REST API endpoints return JSON formatted with a unified response structure:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {},
  "errors": null
}
```
