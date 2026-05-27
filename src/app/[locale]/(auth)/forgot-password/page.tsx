'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { resetPassword } from '@/app/actions/auth';
import { Link } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const resetSchema = z.object({
    email: z.string().email({ message: t('invalidCredentials') }),
  });

  type ResetFormValues = z.infer<typeof resetSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('email', data.email);

    const result = await resetPassword(formData, locale);
    setIsLoading(false);
    
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(t('emailSent'));
      setIsSent(true);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl shadow-primary/5 border border-border/50 overflow-hidden mt-8">
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">{t('forgotPasswordTitle')}</h1>
          <p className="text-muted-foreground">{t('forgotPasswordSubtitle')}</p>
        </div>

        {isSent ? (
          <div className="text-center space-y-6">
            <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20">
              {t('emailSent')}
            </div>
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground w-full">
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={t('emailPlaceholder')} 
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('sendResetLink')}
            </Button>
          </form>
        )}
      </div>
      <div className="bg-muted/50 p-6 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
