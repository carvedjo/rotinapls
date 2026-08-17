'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  createRoutine,
  deleteRoutine,
  toggleCheckin,
  createFolder,
  deleteFolderKeepRoutines,
  deleteFolderWithRoutines,
  updateRoutineFolder,
  updateRoutineColor,
  updateFolderColor,
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

function getContrastText(hex: string | undefined) {
  if (!hex) return '#1f1b16'
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1f1b16' : '#ffffff'
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
  const [popoverInfo, setPopoverInfo] = useState<{
    x: number
    y: number
    text: string
    routineId: string
    date: string
  } | null>(null)
  const [dayPicker, setDayPicker] = useState<{ x: number; y: number; date: string } | null>(null)
  const [dayPickerExpandedFolder, setDayPickerExpandedFolder] = useState<string | null>(null)
  const [dayDetailOpen, setDayDetailOpen] = useState<string | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [addRoutinesOpen, setAddRoutinesOpen] = useState(false)
  const [addFoldersOpen, setAddFoldersOpen] = useState(false)
  const [addCreateOpen, setAddCreateOpen] = useState(false)
  const [addCreateChoice, setAddCreateChoice] = useState<'routine' | 'folder' | null>(null)
  const [addRoutineSettingsId, setAddRoutineSettingsId] = useState<string | null>(null)
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null)

  useEffect(() => {
    function checkSize() {
      setIsMobile(window.innerWidth < 768)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

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
    const wasExpanded = expandedFolders.has(folderId)

    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })

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

  function addCheckinForRoutine(routineId: string, date: string) {
    setCheckins((prev) => [...prev, { routine_id: routineId, date }])
    startTransition(() => toggleCheckin(routineId, date))
  }

  function removeCheckinForRoutine(routineId: string, date: string) {
    setCheckins((prev) => prev.filter((c) => !(c.routine_id === routineId && c.date === date)))
    startTransition(() => toggleCheckin(routineId, date))
    setPopoverInfo(null)
  }

  function handleDayClick(date: string | null, e: React.MouseEvent) {
    e.stopPropagation()
    if (!date) return

    if (activeRoutineId) {
      const routineId = activeRoutineId
      const alreadyChecked = getCheckinsForDay(date).some((c) => c.routine_id === routineId)

      if (alreadyChecked) {
        setCheckins((prev) => prev.filter((c) => !(c.routine_id === routineId && c.date === date)))
      } else {
        setCheckins((prev) => [...prev, { routine_id: routineId, date }])
      }

      startTransition(async () => {
        await toggleCheckin(routineId, date)
      })
      return
    }

    setPopoverInfo(null)
    setDayPickerExpandedFolder(null)
    setAddRoutinesOpen(false)
    setAddFoldersOpen(false)
    setAddCreateOpen(false)
    setAddCreateChoice(null)
    setAddSectionOpen(false)
    setAddRoutineSettingsId(null)

    if (isMobile) {
      setDayPicker(null)
      setDayDetailOpen(date)
    } else {
      setDayDetailOpen(null)
      setDayPicker({ x: e.clientX, y: e.clientY, date })
    }
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

  function handleUpdateRoutineColor(routineId: string, tagColor: string) {
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, tag_color: tagColor } : r))
    )
    startTransition(() => updateRoutineColor(routineId, tagColor))
  }

  function handleUpdateFolderColor(folderId: string, colorValue: string) {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, color: colorValue } : f)))
    startTransition(() => updateFolderColor(folderId, colorValue))
  }

  function confirmDeleteRoutine() {
  if (!routineToDelete) return
  handleDeleteRoutine(routineToDelete.id)
  setRoutineToDelete(null)
}

  function renderRoutineItem(routine: Routine) {
    const settingsOpen = openSettingsId === routine.id

    return (
      <div key={routine.id}>
        <div
          onClick={() => handleSelectRoutine(routine.id)}
          className={`flex cursor-pointer items-center gap-2 rounded bg-black/5 p-2 text-sm ${
            activeRoutineId === routine.id ? 'font-bold ring-1 ring-black/20' : 'hover:bg-black/10'
          }`}
        >
          <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: routine.tag_color }} />
          <span className="flex-1 truncate" title={routine.name}>{routine.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenSettingsId(settingsOpen ? null : routine.id)
            }}
            className="flex-shrink-0 text-xs"
          >
            ⚙️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setRoutineToDelete(routine)
            }}
            className="flex-shrink-0 text-xs text-red-400"
          >
            ×
          </button>
        </div>

        {settingsOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-1 flex items-center gap-2 rounded bg-black/5 p-2 text-xs"
          >
            <select
              value={routine.folder_id ?? ''}
              onChange={(e) => handleMoveRoutine(routine.id, e.target.value)}
              className="rounded border bg-[var(--background)] p-1"
            >
              <option value="">Sem pasta</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={routine.tag_color}
              onChange={(e) => handleUpdateRoutineColor(routine.id, e.target.value)}
              className="h-6 w-8 rounded border"
            />
          </div>
        )}
      </div>
    )
  }

  function renderAddSection(date: string, closeAfterAdd: boolean) {
    const notYetChecked = (r: Routine) => !getCheckinsForDay(date).some((c) => c.routine_id === r.id)
    const looseRoutines = routines.filter((r) => !r.folder_id && notYetChecked(r))

    return (
      <div className="space-y-1">
        <button
          onClick={() => setAddRoutinesOpen(!addRoutinesOpen)}
          className="flex w-full items-center gap-2 rounded p-1 text-left text-xs font-bold hover:bg-black/5"
        >
          <span>{addRoutinesOpen ? '▾' : '▸'}</span>
          <span>Rotinas</span>
        </button>
        {addRoutinesOpen && (
          <div className="ml-4 space-y-1">
            {looseRoutines.length === 0 && <p className="p-1 text-xs opacity-60">Nada por marcar aqui.</p>}
            {looseRoutines.map((r) => {
              const settingsOpen = addRoutineSettingsId === r.id
              return (
                <div key={r.id}>
                  <div className="flex items-center gap-2 rounded p-1 text-xs hover:bg-black/5">
                    <button
                      onClick={() => {
                        addCheckinForRoutine(r.id, date)
                        if (closeAfterAdd) setDayPicker(null)
                      }}
                      className="flex flex-1 items-center gap-2 truncate text-left"
                    >
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: r.tag_color }} />
                      <span className="truncate">{r.name}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddRoutineSettingsId(settingsOpen ? null : r.id)
                      }}
                      className="flex-shrink-0"
                    >
                      ⚙️
                    </button>
                  </div>

                  {settingsOpen && (
                    <div className="ml-6 mt-1 flex items-center gap-2 rounded bg-black/5 p-2 text-xs">
                      <span>Pasta:</span>
                      <select
                        value=""
                        onChange={(e) => {
                          handleMoveRoutine(r.id, e.target.value)
                          setAddRoutineSettingsId(null)
                        }}
                        className="rounded border bg-[var(--background)] p-1"
                      >
                        <option value="" disabled>
                          Escolher...
                        </option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setAddFoldersOpen(!addFoldersOpen)}
          className="flex w-full items-center gap-2 rounded p-1 text-left text-xs font-bold hover:bg-black/5"
        >
          <span>{addFoldersOpen ? '▾' : '▸'}</span>
          <span>Pastas</span>
        </button>
        {addFoldersOpen && (
          <div className="ml-4 space-y-1">
            {folders.length === 0 && <p className="p-1 text-xs opacity-60">Ainda não tens pastas.</p>}
            {folders.map((f) => {
              const folderRoutines = routines.filter((r) => r.folder_id === f.id && notYetChecked(r))
              const isOpen = dayPickerExpandedFolder === f.id

              return (
                <div key={f.id}>
                  <button
                    onClick={() => setDayPickerExpandedFolder(isOpen ? null : f.id)}
                    className="flex w-full items-center gap-2 rounded p-1 text-left text-xs hover:bg-black/5"
                  >
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="flex-shrink-0">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className="ml-4">
                      {folderRoutines.length === 0 && <p className="p-1 text-xs opacity-60">Nada por marcar aqui.</p>}
                      {folderRoutines.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            addCheckinForRoutine(r.id, date)
                            if (closeAfterAdd) setDayPicker(null)
                          }}
                          className="flex w-full items-center gap-2 rounded p-1 text-left text-xs hover:bg-black/5"
                        >
                          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: r.tag_color }} />
                          <span className="truncate">{r.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => {
            setAddCreateOpen(!addCreateOpen)
            setAddCreateChoice(null)
          }}
          className="flex w-full items-center gap-2 rounded p-1 text-left text-xs font-bold hover:bg-black/5"
        >
          <span>{addCreateOpen ? '▾' : '▸'}</span>
          <span>Criar novo</span>
        </button>
        {addCreateOpen && (
          <div className="ml-4 space-y-2">
            {!addCreateChoice && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const random = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
                    setColor(random)
                    setName('')
                    setSelectedFolderId('')
                    setAddCreateChoice('routine')
                  }}
                  className="flex-1 rounded border p-1 text-xs"
                >
                  Rotina
                </button>
                <button
                  onClick={() => {
                    setFolderColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)])
                    setFolderName('')
                    setAddCreateChoice('folder')
                  }}
                  className="flex-1 rounded border p-1 text-xs"
                >
                  Pasta
                </button>
              </div>
            )}

            {addCreateChoice === 'routine' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!name.trim()) return
                  handleAddRoutine(e)
                  setAddCreateChoice(null)
                  setAddCreateOpen(false)
                }}
                className="space-y-2"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da rotina"
                  className="w-full rounded border p-1 text-xs"
                  autoFocus
                />
                <div className="flex flex-wrap items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-5 w-5 rounded-full border-2 ${color === c ? 'border-black' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-5 w-7 rounded border"
                  />
                </div>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full rounded border p-1 text-xs"
                >
                  <option value="">Sem pasta</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddCreateChoice(null)}
                    className="flex-1 rounded border py-1 text-xs"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rounded bg-black py-1 text-xs text-white">
                    Criar
                  </button>
                </div>
              </form>
            )}

            {addCreateChoice === 'folder' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!folderName.trim()) return
                  handleAddFolder(e)
                  setAddCreateChoice(null)
                  setAddCreateOpen(false)
                }}
                className="space-y-2"
              >
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Nome da pasta"
                  className="w-full rounded border p-1 text-xs"
                  autoFocus
                />
                <div className="flex flex-wrap items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFolderColor(c)}
                      className={`h-5 w-5 rounded-full border-2 ${folderColor === c ? 'border-black' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="h-5 w-7 rounded border"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddCreateChoice(null)}
                    className="flex-1 rounded border py-1 text-xs"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rounded bg-black py-1 text-xs text-white">
                    Criar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    )
  }

  function renderCheckedInList(date: string) {
    const dayCheckins = getCheckinsForDay(date)

    if (dayCheckins.length === 0) {
      return <p className="text-xs opacity-60">Sem rotinas marcadas.</p>
    }

    return (
      <div className="space-y-2">
        {dayCheckins.map((c) => {
          const routine = getRoutine(c.routine_id)
          const folder = routine ? getFolder(routine.folder_id) : null
          if (!routine) return null

          const textColor = getContrastText(routine.tag_color)

          return (
            <div
              key={c.routine_id}
              className="flex h-9 items-center overflow-hidden rounded-lg"
              style={
                folder
                  ? { background: `linear-gradient(to right, ${folder.color} 50%, ${routine.tag_color} 50%)` }
                  : { backgroundColor: routine.tag_color }
              }
            >
              <span
                className="flex-1 truncate px-3 text-sm font-bold"
                style={{ color: textColor }}
              >
                {folder ? `${folder.name} > ${routine.name}` : routine.name}
              </span>
              <button
                onClick={() => removeCheckinForRoutine(routine.id, date)}
                className="flex-shrink-0 px-3 text-xs font-bold"
                style={{ color: textColor }}
              >
                Apagar
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      onClick={() => {
        setPopoverInfo(null)
        setDayPicker(null)
      }}
      className="min-h-screen"
    >
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
                  onClick={(e) => handleDayClick(date, e)}
                  className={`calendar-cell relative h-24 rounded border p-1 ${
                    date ? 'cursor-pointer' : ''
                  } ${activeRoutineId && date ? 'ring-1 ring-gray-300' : ''} ${
                    today ? 'today border-2' : ''
                  }`}
                  style={today ? { borderColor: 'var(--foreground)' } : undefined}
                >
                  {date && (
                    <>
                      <div className="text-xs">{dayNumber}</div>
                      <div className="absolute inset-x-1 bottom-1 top-5 flex flex-col gap-0.5 overflow-y-auto">
                        {dayCheckins.map((c) => {
                          const routine = getRoutine(c.routine_id)
                          const folder = routine ? getFolder(routine.folder_id) : null
                          const textColor = getContrastText(routine?.tag_color)

                          return (
                            <div
                              key={c.routine_id}
                              onClick={(e) => {
                                if (activeRoutineId) return
                                e.stopPropagation()
                                const text = routine
                                  ? folder
                                    ? `${folder.name} > ${routine.name}`
                                    : routine.name
                                  : ''
                                setDayPicker(null)
                                setDayDetailOpen(null)
                                setPopoverInfo({
                                  x: e.clientX,
                                  y: e.clientY,
                                  text,
                                  routineId: c.routine_id,
                                  date,
                                })
                              }}
                              className="flex h-3.5 flex-shrink-0 cursor-pointer items-center overflow-hidden rounded-sm md:h-[18px]"
                              style={
                                folder && routine
                                  ? { background: `linear-gradient(to right, ${folder.color} 50%, ${routine.tag_color} 50%)` }
                                  : { backgroundColor: routine?.tag_color }
                              }
                            >
                              <span
                                className="hidden truncate px-1 text-[10px] md:inline"
                                style={{ color: textColor }}
                              >
                                {routine?.name}
                              </span>
                            </div>
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

        {/* Menu lateral: rotinas + pastas */}
        <div className="order-1 w-full md:order-2 md:w-56">

          <button
            onClick={() => {
              const closing = showMobileRoutines
              setShowMobileRoutines(!showMobileRoutines)
              if (closing && activeRoutineId) {
                const routine = getRoutine(activeRoutineId)
                if (routine && !routine.folder_id) {
                  setActiveRoutineId(null)
                }
              }
            }}
            className="calendar-cell mb-2 flex w-full cursor-pointer items-center gap-2 !rounded-2xl px-5 py-3 text-sm font-bold md:hidden"
          >
            <span>{showMobileRoutines ? '▾' : '▸'}</span>
            <span>Rotinas</span>
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

          <button
            onClick={() => {
              const closing = showMobileFolders
              setShowMobileFolders(!showMobileFolders)
              if (closing && activeRoutineId) {
                const routine = getRoutine(activeRoutineId)
                if (routine && routine.folder_id) {
                  setActiveRoutineId(null)
                }
              }
            }}
            className="calendar-cell mb-2 flex w-full cursor-pointer items-center gap-2 !rounded-2xl px-5 py-3 text-sm font-bold md:hidden"
          >
            <span>{showMobileFolders ? '▾' : '▸'}</span>
            <span>Pastas</span>
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
                const folderSettingsOpen = openSettingsId === folder.id

                return (
                  <div key={folder.id} className="col-span-2 md:col-span-1">
                    <div
                      onClick={() => toggleFolderExpanded(folder.id)}
                      className="flex cursor-pointer items-center gap-2 rounded bg-black/5 p-2 text-sm font-bold hover:bg-black/10"
                    >
                      <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: folder.color }} />
                      <span className="flex-1 truncate" title={folder.name}>{folder.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenSettingsId(folderSettingsOpen ? null : folder.id)
                        }}
                        className="flex-shrink-0 text-xs"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFolderToDelete(folder)
                        }}
                        className="flex-shrink-0 text-xs text-red-400"
                      >
                        ×
                      </button>
                      <span className="flex-shrink-0 text-xs">{isExpanded ? '▾' : '▸'}</span>
                    </div>

                    {folderSettingsOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 flex items-center gap-2 rounded bg-black/5 p-2 text-xs"
                      >
                        <span>Cor:</span>
                        <input
                          type="color"
                          value={folder.color}
                          onChange={(e) => handleUpdateFolderColor(folder.id, e.target.value)}
                          className="h-6 w-8 rounded border"
                        />
                      </div>
                    )}

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
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 rounded bg-black px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: popoverInfo.x + 8, top: popoverInfo.y + 8 }}
        >
          <div>{popoverInfo.text}</div>
          {!activeRoutineId && (
            <button
              onClick={() => removeCheckinForRoutine(popoverInfo.routineId, popoverInfo.date)}
              className="mt-1 text-[10px] underline"
            >
              Apagar
            </button>
          )}
        </div>
      )}

      {dayPicker && !activeRoutineId && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 max-h-64 w-56 overflow-y-auto rounded border bg-[var(--background)] p-2 shadow-lg"
          style={{ left: dayPicker.x + 8, top: dayPicker.y + 8 }}
        >
          {renderAddSection(dayPicker.date, true)}
        </div>
      )}

      {dayDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="calendar-cell relative flex max-h-[80vh] w-full max-w-sm flex-col !rounded-2xl p-5"
          >
            <div className="mb-3 flex flex-shrink-0 items-center justify-between">
              <h3 className="text-sm font-bold">
                {dayDetailOpen.split('-')[2]} de {MESES[Number(dayDetailOpen.split('-')[1]) - 1]}
              </h3>
              <button onClick={() => setDayDetailOpen(null)} className="text-2xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto">
              <div className="mb-4">{renderCheckedInList(dayDetailOpen)}</div>

              <div className="border-t pt-3">
                <button
                  onClick={() => setAddSectionOpen(!addSectionOpen)}
                  className="flex w-full items-center gap-2 text-xs font-bold opacity-80"
                >
                  <span>{addSectionOpen ? '▾' : '▸'}</span>
                  <span>Adicionar</span>
                </button>

                {addSectionOpen && (
                  <div className="mt-2">{renderAddSection(dayDetailOpen, false)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded bg-[var(--background)] p-4 shadow-lg">
            <p className="mb-4 text-sm">
              Apagar a pasta <strong>{folderToDelete.name}</strong>.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDeleteFolder(true)}
                className="rounded border py-2 text-sm hover:bg-gray-100"
              >
                Manter rotinas
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
      {routineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded bg-[var(--background)] p-4 shadow-lg">
            <p className="mb-4 text-sm">
              Tens a certeza que queres apagar <strong>{routineToDelete.name}</strong> respetivas marcações no calendário?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmDeleteRoutine}
                className="rounded bg-red-500 py-2 text-sm text-white"
              >
                Apagar
              </button>
              <button
                onClick={() => setRoutineToDelete(null)}
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