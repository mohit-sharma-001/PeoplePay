import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { timeOffApi } from '../../services/api/timeoff';
import { TimeOffType } from '../../types/timeoff';

export const TimeOffTypesPage: React.FC = () => {
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await timeOffApi.getTypes();
      setTypes(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Off Types"
        subtitle="Configure company leave categories, approval policies, and accrual modes."
        breadcrumbs={[
          { label: 'Time Off', href: '/time-off' },
          { label: 'Leave Types' },
        ]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            New Leave Type
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((type) => (
          <Card key={type.id} hoverable>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                <CardTitle>{type.name}</CardTitle>
              </div>
              <Badge variant="stone" size="sm">
                {type.code}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Requires Approval</span>
                <span className="font-semibold text-slate-900">{type.requiresApproval ? 'Yes (Manager & Admin)' : 'No (Auto)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Allocation Mode</span>
                <span className="font-semibold text-blue-600">{type.allocationMode}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
