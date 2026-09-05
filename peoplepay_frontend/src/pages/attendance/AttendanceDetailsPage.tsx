import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { attendanceApi } from '../../services/api/attendance';
import { Attendance } from '../../types/attendance';
import { formatDate } from '../../utils/formatters';

export const AttendanceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (id) {
        const res = await attendanceApi.getById(id);
        setRecord(res.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading attendance entry...</div>;

  if (!record) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Attendance Record Not Found</h2>
        <Button onClick={() => navigate('/attendance')} className="mt-4">
          Back to Attendance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Attendance: ${record.employeeName}`}
        subtitle={`Date: ${formatDate(record.date)}`}
        breadcrumbs={[
          { label: 'Attendance', href: '/attendance' },
          { label: record.employeeName },
        ]}
        actions={
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/attendance')}>
            Back to List
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Attendance Punch Details</CardTitle>
          <StatusBadge status={record.status} />
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block">Employee Name</span>
              <span className="font-bold text-sm text-slate-900">{record.employeeName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department</span>
              <span className="font-semibold text-slate-800">{record.department}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Check In Time</span>
              <span className="font-mono text-sm font-bold text-emerald-600">{record.checkIn}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Check Out Time</span>
              <span className="font-mono text-sm font-bold text-slate-700">{record.checkOut || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Worked Hours</span>
              <span className="font-bold text-sm text-slate-900">{record.workedHours} hrs</span>
            </div>
            <div>
              <span className="text-slate-500 block">Overtime Hours</span>
              <span className="font-bold text-sm text-purple-600">{record.overtimeHours} hrs</span>
            </div>
          </div>
          {record.notes && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-slate-500 block mb-1">Punch Exception Notes</span>
              <p className="p-3 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-200">{record.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
