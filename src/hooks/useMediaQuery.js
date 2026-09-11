import { useEffect, useState } from 'react'

export default function useMediaQuery(query) {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = (e) => setMatch(e.matches)
    setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])

  return match
}
