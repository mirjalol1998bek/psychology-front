<script setup lang="ts">
/**
 * Decorative dotted-sphere animation for the dashboard hero, in the spirit
 * of the Vision UI reference's rotating globe. Hand-drawn on canvas (no
 * charting/3D library needed for a few hundred points) — a lat/long dot
 * grid rotated around the Y axis with a simple orthographic projection and
 * a depth-based fade so the far side reads as "behind" the sphere.
 */
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let angle = 0
let ro: ResizeObserver | null = null

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const LAT_BANDS = 14
const LON_POINTS = 26

function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const R = Math.min(w, h) / 2 - 2

  const points: { x: number; y: number; z: number }[] = []
  for (let i = 1; i < LAT_BANDS; i++) {
    const lat = (i / LAT_BANDS - 0.5) * Math.PI
    const ringR = Math.cos(lat)
    const y3 = Math.sin(lat)
    const density = Math.max(6, Math.round(LON_POINTS * ringR))
    for (let j = 0; j < density; j++) {
      const lon = (j / density) * Math.PI * 2 + angle
      points.push({ x: ringR * Math.cos(lon), y: y3, z: ringR * Math.sin(lon) })
    }
  }

  points.sort((a, b) => a.z - b.z)
  for (const p of points) {
    const depth = (p.z + 1) / 2 // 0 (back) .. 1 (front)
    const px = cx + p.x * R
    const py = cy - p.y * R
    const alpha = 0.08 + depth * 0.75
    const size = 0.6 + depth * 1.6
    ctx.fillStyle = `rgba(44, 217, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Faint outer ring so the sphere reads clearly at rest.
  ctx.strokeStyle = 'rgba(44, 217, 255, 0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  function resize() {
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function loop() {
    if (!canvas || !ctx) return
    if (!reduceMotion) angle += 0.0035
    draw(ctx, canvas.clientWidth, canvas.clientHeight)
    raf = requestAnimationFrame(loop)
  }

  resize()
  loop()
  ro = new ResizeObserver(resize)
  ro.observe(canvas)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <canvas ref="canvasRef" class="globe-canvas" aria-hidden="true" />
</template>

<style scoped>
.globe-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
