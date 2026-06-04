import { getDashboardLeads, getUserWallet } from '@/app/actions/lead';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['melih20052005gs@gmail.com'];

export default async function DashboardPage({ params }: { params: Promise<{locale: string}> }) {
  const { locale } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  let initialLeads = [];
  try {
    initialLeads = await getDashboardLeads('PREMIUM');
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      const { redirect } = await import('next/navigation');
      redirect(`/${locale}/login`);
    }
    // Diğer hatalar için logla ama boş dizi ile devam et (500 patlamaması için)
    console.error("Dashboard error:", err);
  }
  const wallet = await getUserWallet();

  return (
    <div className="min-h-screen bg-neutral-50/50">
       <DashboardClient initialLeads={initialLeads} initialBalance={wallet.balance} isAdmin={isAdmin} />
    </div>
  );
}
