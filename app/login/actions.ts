'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../lib/auth-server'
import { getServerSupabase } from '../lib/supabase-server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) redirect('/login?error=' + encodeURIComponent(error.message))

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) redirect('/signup?error=' + encodeURIComponent(error.message))

  const user = data.user
  if (user) {
    const admin = getServerSupabase()
    const { error: profileError } = await admin.from('profiles').insert({
      id: user.id,
      username: (formData.get('username') as string) || null,
      year: Number(formData.get('year')) || null,
      major: (formData.get('major') as string) || null,
      faculty: (formData.get('faculty') as string) || null,
    })
    if (profileError) {
      redirect('/signup?error=' + encodeURIComponent(profileError.message))
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}