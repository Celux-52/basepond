import { getDashboardLeads, getUserWallet } from '@/app/actions/lead';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['melih20052005gs@gmail.com'];

export default async function DashboardPage({ params }: { params: Promise<{locale: string}> }) {
  const { locale } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  const initialLeads = await getDashboardLeads('PREMIUM');
  const wallet = await getUserWallet();

  return (
    <div className="min-h-screen bg-neutral-50/50">
       <DashboardClient initialLeads={initialLeads} initialBalance={wallet.balance} isAdmin={isAdmin} />
    </div>
  );
}
