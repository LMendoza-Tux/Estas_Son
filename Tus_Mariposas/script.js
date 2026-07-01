/* Sources: https://github.com/klevron/threejs-toys */
/* Revised by: tommyho510@gmail.com */

import { butterfliesBackground } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js'

const pc = butterfliesBackground({
  el: document.getElementById('app'),
  eventsEl: document.body,
  gpgpuSize: 18,
  background: 0x88CEFF,
  material: 'phong', // or 'standard' 'basic'
  lights: [
    { type: 'ambient', params: [0xffffff, 0.5] },
    { type: 'directional', params: [0xffffff, 1], props: { position: [10, 0, 0] } }
  ],
  materialParams: { transparent: true, alphaTest: 0.5 },
  texture: 'https://assets.codepen.io/33787/butterflies.png',
  textureCount: 4,
  wingsScale: [2, 2, 2],
  wingsWidthSegments: 16,
  wingsHeightSegments: 16,
  wingsSpeed: 0.75,
  wingsDisplacementScale: 1.25,
  noiseCoordScale: 0.01,
  noiseTimeCoef: 0.0005,
  noiseIntensity: 0.0025,
  attractionRadius1: 100,
  attractionRadius2: 150,
  maxVelocity: 0.1
})

const audio = new Audio('./assets/audio/DEKKO - 12x3  (Visualizer)(MP3_160K).mp3')
audio.loop = true
audio.volume = 0.75

const overlay = document.getElementById('loadingOverlay')
const startBtn = document.getElementById('startBtn')
const lyricsDisplay = document.getElementById('lyricsDisplay')

/* ---------- Letras sincronizadas ---------- */

let lyricsCues = []      // [{ time: segundos, text: '...' }]
let currentCueIndex = -1

// Convierte "[mm:ss.xx]" a segundos
function timeToSeconds(min, sec) {
  return parseInt(min, 10) * 60 + parseFloat(sec)
}

// Parsea el archivo lyrics.txt con formato tipo LRC: [mm:ss.xx]Texto
function parseLyrics(raw) {
  const lineRegex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)/
  return raw
    .split(/\r?\n/)
    .map(line => {
      const match = line.match(lineRegex)
      if (!match) return null
      const [, min, sec, text] = match
      return { time: timeToSeconds(min, sec), text: text.trim() }
    })
    .filter(cue => cue && cue.text.length > 0)
    .sort((a, b) => a.time - b.time)
}

async function loadLyrics() {
  try {
    const res = await fetch('./assets/lyrics/lyrics.txt')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.text()
    lyricsCues = parseLyrics(raw)
  } catch (err) {
    console.warn('No se pudieron cargar las letras:', err)
  }
}

// Cuánto tiempo (en segundos) se muestra la última línea antes de desaparecer
const LAST_LINE_DISPLAY_SECONDS = 4

// Actualiza el texto mostrado según el tiempo actual del audio
function updateLyrics() {
  if (!lyricsDisplay || lyricsCues.length === 0) return

  const t = audio.currentTime
  let idx = -1
  for (let i = 0; i < lyricsCues.length; i++) {
    if (lyricsCues[i].time <= t) {
      idx = i
    } else {
      break
    }
  }

  // Si estamos en la última línea, comprobar si ya venció su tiempo de exhibición
  if (idx === lyricsCues.length - 1) {
    const elapsedSinceLastCue = t - lyricsCues[idx].time
    if (elapsedSinceLastCue > LAST_LINE_DISPLAY_SECONDS) {
      idx = -1
    }
  }

  if (idx !== currentCueIndex) {
    currentCueIndex = idx
    if (idx === -1) {
      lyricsDisplay.classList.remove('visible')
    } else {
      lyricsDisplay.textContent = lyricsCues[idx].text
      lyricsDisplay.classList.add('visible')
    }
  }
}

audio.addEventListener('timeupdate', updateLyrics)

/* ---------- Ventana principal / inicio de la experiencia ---------- */

function startExperience() {
  if (!overlay) return
  overlay.classList.add('hidden')
  audio.play().catch(err => {
    console.warn('No se pudo iniciar el audio automáticamente:', err)
  })
}

loadLyrics()

startBtn?.addEventListener('click', (e) => {
  e.stopPropagation()
  startExperience()
})
