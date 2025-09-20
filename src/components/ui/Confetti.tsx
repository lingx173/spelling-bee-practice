import { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    const newPieces: ConfettiPiece[] = []

    // Create 20 confetti pieces
    for (let i = 0; i < 20; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100, // 0-100% of screen width
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2000, // 0-2 second delay
      })
    }

    setPieces(newPieces)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 confetti"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
          }}
        />
      ))}
    </div>
  )
}
