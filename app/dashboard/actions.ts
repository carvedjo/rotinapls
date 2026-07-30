'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRoutine(name: string, tagColor: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado')
  }

  const { error } = await supabase.from('routines').insert({
    name,
    tag_color: tagColor,
    user_id: user.id,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
}

export async function deleteRoutine(routineId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('routines').delete().eq('id', routineId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
}

export async function toggleCheckin(routineId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado')
  }

  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('routine_id', routineId)
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    await supabase.from('checkins').delete().eq('id', existing.id)
  } else {
    await supabase.from('checkins').insert({
      routine_id: routineId,
      date,
      user_id: user.id,
    })
  }

  revalidatePath('/dashboard')
}