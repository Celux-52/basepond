import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { Zap, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-1 rounded-md border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-heading font-bold tracking-tight hidden sm:inline-block">SnapLead</span>
          </Link>

          <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
            <div className="text-sm text-muted-foreground hidden md:inline-block mr-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
              {user.email}
            </div>
            <LanguageSwitcher />
            <ThemeToggle />
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" title="Log out" className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden container mx-auto">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-border/40 bg-background/50 p-4 md:flex py-8">
          <nav className="space-y-2">
            <Link href="/dashboard" className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-2.5 rounded-md font-medium text-sm">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="#" className="flex items-center space-x-2 hover:bg-muted text-muted-foreground px-3 py-2.5 rounded-md font-medium text-sm transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
