<script setup lang="ts">
/**
 * Decorative dotted-sphere animation for the dashboard hero, in the spirit
 * of the Vision UI reference's rotating globe. Points are distributed
 * evenly over the sphere (Fibonacci spiral — no pole clustering) and kept
 * only where they fall inside a rough continent land-mask, so the dots
 * read as a recognisable world map rather than an abstract wireframe ball.
 */
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let angle = 0
let ro: ResizeObserver | null = null

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Rough continent silhouettes as overlapping ellipses in lat/lon space —
// not geographically precise, just enough for the dot pattern to read as
// "world map" rather than uniform noise.
const LAND_BLOBS = [
  // Africa
  { lat: 5, lon: 20, rLat: 30, rLon: 17 },
  { lat: 27, lon: 15, rLat: 11, rLon: 11 },
  { lat: -22, lon: 25, rLat: 14, rLon: 11 },
  // Europe
  { lat: 50, lon: 12, rLat: 9, rLon: 16 },
  { lat: 56, lon: 35, rLat: 8, rLon: 12 },
  // Asia
  { lat: 55, lon: 85, rLat: 16, rLon: 42 },
  { lat: 33, lon: 100, rLat: 14, rLon: 34 },
  { lat: 12, lon: 102, rLat: 11, rLon: 18 },
  { lat: 24, lon: 76, rLat: 11, rLon: 11 },
  { lat: 27, lon: 45, rLat: 9, rLon: 9 },
  { lat: 60, lon: 140, rLat: 12, rLon: 20 },
  // North America
  { lat: 50, lon: -100, rLat: 18, rLon: 24 },
  { lat: 28, lon: -95, rLat: 9, rLon: 13 },
  { lat: 62, lon: -110, rLat: 12, rLon: 20 },
  // South America
  { lat: -3, lon: -62, rLat: 16, rLon: 11 },
  { lat: -25, lon: -64, rLat: 13, rLon: 9 },
  // Australia
  { lat: -25, lon: 134, rLat: 9, rLon: 13 },
]

function isLand(latDeg: number, lonDeg: number, jitter: number): boolean {
  return LAND_BLOBS.some((b) => {
    const dLat = (latDeg - b.lat) / (b.rLat + jitter)
    const dLon = (lonDeg - b.lon) / (b.rLon + jitter)
    return dLat * dLat + dLon * dLon <= 1
  })
}

interface Pt {
  lat: number
  lon: number
  land: boolean
}

// Fibonacci-sphere sample points, generated once — only their longitude
// rotates per frame, so land classification never needs to be redone.
const SAMPLE_COUNT = 2600
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const points: Pt[] = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
  const y = 1 - (i / (SAMPLE_COUNT - 1)) * 2
  const lat = (Math.asin(y) * 180) / Math.PI
  const lon = ((GOLDEN_ANGLE * i * 180) / Math.PI) % 360
  const lonNorm = lon > 180 ? lon - 360 : lon
  return { lat, lon: lonNorm, land: isLand(lat, lonNorm, 1.5) }
}).filter((p) => p.land)

function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const R = Math.min(w, h) / 2 - 2

  const projected = points.map((p) => {
    const latRad = (p.lat * Math.PI) / 180
    const lonRad = ((p.lon * Math.PI) / 180) + angle
    const x3 = Math.cos(latRad) * Math.sin(lonRad)
    const y3 = Math.sin(latRad)
    const z3 = Math.cos(latRad) * Math.cos(lonRad)
    return { x: x3, y: y3, z: z3 }
  })
  projected.sort((a, b) => a.z - b.z)

  for (const p of projected) {
    const depth = (p.z + 1) / 2 // 0 (back) .. 1 (front)
    if (depth < 0.06) continue
    const px = cx + p.x * R
    const py = cy - p.y * R
    const alpha = 0.1 + depth * 0.85
    const size = 0.9 + depth * 2.1
    ctx.beginPath()
    ctx.fillStyle = `rgba(94, 210, 255, ${alpha})`
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Soft rim highlight so the sphere edge reads clearly.
  const rim = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R)
  rim.addColorStop(0, 'rgba(94, 210, 255, 0.05)')
  rim.addColorStop(1, 'rgba(94, 210, 255, 0.22)')
  ctx.strokeStyle = rim
  ctx.lineWidth = 1.4
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
    if (!reduceMotion) angle += 0.0028
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
  <div class="globe-wrap">
    <canvas ref="canvasRef" class="globe-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
.globe-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.globe-wrap::before {
  content: '';
  position: absolute;
  inset: -10%;
  background: radial-gradient(circle at 40% 40%, rgba(0, 117, 255, 0.35), transparent 65%);
  filter: blur(30px);
  pointer-events: none;
}

.globe-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
