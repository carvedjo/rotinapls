import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarView from '@/components/calendar-view'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: routines } = await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')

  return (
    <div className="p-8">
      <CalendarView
        initialFolders={folders ?? []}
        initialRoutines={routines ?? []}
        initialCheckins={checkins ?? []}
      />
    </div>
  )
}