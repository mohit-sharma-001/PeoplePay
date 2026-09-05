import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, User, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { contractsApi } from '../../services/api/contracts';
import { Contract } from '../../types/contract';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const ContractDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (id) {
        const res = await contractsApi.getById(id);
        setContract(res.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading contract record...</div>;
  }

  if (!contract) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Contract Not Found</h2>
        <Button onClick={() => navigate('/contracts')} className="mt-4">
          Back to Contracts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Contract: ${contract.reference}`}
        subtitle={`Assigned to ${contract.employeeName} (${contract.jobTitle})`}
        breadcrumbs={[
          { label: 'Contracts', href: '/contracts' },
          { label: contract.reference },
        ]}
        actions={
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/contracts')}>
            Back to List
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
            <StatusBadge status={contract.status} />
          </CardHeader>
          <CardContent className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block">Contract Reference</span>
                <span className="font-mono font-bold text-sm text-slate-900">{contract.reference}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contract Type</span>
                <span className="font-semibold text-slate-900">{contract.contractType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Start Date</span>
                <span className="font-semibold text-slate-900">{formatDate(contract.startDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">End Date</span>
                <span className="font-semibold text-slate-900">{contract.endDate ? formatDate(contract.endDate) : 'Indefinite'}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="font-semibold text-slate-900 text-sm">Compensation & Structure</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block">Monthly Base Wage</span>
                  <span className="font-bold text-base text-blue-600">{formatCurrency(contract.wage)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Salary Structure</span>
                  <span className="font-semibold text-purple-600">{contract.salaryStructureName}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Employee Name</span>
              <span className="font-bold text-slate-900">{contract.employeeName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department</span>
              <span className="font-semibold text-slate-800">{contract.department}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Schedule</span>
              <span className="font-semibold text-slate-800">{contract.workingScheduleName}</span>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => navigate(`/employees/${contract.employeeId}`)}>
              View Employee Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
