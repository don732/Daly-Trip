import { useEffect } from 'react'
import { STYLES } from '@/styles'

export function StyleInjector() {
  useEffect(() => {
    const id = 'dt-styles'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id
    el.textContent = STYLES
    document.head.appendChild(el)
  }, [])
  return null
}
