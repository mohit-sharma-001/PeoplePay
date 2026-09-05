import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Clock, CheckCircle2, Layers } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { timeOffApi } from '../../services/api/timeoff';
import { TimeOffRequest, TimeOffAllocation, TimeOffType } from '../../types/timeoff';
import { formatDate } from '../../utils/formatters';

export const TimeOffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [reqRes, alcRes, typRes] = await Promise.all([
        timeOffApi.getRequests(),
        timeOffApi.getAllocations(),
        timeOffApi.getTypes(),
      ]);
      setRequests(reqRes.data);
      setAllocations(alcRes.data);
      setTypes(typRes.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'To Approve');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Off Dashboard"
        subtitle="Manage leave balances, request approvals, and time off categories."
        breadcrumbs={[{ label: 'Time Off' }]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/time-off/requests')}>
            New Request
          </Button>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable className="cursor-pointer" onClick={() => navigate('/time-off/requests?status=submitted')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{pendingRequests.length}</h2>
              <span className="text-xs text-amber-600 font-medium mt-0.5 inline-block">Requires HR review</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable className="cursor-pointer" onClick={() => navigate('/time-off/allocations')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Allocations</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{allocations.length}</h2>
              <span className="text-xs text-slate-500 mt-0.5 inline-block">Employee balances</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable className="cursor-pointer" onClick={() => navigate('/time-off/types')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Types</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{types.length}</h2>
              <span className="text-xs text-slate-500 mt-0.5 inline-block">Configured categories</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/time-off/requests')}>
            View All Requests
          </Button>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {requests.map((req) => (
            <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-slate-900">{req.employeeName}</p>
                <p className="text-xs text-slate-500">
                  {req.timeOffTypeName} • {req.durationDays} day(s) ({formatDate(req.startDate)} to {formatDate(req.endDate)})
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
