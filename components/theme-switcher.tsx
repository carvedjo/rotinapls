'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'

export default function ThemeSwitcher() {
  const { mode, setMode, customColors, setCustomColors } = useTheme()
  const [showCustomPanel, setShowCustomPanel] = useState(false)

  function handleSelectCustom() {
    setMode('custom')
    setShowCustomPanel(true)
  }

  return (
    <div className="relative mb-4 flex items-center gap-4 text-sm">
      <button
        onClick={() => setMode('light')}
        className={mode === 'light' ? 'font-bold underline' : ''}
      >
        Claro
      </button>
      <button
        onClick={() => setMode('dark')}
        className={mode === 'dark' ? 'font-bold underline' : ''}
      >
        Escuro
      </button>
      <button
        onClick={handleSelectCustom}
        className={mode === 'custom' ? 'font-bold underline' : ''}
      >
        Personalizado
      </button>

      {mode === 'custom' && !showCustomPanel && (
        <button onClick={() => setShowCustomPanel(true)} className="text-xs underline">
          editar cores
        </button>
      )}

      {mode === 'custom' && showCustomPanel && (
        <div className="absolute left-0 top-full z-10 mt-2 flex items-center gap-3 rounded border bg-[var(--background)] p-2 shadow-md">
          <label className="flex items-center gap-1">
            Fundo
            <input
              type="color"
              value={customColors.bgPage}
              onChange={(e) => setCustomColors({ ...customColors, bgPage: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-1">
            Células
            <input
              type="color"
              value={customColors.bgCalendar}
              onChange={(e) => setCustomColors({ ...customColors, bgCalendar: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-1">
            Bordas
            <input
              type="color"
              value={customColors.borderColor}
              onChange={(e) => setCustomColors({ ...customColors, borderColor: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-1">
            Texto
            <input
              type="color"
              value={customColors.textColor}
              onChange={(e) => setCustomColors({ ...customColors, textColor: e.target.value })}
            />
          </label>
          <button
            onClick={() => setShowCustomPanel(false)}
            className="rounded bg-black px-3 py-1 text-white"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  )
}