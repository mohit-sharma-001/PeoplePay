import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { employeesApi } from '../../services/api/employees';
import { WorkingSchedule } from '../../types/employee';

export const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await employeesApi.getSchedules();
      setSchedules(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Working Schedules"
        subtitle="Manage company working hours, shift patterns, and weekly schedules."
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: 'Working Schedules' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((sch) => (
          <Card key={sch.id} hoverable>
            <CardHeader>
              <div>
                <CardTitle>{sch.name}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{sch.timeZone}</p>
              </div>
              <Badge variant={sch.flexible ? 'purple' : 'blue'}>
                {sch.flexible ? 'Flexible' : 'Fixed'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Weekly Work Target
                </span>
                <span className="font-bold text-slate-900">{sch.hoursPerWeek} hrs/week</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Day Schedule Breakdown</p>
                {sch.days.map((day) => (
                  <div key={day.day} className="flex justify-between items-center py-1 text-slate-600 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-800">{day.day}</span>
                    <span className="font-mono text-slate-500">
                      {day.startTime} - {day.endTime} ({day.workHours}h)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
