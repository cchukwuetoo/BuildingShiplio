import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    setIsMobile(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [breakpoint])

  return isMobile
}