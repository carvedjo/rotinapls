'use client'

import { useState, useTransition } from 'react'
import {
  createRoutine,
  deleteRoutine,
  toggleCheckin,
  createFolder,
  deleteFolderKeepRoutines,
  deleteFolderWithRoutines,
  updateRoutineFolder,
} from '@/app/dashboard/actions'
import ThemeSwitcher from '@/components/theme-switcher'

type Routine = {
  id: string
  name: string
  tag_color: string
  folder_id: string | null
}

type Folder = {
  id: string
  name: string
  color: string
}

type Checkin = {
  routine_id: string
  date: string
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b',
]

function formatDateLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isToday(date: string) {
  return date === formatDateLocal(new Date())
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
    days.push(formatDateLocal(date))
  }

  return days
}

export default function CalendarView({
  initialFolders,
  initialRoutines,
  initialCheckins,
}: {
  initialFolders: Folder[]
  initialRoutines: Routine[]
  initialCheckins: Checkin[]
}) {
  const [folders, setFolders] = useState(initialFolders)
  const [routines, setRoutines] = useState(initialRoutines)
  const [checkins, setCheckins] = useState(initialCheckins)
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderColor, setFolderColor] = useState(PRESET_COLORS[0])
  const [showMobileRoutines, setShowMobileRoutines] = useState(false)
  const [showMobileFolders, setShowMobileFolders] = useState(false)
  const [popoverInfo, setPopoverInfo] = useState<{ x: number; y: number; text: string } | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
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

  function getRoutine(routineId: string) {
    for (const routine of routines) {
      if (routine.id === routineId) return routine
    }
    return null
  }

  function getFolder(folderId: string | null) {
    if (!folderId) return null
    for (const folder of folders) {
      if (folder.id === folderId) return folder
    }
    return null
  }

  function changeMonth(delta: number) {
    setCurrentDate(new Date(year, month + delta, 1))
  }

  function toggleFolderExpanded(folderId: string) {
  setExpandedFolders((prev) => {
    const next = new Set(prev)
    const wasExpanded = next.has(folderId)

    if (wasExpanded) {
      next.delete(folderId)
    } else {
      next.add(folderId)
    }

    return next
  })

  const wasExpanded = expandedFolders.has(folderId)
  if (wasExpanded && activeRoutineId) {
    const routine = getRoutine(activeRoutineId)
    if (routine && routine.folder_id === folderId) {
      setActiveRoutineId(null)
    }
  }
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

  function handleToggleForm() {
    if (!showForm) {
      const random = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
      setColor(random)
    }
    setShowForm(!showForm)
  }

  function handleAddRoutine(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const tempId = crypto.randomUUID()
    const folderId = selectedFolderId || null
    const newRoutine = { id: tempId, name, tag_color: color, folder_id: folderId }

    setRoutines((prev) => [...prev, newRoutine])
    setName('')
    setShowForm(false)

    startTransition(async () => {
      try {
        const created = await createRoutine(name, color, folderId)
        setRoutines((prev) =>
          prev.map((r) =>
            r.id === tempId
              ? { id: created.id, name: created.name, tag_color: created.tag_color, folder_id: created.folder_id }
              : r
          )
        )
      } catch {
        setRoutines((prev) => prev.filter((r) => r.id !== tempId))
      }
    })
  }

  function handleAddFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!folderName.trim()) return

    const tempId = crypto.randomUUID()
    setFolders((prev) => [...prev, { id: tempId, name: folderName, color: folderColor }])
    setFolderName('')
    setShowFolderForm(false)

    startTransition(async () => {
      try {
        const created = await createFolder(folderName, folderColor)
        setFolders((prev) =>
          prev.map((f) => (f.id === tempId ? { id: created.id, name: created.name, color: created.color } : f))
        )
      } catch {
        setFolders((prev) => prev.filter((f) => f.id !== tempId))
      }
    })
  }

  function handleDeleteFolder(keepRoutines: boolean) {
    if (!folderToDelete) return
    const folderId = folderToDelete.id

    setFolders((prev) => prev.filter((f) => f.id !== folderId))

    if (keepRoutines) {
      setRoutines((prev) =>
        prev.map((r) => (r.folder_id === folderId ? { ...r, folder_id: null } : r))
      )
      startTransition(() => deleteFolderKeepRoutines(folderId))
    } else {
      setRoutines((prev) => prev.filter((r) => r.folder_id !== folderId))
      startTransition(() => deleteFolderWithRoutines(folderId))
    }

    setFolderToDelete(null)
  }

  function handleMoveRoutine(routineId: string, folderId: string) {
    const newFolderId = folderId === '' ? null : folderId

    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, folder_id: newFolderId } : r))
    )

    startTransition(() => updateRoutineFolder(routineId, newFolderId))
  }

  function handleDeleteRoutine(routineId: string) {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId))
    startTransition(() => deleteRoutine(routineId))
  }

  function renderRoutineItem(routine: Routine) {
    return (
      <div
        key={routine.id}
        onClick={() => handleSelectRoutine(routine.id)}
        className={`flex cursor-pointer items-center gap-2 rounded bg-black/5 p-2 text-sm ${
          activeRoutineId === routine.id ? 'font-bold ring-1 ring-black/20' : 'hover:bg-black/10'
        }`}
      >
        <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: routine.tag_color }} />
        <span className="truncate" title={routine.name}>{routine.name}</span>
        <select
          value={routine.folder_id ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleMoveRoutine(routine.id, e.target.value)}
          className="ml-auto flex-shrink-0 rounded border bg-[var(--background)] text-xs"
        >
          <option value="">Sem pasta</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteRoutine(routine.id)
          }}
          className="flex-shrink-0 text-xs text-red-400"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div onClick={() => setPopoverInfo(null)}>
      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        {/* Calendário */}
        <div className="order-2 flex-1 md:order-1">
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
              const today = date ? isToday(date) : false

              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(date)}
                  className={`calendar-cell relative h-20 rounded border p-1 ${
                    date ? 'cursor-pointer' : ''
                  } ${activeRoutineId && date ? 'ring-1 ring-gray-300' : ''} ${
                    today ? 'today border-2' : ''
                  }`}
                  style={today ? { borderColor: 'var(--foreground)' } : undefined}
                >
                  {date && (
                    <>
                      <div className="text-xs">{dayNumber}</div>
                      <div className="absolute left-1 top-1/2 flex max-h-[40px] flex-col flex-wrap -translate-y-1/2 gap-0.5 md:max-h-[52px] md:flex-row md:content-start md:gap-1">
                        {dayCheckins.map((c) => {
                          const routine = getRoutine(c.routine_id)
                          const folder = routine ? getFolder(routine.folder_id) : null

                          return (
                            <span
                              key={c.routine_id}
                              onClick={(e) => {
                                e.stopPropagation()
                                const text = routine
                                  ? folder
                                    ? `${folder.name} > ${routine.name}`
                                    : routine.name
                                  : ''
                                setPopoverInfo({ x: e.clientX, y: e.clientY, text })
                              }}
                              className="h-3 w-3 cursor-pointer rounded-full md:h-4 md:w-4"
                              style={
                                folder && routine
                                  ? {
                                      background: `conic-gradient(${folder.color} 0deg 180deg, ${routine.tag_color} 180deg 360deg)`,
                                    }
                                  : { backgroundColor: routine?.tag_color }
                              }
                            />
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
          <ThemeSwitcher />
        </div>

        {/* Menu lateral*/}
        <div className="order-1 w-full md:order-2 md:w-56">

          {/*Rotinas*/}
          <button
            onClick={() => setShowMobileRoutines(!showMobileRoutines)}
            className="mb-2 flex items-center gap-2 text-sm font-bold md:hidden"
          >
            ☰ Rotinas
          </button>

          <div className={`${showMobileRoutines ? 'block' : 'hidden'} md:block`}>
            <button onClick={handleToggleForm} className="mb-2 text-sm font-bold">
              + nova rotina
            </button>

            {showForm && (
              <form onSubmit={handleAddRoutine} className="mb-3 space-y-2 rounded border p-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da rotina"
                  className="w-full rounded border p-1 text-sm"
                />

                <div className="flex flex-wrap items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 ${
                        color === c ? 'border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-6 w-8 rounded border"
                  />
                </div>

                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full rounded border p-1 text-sm"
                >
                  <option value="">Sem pasta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded bg-black py-1 text-sm text-white disabled:opacity-50"
                >
                  Adicionar
                </button>
              </form>
            )}

            <div className="mb-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 md:max-h-none md:grid-cols-1">
              {routines.filter((r) => !r.folder_id).map(renderRoutineItem)}
            </div>
          </div>

          {/* Pastas */}
          <button
            onClick={() => setShowMobileFolders(!showMobileFolders)}
            className="mb-2 flex items-center gap-2 text-sm font-bold md:hidden"
          >
            ☰ Pastas
          </button>

          <div className={`${showMobileFolders ? 'block' : 'hidden'} md:block`}>
            <button onClick={() => setShowFolderForm(!showFolderForm)} className="mb-2 text-sm font-bold">
              + nova pasta
            </button>

            {showFolderForm && (
              <form onSubmit={handleAddFolder} className="mb-3 space-y-2 rounded border p-3">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Nome da pasta"
                  className="w-full rounded border p-1 text-sm"
                />
                <div className="flex flex-wrap items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFolderColor(c)}
                      className={`h-6 w-6 rounded-full border-2 ${
                        folderColor === c ? 'border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="h-6 w-8 rounded border"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded bg-black py-1 text-sm text-white disabled:opacity-50"
                >
                  Criar pasta
                </button>
              </form>
            )}

            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 md:max-h-none md:grid-cols-1">
              {folders.map((folder) => {
                const folderRoutines = routines.filter((r) => r.folder_id === folder.id)
                const isExpanded = expandedFolders.has(folder.id)

                return (
                  <div key={folder.id} className="col-span-2 md:col-span-1">
                    <div
                      onClick={() => toggleFolderExpanded(folder.id)}
                      className="flex cursor-pointer items-center gap-2 rounded bg-black/5 p-2 text-sm font-bold hover:bg-black/10"
                    >
                      <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: folder.color }} />
                      <span className="truncate" title={folder.name}>{folder.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFolderToDelete(folder)
                        }}
                        className="ml-auto flex-shrink-0 text-xs text-red-400"
                      >
                        ×
                      </button>
                      <span className="flex-shrink-0 text-xs">{isExpanded ? '▾' : '▸'}</span>
                    </div>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {folderRoutines.map(renderRoutineItem)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {activeRoutineId && (
            <p className="mt-4 text-xs opacity-60">
              Modo de seleção ativo. Clica num dia do calendário para marcar/desmarcar.
            </p>
          )}
        </div>
      </div>

      {popoverInfo && (
        <div
          className="fixed z-50 rounded bg-black px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: popoverInfo.x + 8, top: popoverInfo.y + 8 }}
        >
          {popoverInfo.text}
        </div>
      )}

      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded bg-[var(--background)] p-4 shadow-lg">
            <p className="mb-4 text-sm">
              Apagar a pasta <strong>{folderToDelete.name}</strong>. Manter rotinas ou apagar tudo?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDeleteFolder(true)}
                className="rounded border py-2 text-sm hover:bg-gray-100"
              >
                Manter rotinas sem pasta
              </button>
              <button
                onClick={() => handleDeleteFolder(false)}
                className="rounded bg-red-500 py-2 text-sm text-white"
              >
                Apagar tudo
              </button>
              <button
                onClick={() => setFolderToDelete(null)}
                className="rounded py-2 text-sm opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}