import { useCallback, useEffect, useState } from 'react'

export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch { return initial }
  })

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
  }, [key, value])

  const reset = useCallback(() => setValue(initial), [initial])
  return [value, setValue, reset]
}
