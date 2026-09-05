import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, PieChart, Loader2, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { reportsApi, PayrollCostReportData, LeaveLiabilityReportData } from '../../services/api/reports';

export const ReportsPage: React.FC = () => {
  // Full Ledger CSV state
  const [isDownloadingLedger, setIsDownloadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  // Monthly Payroll Cost Report state
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [costData, setCostData] = useState<PayrollCostReportData | null>(null);
  const [isLoadingCost, setIsLoadingCost] = useState(false);
  const [isDownloadingCostCsv, setIsDownloadingCostCsv] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);

  // Time Off & Leave Liability Report state
  const [liabilityData, setLiabilityData] = useState<LeaveLiabilityReportData | null>(null);
  const [isLoadingLiability, setIsLoadingLiability] = useState(false);
  const [isDownloadingLiabilityCsv, setIsDownloadingLiabilityCsv] = useState(false);
  const [liabilityError, setLiabilityError] = useState<string | null>(null);

  const handleDownloadLedger = async () => {
    setIsDownloadingLedger(true);
    setLedgerError(null);
    try {
      await reportsApi.downloadFullLedgerCsv();
    } catch (err: any) {
      setLedgerError(err?.message || 'Failed to download Full Ledger CSV.');
    } finally {
      setIsDownloadingLedger(false);
    }
  };

  const handleGenerateCostReport = async () => {
    setIsLoadingCost(true);
    setCostError(null);
    try {
      const res = await reportsApi.getPayrollCost(selectedMonth);
      setCostData(res.data || null);
    } catch (err: any) {
      setCostError(err?.message || 'Failed to generate Payroll Cost Report.');
    } finally {
      setIsLoadingCost(false);
    }
  };

  const handleDownloadCostCsv = async () => {
    setIsDownloadingCostCsv(true);
    setCostError(null);
    try {
      await reportsApi.downloadPayrollCostCsv(selectedMonth);
    } catch (err: any) {
      setCostError(err?.message || 'Failed to download Payroll Cost CSV.');
    } finally {
      setIsDownloadingCostCsv(false);
    }
  };

  const handleGenerateLiabilityReport = async () => {
    setIsLoadingLiability(true);
    setLiabilityError(null);
    try {
      const res = await reportsApi.getLeaveLiability();
      setLiabilityData(res.data || null);
    } catch (err: any) {
      setLiabilityError(err?.message || 'Failed to generate Leave Liability Report.');
    } finally {
      setIsLoadingLiability(false);
    }
  };

  const handleDownloadLiabilityCsv = async () => {
    setIsDownloadingLiabilityCsv(true);
    setLiabilityError(null);
    try {
      await reportsApi.downloadLeaveLiabilityCsv();
    } catch (err: any) {
      setLiabilityError(err?.message || 'Failed to download Leave Liability CSV.');
    } finally {
      setIsDownloadingLiabilityCsv(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR & Payroll Reports"
        subtitle="Generate executive summary reports, payroll ledger exports, and headcount analytics."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <Button
            leftIcon={isDownloadingLedger ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            onClick={handleDownloadLedger}
            disabled={isDownloadingLedger}
          >
            {isDownloadingLedger ? 'Downloading...' : 'Export Full Ledger (CSV)'}
          </Button>
        }
      />

      {ledgerError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{ledgerError}</span>
        </div>
      )}

      {/* Top 2 Report Generator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Payroll Cost Report Card */}
        <Card hoverable className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <CardTitle>Monthly Payroll Cost Report</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>Comprehensive breakdown of basic wages, allowances, overtime pay, and deductions per department.</p>

              <div className="pt-2 flex items-center gap-3">
                <div className="w-44">
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    label="Select Month"
                  />
                </div>
              </div>
            </CardContent>
          </div>

          <CardContent className="pt-0">
            <div className="flex items-center gap-3 pt-2">
              <Button
                size="sm"
                variant="outline"
                leftIcon={isLoadingCost ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                onClick={handleGenerateCostReport}
                disabled={isLoadingCost}
              >
                {isLoadingCost ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={isDownloadingCostCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                onClick={handleDownloadCostCsv}
                disabled={isDownloadingCostCsv}
              >
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Time Off & Leave Liability Report Card */}
        <Card hoverable className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <PieChart className="w-5 h-5" />
                </div>
                <CardTitle>Time Off & Leave Liability</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>Unused paid annual leave balances, daily rate accrual valuations, and 3-month leave request utilization trends.</p>
            </CardContent>
          </div>

          <CardContent className="pt-0">
            <div className="flex items-center gap-3 pt-2">
              <Button
                size="sm"
                variant="outline"
                leftIcon={isLoadingLiability ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                onClick={handleGenerateLiabilityReport}
                disabled={isLoadingLiability}
              >
                {isLoadingLiability ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={isDownloadingLiabilityCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                onClick={handleDownloadLiabilityCsv}
                disabled={isDownloadingLiabilityCsv}
              >
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendered Monthly Payroll Cost Table */}
      {costError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{costError}</span>
        </div>
      )}

      {costData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Monthly Payroll Cost Breakdown ({costData.month})</CardTitle>
                <p className="text-xs text-slate-500">Period: {costData.date_from} to {costData.date_to}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleDownloadCostCsv}
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Headcount</th>
                    <th className="p-3 text-right">Basic (₹)</th>
                    <th className="p-3 text-right">Allowances (₹)</th>
                    <th className="p-3 text-right">Overtime (₹)</th>
                    <th className="p-3 text-right">Deductions (₹)</th>
                    <th className="p-3 text-right">Net Paid (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {costData.departments.length > 0 ? (
                    costData.departments.map((dept) => (
                      <tr key={dept.department} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold font-sans text-slate-900">{dept.department}</td>
                        <td className="p-3 text-center font-semibold text-slate-700">{dept.headcount}</td>
                        <td className="p-3 text-right">₹{dept.total_basic.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-700">₹{dept.total_allowances.toLocaleString()}</td>
                        <td className="p-3 text-right text-blue-700">₹{dept.total_overtime.toLocaleString()}</td>
                        <td className="p-3 text-right text-rose-700">₹{dept.total_deductions.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{dept.total_net.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-sans">
                        No computed payslips found for {costData.month}.
                      </td>
                    </tr>
                  )}
                </tbody>
                {costData.departments.length > 0 && (
                  <tfoot className="bg-slate-100 font-semibold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="p-3">Total / Summary</td>
                      <td className="p-3 text-center">{costData.summary.total_headcount}</td>
                      <td className="p-3 text-right font-mono">₹{costData.summary.total_basic.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-emerald-800">₹{costData.summary.total_allowances.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-blue-800">₹{costData.summary.total_overtime.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-rose-800">₹{costData.summary.total_deductions.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-purple-900">₹{costData.summary.total_net.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rendered Time Off & Leave Liability Table */}
      {liabilityError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{liabilityError}</span>
        </div>
      )}

      {liabilityData && (
        <Card className="space-y-4">
          <CardHeader className="flex-col !items-stretch gap-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div>
                <CardTitle className="text-base font-bold text-[var(--text-primary)]">
                  Time Off Balances & Leave Liability Valuation
                </CardTitle>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Approximation based on contract daily rate (wage / 30.0)
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-3.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold text-purple-900 dark:text-purple-300 shrink-0">
                  Total Liability: ₹{liabilityData.total_liability.toLocaleString()}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleDownloadLiabilityCsv}
                  className="shrink-0"
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Leave Utilization Trend Pills */}
            {liabilityData.utilization_trend && liabilityData.utilization_trend.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2 flex-wrap text-xs w-full">
                <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Leave Request Utilization Trend (Last 3 Months):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {liabilityData.utilization_trend.map((trend) => (
                    <Badge key={trend.month} variant="blue" className="font-mono text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {trend.month}: {trend.approved_requests} approved
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Employee Code</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3 text-center">Allocated</th>
                    <th className="p-3 text-center">Used</th>
                    <th className="p-3 text-center">Remaining Balance</th>
                    <th className="p-3 text-right">Daily Rate (₹)</th>
                    <th className="p-3 text-right">Liability Valuation (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {liabilityData.leave_balances.length > 0 ? (
                    liabilityData.leave_balances.map((lb, idx) => (
                      <tr key={`${lb.employee_code}-${lb.leave_type}-${idx}`} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{lb.employee_code}</td>
                        <td className="p-3 font-sans font-semibold text-slate-800">{lb.employee_name}</td>
                        <td className="p-3 font-sans text-slate-600">{lb.department}</td>
                        <td className="p-3 font-sans">
                          <Badge variant="purple">{lb.leave_type}</Badge>
                        </td>
                        <td className="p-3 text-center text-slate-600">{lb.allocated_amount}d</td>
                        <td className="p-3 text-center text-rose-600">{lb.used_amount}d</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{lb.remaining_amount}d</td>
                        <td className="p-3 text-right">₹{lb.daily_rate.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-purple-900">₹{lb.liability_valuation.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 font-sans">
                        No active leave allocations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
