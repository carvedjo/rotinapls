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
        onClick={() => setMode('retro')}
        className={mode === 'retro' ? 'font-bold underline' : ''}
      >
        Retro
      </button>
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
        <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded border bg-[var(--background)] p-3 shadow-md">
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2">
            <label className="text-sm">Fundo</label>
            <input
              type="color"
              value={customColors.bgPage}
              onChange={(e) => setCustomColors({ ...customColors, bgPage: e.target.value })}
            />
            <label className="text-sm">Células</label>
            <input
              type="color"
              value={customColors.bgCalendar}
              onChange={(e) => setCustomColors({ ...customColors, bgCalendar: e.target.value })}
            />
            <label className="text-sm">Bordas</label>
            <input
              type="color"
              value={customColors.borderColor}
              onChange={(e) => setCustomColors({ ...customColors, borderColor: e.target.value })}
            />
            <label className="text-sm">Texto</label>
            <input
              type="color"
              value={customColors.textColor}
              onChange={(e) => setCustomColors({ ...customColors, textColor: e.target.value })}
            />
          </div>
          <button
            onClick={() => setShowCustomPanel(false)}
            className="mt-3 w-full rounded bg-black px-3 py-1 text-sm text-white"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  )
}