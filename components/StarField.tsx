'use client'
import { useEffect, useRef } from 'react'

interface Star {
  x: number; y: number; size: number; color: string
  opacity: number; targetOpacity: number; speed: number
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    let mouseX = 0, mouseY = 0

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#00F5FF', '#00F5FF', '#6C63FF']
    const stars: Star[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() < 0.7 ? 2 : 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random(),
      targetOpacity: Math.random(),
      speed: 2000 + Math.random() * 3000,
    }))

    let last = 0
    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const dt = ts - last; last = ts

      stars.forEach(s => {
        s.opacity += (s.targetOpacity - s.opacity) * (dt / s.speed)
        if (Math.abs(s.opacity - s.targetOpacity) < 0.01) s.targetOpacity = 0.2 + Math.random() * 0.8

        const px = s.x + mouseX * 0.02
        const py = s.y + mouseY * 0.02
        ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity))
        ctx.fillStyle = s.color
        ctx.fillRect(px, py, s.size, s.size)
      })
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX - window.innerWidth / 2
      mouseY = e.clientY - window.innerHeight / 2
    }
    window.addEventListener('mousemove', onMouse)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
}
