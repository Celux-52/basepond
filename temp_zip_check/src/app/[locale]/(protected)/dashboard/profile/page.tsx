import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2, Star, Calendar } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  const { count: savedCount } = await supabase
    .from('saved_businesses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  const { count: searchCount } = await supabase
    .from('crawl_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  const joinedDate = new Date(user!.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 bg-background min-h-screen">
      
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Profilim</h1>
        <p className="text-muted-foreground mt-1">Hesap bilgilerinizi görüntüleyin</p>
      </div>

      {/* PROFILE HERO */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="pt-0 pb-6 px-6 -mt-10 relative">
          <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground">
            {profile?.full_name || 'İsim girilmemiş'}
          </h2>
          <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
            <Mail className="w-4 h-4" /> {user!.email}
          </p>
          {profile?.company_name && (
            <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
              <Building2 className="w-4 h-4" /> {profile.company_name}
            </p>
          )}
          <p className="text-muted-foreground flex items-center gap-1.5 mt-1 text-sm">
            <Calendar className="w-3.5 h-3.5" /> {joinedDate} tarihinden beri üye
          </p>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border bg-card shadow-sm text-center p-6">
          <div className="text-4xl font-black text-primary mb-1">{profile?.credits || 0}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <Star className="w-3 h-3 text-amber-500" /> Mevcut Kredi
          </div>
        </Card>
        <Card className="border-border bg-card shadow-sm text-center p-6">
          <div className="text-4xl font-black text-card-foreground mb-1">{savedCount || 0}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Kaydedilen</div>
        </Card>
        <Card className="border-border bg-card shadow-sm text-center p-6">
          <div className="text-4xl font-black text-card-foreground mb-1">{searchCount || 0}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Tarama</div>
        </Card>
      </div>

      {/* ACCOUNT INFO */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold text-card-foreground">Hesap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">E-Posta</span>
            <span className="text-sm font-medium text-card-foreground">{user!.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Plan</span>
            <Badge className="bg-primary/10 text-primary border-primary/20">Premium</Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Kullanıcı ID</span>
            <span className="text-xs font-mono text-muted-foreground">{user!.id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Üyelik Başlangıcı</span>
            <span className="text-sm font-medium text-card-foreground">{joinedDate}</span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
