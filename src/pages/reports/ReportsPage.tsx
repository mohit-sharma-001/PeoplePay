import React from 'react';
import { BarChart3, Download, FileSpreadsheet, PieChart } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="HR & Payroll Reports"
        subtitle="Generate executive summary reports, payroll ledger exports, and headcount analytics."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <Button leftIcon={<Download className="w-4 h-4" />}>
            Export Full Ledger (CSV)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hoverable>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <CardTitle>Monthly Payroll Cost Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <p>Comprehensive breakdown of basic wages, allowances, overtime pay, and employer tax liabilities per department.</p>
            <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <PieChart className="w-5 h-5" />
              </div>
              <CardTitle>Time Off & Leave Liability</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <p>Unused paid annual leave balances, accrual valuations, and leave utilization trends across quarters.</p>
            <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
