'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { LiquidMetalButton } from './liquid-metal-button'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('intellitrack-theme')
      return stored ? stored === 'dark' : true
    }
    return true
  })

  useEffect(() => {
    const workspace = document.getElementById('workspace-root')
    if (!workspace) return // only apply inside workspace; homepage is unaffected
    if (isDark) {
      workspace.classList.remove('light-mode')
      workspace.classList.add('dark-mode')
    } else {
      workspace.classList.remove('dark-mode')
      workspace.classList.add('light-mode')
    }
    localStorage.setItem('intellitrack-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <LiquidMetalButton
      viewMode="icon"
      icon={isDark ? <Sun size={16} /> : <Moon size={16} />}
      onClick={() => setIsDark(!isDark)}
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    />
  )
}
