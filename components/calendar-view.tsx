'use client'

import { useState, useTransition } from 'react'
import { createRoutine, deleteRoutine, toggleCheckin } from '@/app/dashboard/actions'
import ThemeSwitcher from '@/components/theme-switcher'

type Routine = {
  id: string
  name: string
  tag_color: string
}

type Checkin = {
  routine_id: string
  date: string
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatDateLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayWeekday = new Date(year, month, 1).getDay()

  const days: (string | null)[] = []

  for (let i = 0; i < firstDayWeekday; i++) {
    days.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push(formatDateLocal(date))  // 
  }

  return days
}

export default function CalendarView({
  initialRoutines,
  initialCheckins,
}: {
  initialRoutines: Routine[]
  initialCheckins: Checkin[]
}) {
  const [routines, setRoutines] = useState(initialRoutines)
  const [checkins, setCheckins] = useState(initialCheckins)
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8B5CF6')
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getCalendarDays(year, month)

  function getCheckinsForDay(date: string) {
    const result: Checkin[] = []
    for (const checkin of checkins) {
      if (checkin.date === date) {
        result.push(checkin)
      }
    }
    return result
  }

  function getRoutineColor(routineId: string) {
    for (const routine of routines) {
      if (routine.id === routineId) {
        return routine.tag_color
      }
    }
    return '#000000'
  }

  function changeMonth(delta: number) {
    setCurrentDate(new Date(year, month + delta, 1))
  }

  function handleSelectRoutine(routineId: string) {
    setActiveRoutineId(activeRoutineId === routineId ? null : routineId)
  }

  function handleDayClick(date: string | null) {
    if (!date || !activeRoutineId) return

    const routineId = activeRoutineId

    
    const alreadyChecked = getCheckinsForDay(date).some(
      (c) => c.routine_id === routineId
    )

    if (alreadyChecked) {
      setCheckins((prev) =>
        prev.filter((c) => !(c.routine_id === routineId && c.date === date))
      )
    } else {
      setCheckins((prev) => [...prev, { routine_id: routineId, date }])
    }

    startTransition(async () => {
      await toggleCheckin(routineId, date)
    })
  }

    function handleAddRoutine(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        const tempId = crypto.randomUUID()
        const newRoutine = { id: tempId, name, tag_color: color }

        
        setRoutines((prev) => [...prev, newRoutine])
        setName('')
        setShowForm(false)

        startTransition(async () => {
            await createRoutine(name, color)
        })
    }

  return (
    <div>
    
    <div className="flex gap-8">
      {/* Calendário */}
      <div className="flex-1">
        <div className="mb-4 flex items-center gap-4">
          <button onClick={() => changeMonth(-1)} className="text-xl">‹</button>
          <h2 className="text-lg font-bold">
            {MESES[month]} {year}
          </h2>
          <button onClick={() => changeMonth(1)} className="text-xl">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="text-center text-xs font-bold opacity-60">
              {d}
            </div>
          ))}

          {days.map((date, i) => {
            const dayCheckins = date ? getCheckinsForDay(date) : []
            const dayNumber = date ? date.split('-')[2] : ''

            return (
                <div
                    key={i}
                    onClick={() => handleDayClick(date)}
                    className={`calendar-cell relative h-20 rounded border p-1 ${
                        date ? 'cursor-pointer' : ''
                    } ${activeRoutineId && date ? 'ring-1 ring-gray-300' : ''}`}
                >
                {date && (
                    <>
                    <div className="text-xs">{dayNumber}</div>
                    <div className="absolute left-1 top-1/2 flex -translate-y-1/2 gap-1">
                        {dayCheckins.map((c) => (
                        <span
                            key={c.routine_id}
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: getRoutineColor(c.routine_id) }}
                        />
                        ))}
                    </div>
                    </>
                )}
                </div>
            )
          })}
        </div>
        <ThemeSwitcher />
      </div>

      {/* Menu de rotinas */}
      <div className="w-56">
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 text-sm font-bold"
        >
          + nova rotina
        </button>

        {showForm && (
          <form onSubmit={handleAddRoutine} className="mb-4 space-y-2 rounded border p-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da rotina"
              className="w-full rounded border p-1 text-sm"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-full rounded border"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded bg-black py-1 text-sm text-white disabled:opacity-50"
            >
              Adicionar
            </button>
          </form>
        )}
        
        <div className="space-y-2">
          {routines.map((routine) => (
            <div
              key={routine.id}
              onClick={() => handleSelectRoutine(routine.id)}
              className={`flex cursor-pointer items-center gap-2 rounded p-2 text-sm ${
                activeRoutineId === routine.id
                  ? 'bg-gray-50 font-bold'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: routine.tag_color }}
              />
              {routine.name}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startTransition(() => deleteRoutine(routine.id))
                }}
                className="ml-auto text-xs text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {activeRoutineId && (
          <p className="mt-4 text-xs opacity-60">
            Modo de seleção ativo. Clica num dia do calendário para marcar/desmarcar.
          </p>
        )}
      </div>
    </div>
    </div>
  )
}