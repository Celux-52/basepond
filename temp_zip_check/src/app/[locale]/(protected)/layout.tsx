import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { Zap, LogOut, Settings, LayoutDashboard, Search, Bookmark, User, FileDown } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/actions/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, full_name')
    .eq('id', user.id)
    .single();

  const navItems = [
    { href: '/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
    { href: '/dashboard/search', label: 'Yeni Arama', icon: Search },
    { href: '/dashboard/saved', label: 'Kaydedilenler', icon: Bookmark },
    { href: '/dashboard/profile', label: 'Profilim', icon: User },
    { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
    { href: '/pricing', label: 'Kredi Al', icon: FileDown },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-1 rounded-md border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold tracking-tight hidden sm:inline-block leading-none">Basepound</span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline-block leading-none mt-1">Basepound alt markasıdır</span>
            </div>
          </Link>

          <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mr-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
              <span className="text-amber-500 font-bold">⭐ {profile?.credits ?? 0}</span>
              <span className="text-border">|</span>
              <span>{user.email}</span>
            </div>
            <ThemeToggle />
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" title="Çıkış Yap" className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden container mx-auto">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-col border-r border-border/40 bg-background/50 p-4 md:flex py-8 shrink-0">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href as any}
                className="flex items-center space-x-2.5 text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2.5 rounded-lg font-medium text-sm transition-colors group"
              >
                <Icon className="h-4 w-4 shrink-0 group-hover:text-primary transition-colors" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-border/40">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground font-medium">
                {profile?.full_name || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{user.email}</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
