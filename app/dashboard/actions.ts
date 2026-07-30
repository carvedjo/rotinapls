'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRoutine(name: string, tagColor: string, folderId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado')
  }

  const { data, error } = await supabase
    .from('routines')
    .insert({
      name,
      tag_color: tagColor,
      user_id: user.id,
      folder_id: folderId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  return data
}

export async function deleteRoutine(routineId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('routines').delete().eq('id', routineId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
}

export async function updateRoutineFolder(routineId: string, folderId: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('routines')
    .update({ folder_id: folderId })
    .eq('id', routineId)

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

export async function createFolder(name: string, color: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado')
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({ name, color, user_id: user.id })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  return data
}

export async function deleteFolderKeepRoutines(folderId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('folders').delete().eq('id', folderId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
}

export async function deleteFolderWithRoutines(folderId: string) {
  const supabase = await createClient()

  const { error: routinesError } = await supabase
    .from('routines')
    .delete()
    .eq('folder_id', folderId)

  if (routinesError) {
    throw new Error(routinesError.message)
  }

  const { error: folderError } = await supabase.from('folders').delete().eq('id', folderId)

  if (folderError) {
    throw new Error(folderError.message)
  }

  revalidatePath('/dashboard')
}