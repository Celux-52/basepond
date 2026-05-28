import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessDiscovery } from '@/components/dashboard/business-discovery';

export default async function DashboardPage({ params }: { params: Promise<{locale: string}> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'Dashboard'});
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentCredits = 0;
  if (user?.id) {
    const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
    currentCredits = profile?.credits || 0;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-muted-foreground mt-1">Discover high-potential business opportunities.</p>
        </div>
        <div className="flex items-center gap-4 bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
          <div className="text-sm font-medium">Internal Credits</div>
          <div className="text-xl font-bold text-primary">{currentCredits}</div>
        </div>
      </div>
      
      {/* Search and Results Section */}
      <BusinessDiscovery />

    </div>
  );
}
