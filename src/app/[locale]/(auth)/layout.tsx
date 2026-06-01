import { Link } from "@/i18n/routing";
import { Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20 relative">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] opacity-60 translate-x-1/3 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] opacity-60 -translate-x-1/3 translate-y-1/2 pointer-events-none" />
      
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20 shadow-sm shadow-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">SnapLead</span>
        </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        {children}
      </main>
    </div>
  );
}
