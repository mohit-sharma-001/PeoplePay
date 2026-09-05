import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EmployeesListPage } from '../pages/employees/EmployeesListPage';
import { EmployeeDetailsPage } from '../pages/employees/EmployeeDetailsPage';
import { SchedulesPage } from '../pages/employees/SchedulesPage';
import { ContractsListPage } from '../pages/contracts/ContractsListPage';
import { ContractDetailsPage } from '../pages/contracts/ContractDetailsPage';
import { AttendanceListPage } from '../pages/attendance/AttendanceListPage';
import { AttendanceDetailsPage } from '../pages/attendance/AttendanceDetailsPage';
import { TimeOffDashboardPage } from '../pages/timeoff/TimeOffDashboardPage';
import { TimeOffRequestsPage } from '../pages/timeoff/TimeOffRequestsPage';
import { TimeOffAllocationsPage } from '../pages/timeoff/TimeOffAllocationsPage';
import { TimeOffTypesPage } from '../pages/timeoff/TimeOffTypesPage';
import { PayrollDashboardPage } from '../pages/payroll/PayrollDashboardPage';
import { PayrunsListPage } from '../pages/payroll/PayrunsListPage';
import { PayrunDetailsPage } from '../pages/payroll/PayrunDetailsPage';
import { PayslipsListPage } from '../pages/payroll/PayslipsListPage';
import { PayslipDetailsPage } from '../pages/payroll/PayslipDetailsPage';
import { StructuresListPage } from '../pages/payroll/StructuresListPage';
import { RulesListPage } from '../pages/payroll/RulesListPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { ManageUsersPage } from '../pages/admin/ManageUsersPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Admin Management */}
        <Route path="admin/users" element={<ManageUsersPage />} />

        {/* Employees */}
        <Route path="employees" element={<EmployeesListPage />} />
        <Route path="employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="schedules/:id" element={<SchedulesPage />} />

        {/* Contracts */}
        <Route path="contracts" element={<ContractsListPage />} />
        <Route path="contracts/:id" element={<ContractDetailsPage />} />

        {/* Attendance */}
        <Route path="attendance" element={<AttendanceListPage />} />
        <Route path="attendance/:id" element={<AttendanceDetailsPage />} />

        {/* Time Off */}
        <Route path="time-off" element={<TimeOffDashboardPage />} />
        <Route path="time-off/requests" element={<TimeOffRequestsPage />} />
        <Route path="time-off/requests/:id" element={<TimeOffRequestsPage />} />
        <Route path="time-off/allocations" element={<TimeOffAllocationsPage />} />
        <Route path="time-off/types" element={<TimeOffTypesPage />} />

        {/* Payroll */}
        <Route path="payroll" element={<PayrollDashboardPage />} />
        <Route path="payroll/payruns" element={<PayrunsListPage />} />
        <Route path="payroll/payruns/new" element={<PayrunsListPage />} />
        <Route path="payroll/payruns/:id" element={<PayrunDetailsPage />} />
        <Route path="payroll/payslips" element={<PayslipsListPage />} />
        <Route path="payroll/payslips/:id" element={<PayslipDetailsPage />} />
        <Route path="payroll/structures" element={<StructuresListPage />} />
        <Route path="payroll/rules" element={<RulesListPage />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
