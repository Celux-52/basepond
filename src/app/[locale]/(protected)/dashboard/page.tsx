import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { CreateLeadDialog } from '@/components/dashboard/create-lead-dialog';
import { ExportButton } from '@/components/dashboard/export-button';
import { getLeads } from '@/app/actions/leads';

export default async function DashboardPage({ params }: { params: Promise<{locale: string}> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'Dashboard'});
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { leads, error } = await getLeads();

  const stats = {
    totalLeads: leads?.length || 0,
    newLeads: leads?.filter(l => l.status === 'new').length || 0,
    contactedLeads: leads?.filter(l => l.status === 'contacted').length || 0,
    avgScore: leads?.length ? Math.round(leads.reduce((acc, curr) => acc + (curr.score || 0), 0) / leads.length) : 0
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, <span className="font-medium text-foreground">{user?.email}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton leads={leads || []} />
          <CreateLeadDialog />
        </div>
      </div>
      
      <DashboardStats stats={stats} />
      
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/20">
          <h2 className="text-lg font-semibold">Your Recent Leads</h2>
          <p className="text-sm text-muted-foreground">Manage and track your potential customers.</p>
        </div>
        <div className="p-6">
          <LeadsTable leads={leads || []} />
        </div>
      </div>
    </div>
  );
}
