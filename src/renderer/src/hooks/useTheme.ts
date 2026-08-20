import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'pcma.theme'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return { theme, setTheme }
}
