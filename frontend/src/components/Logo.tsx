import { useState } from 'react'

interface LogoProps {
  size?: number
}

/**
 * Shiplio brand mark. Renders `public/shiplio-logo.png` when present,
 * falling back to the teal "S" tile so branding never looks broken.
 */
export default function Logo({ size = 36 }: LogoProps) {
  const [failed, setFailed] = useState(false)

  return (
    <span className="brand-logo" style={{ width: size, height: size }} aria-hidden={false}>
      {failed ? (
        <span className="brand-logo-fallback">S</span>
      ) : (
        <img src="/shiplio-logo.png" alt="Shiplio logo" onError={() => setFailed(true)} />
      )}
    </span>
  )
}
