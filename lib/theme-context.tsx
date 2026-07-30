'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'custom'

type CustomColors = {
  bgPage: string
  bgCalendar: string
  borderColor: string
  textColor: string
}

type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  customColors: CustomColors
  setCustomColors: (colors: CustomColors) => void
}

const defaultCustomColors: CustomColors = {
  bgPage: '#f3f4f6',
  bgCalendar: '#fdf6ec',
  borderColor: '#4b5563',
  textColor: '#1f2937',
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')
  const [customColors, setCustomColorsState] = useState<CustomColors>(defaultCustomColors)

  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
    const savedColors = localStorage.getItem('theme-custom-colors')

    if (savedMode) {
      setModeState(savedMode)
    }
    if (savedColors) {
      setCustomColorsState(JSON.parse(savedColors))
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)

    if (mode === 'custom') {
      document.documentElement.style.setProperty('--background', customColors.bgPage)
      document.documentElement.style.setProperty('--bg-calendar', customColors.bgCalendar)
      document.documentElement.style.setProperty('--border-color', customColors.borderColor)
      document.documentElement.style.setProperty('--foreground', customColors.textColor)
      document.documentElement.style.setProperty('--hover-brightness', '0.92')
    } else {
      document.documentElement.style.removeProperty('--background')
      document.documentElement.style.removeProperty('--bg-calendar')
      document.documentElement.style.removeProperty('--border-color')
      document.documentElement.style.removeProperty('--foreground')
      document.documentElement.style.removeProperty('--hover-brightness')
    }
  }, [mode, customColors])

  function setMode(newMode: ThemeMode) {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)
  }

  function setCustomColors(colors: CustomColors) {
    setCustomColorsState(colors)
    localStorage.setItem('theme-custom-colors', JSON.stringify(colors))
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}