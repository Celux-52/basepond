'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, Lock, Bell, Palette, Shield, LogOut, 
  Save, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();

  const [profileForm, setProfileForm] = useState({ full_name: '', company_name: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleSaveProfile = async () => {
    if (!profileForm.full_name && !profileForm.company_name) {
      toast.error('En az bir alan doldurun');
      return;
    }
    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      const updates: any = {};
      if (profileForm.full_name) updates.full_name = profileForm.full_name;
      if (profileForm.company_name) updates.company_name = profileForm.company_name;

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      toast.success('✅ Profil güncellendi!');
    } catch (e: any) {
      toast.error('Hata: ' + e.message);
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPass) { toast.error('Yeni şifreyi girin'); return; }
    if (passwordForm.newPass.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error('Şifreler eşleşmiyor'); return; }

    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass });
      if (error) throw error;
      toast.success('✅ Şifre başarıyla güncellendi!');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (e: any) {
      toast.error('Hata: ' + e.message);
    }
    setSavingPass(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 bg-background min-h-screen">

      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Hesap tercihlerinizi yönetin</p>
      </div>

      {/* PROFILE SETTINGS */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Profil Bilgileri
          </CardTitle>
          <CardDescription>Ad, soyad ve şirket bilgilerinizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Ad Soyad</label>
            <Input
              placeholder="Adınızı girin"
              value={profileForm.full_name}
              onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
              className="bg-background border-input"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Şirket Adı</label>
            <Input
              placeholder="Şirket adınızı girin"
              value={profileForm.company_name}
              onChange={e => setProfileForm(p => ({ ...p, company_name: e.target.value }))}
              className="bg-background border-input"
            />
          </div>
          <Button 
            onClick={handleSaveProfile} 
            disabled={savingProfile}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* PASSWORD SETTINGS */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Şifre Değiştir
          </CardTitle>
          <CardDescription>Hesabınızın güvenliği için düzenli şifre değiştirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Yeni Şifre</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="En az 6 karakter"
                value={passwordForm.newPass}
                onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                className="bg-background border-input pr-10"
              />
              <button 
                type="button" 
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Şifreyi Tekrarla</label>
            <Input
              type="password"
              placeholder="Şifreyi tekrar girin"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              className="bg-background border-input"
            />
            {passwordForm.confirm && passwordForm.newPass !== passwordForm.confirm && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Şifreler eşleşmiyor
              </p>
            )}
            {passwordForm.confirm && passwordForm.newPass === passwordForm.confirm && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Şifreler eşleşiyor
              </p>
            )}
          </div>
          <Button 
            onClick={handleChangePassword} 
            disabled={savingPass}
            variant="outline"
            className="gap-2"
          >
            {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Şifreyi Güncelle
          </Button>
        </CardContent>
      </Card>

      {/* NOTIFICATIONS (Static for now) */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Bildirimler
          </CardTitle>
          <CardDescription>Hangi bildirimleri almak istediğinizi seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {[
            { label: 'Tarama tamamlandığında bildir', desc: 'İstihbarat taraması bitince e-posta gönder' },
            { label: 'Kredi azaldığında uyar', desc: '10 kredin altına düştüğünde bildirim al' },
            { label: 'Aylık özet raporu', desc: 'Her ayın başında kullanım özeti gönder' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shrink-0">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SESSION */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Oturum
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <Button 
            variant="outline" 
            className="gap-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Tüm Cihazlardan Çıkış Yap
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
