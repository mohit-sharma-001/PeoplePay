import React, { useEffect, useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { payrollApi } from '../../services/api/payroll';
import { SalaryStructure } from '../../types/payroll';

export const StructuresListPage: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await payrollApi.getStructures();
      setStructures(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Structures"
        subtitle="Define salary computation profiles and associate rule sequences."
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Salary Structures' },
        ]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            New Structure
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {structures.map((struct) => (
          <Card key={struct.id} hoverable>
            <CardHeader>
              <div>
                <CardTitle>{struct.name}</CardTitle>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{struct.code}</p>
              </div>
              <Badge variant="purple">{struct.type}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="font-semibold text-slate-700">Included Rules ({struct.rules?.length || 0}):</p>
              <div className="flex flex-wrap gap-1.5">
                {struct.rules?.map((r) => (
                  <Badge key={r.id} variant={r.category === 'Deduction' ? 'rose' : 'blue'}>
                    {r.code}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
