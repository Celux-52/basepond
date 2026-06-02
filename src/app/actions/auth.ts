'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

export async function login(formData: FormData, locale: string = routing.defaultLocale) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/dashboard`)
}

export async function signup(formData: FormData, locale: string = routing.defaultLocale) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is required, session will be null
  if (!authData.session) {
    redirect(`/${locale}/login?message=check-email`)
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/dashboard`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect(`/login`)
}

export async function resetPassword(formData: FormData, locale: string = routing.defaultLocale) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
  }

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData, locale: string = routing.defaultLocale) {
  const supabase = await createClient()

  const data = {
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.updateUser({
    password: data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/dashboard`)
}

import { headers } from 'next/headers'

export async function signInWithProvider(provider: 'google' | 'github') {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.basepond.com'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }
  
  if (data.url) {
    redirect(data.url)
  }
}
