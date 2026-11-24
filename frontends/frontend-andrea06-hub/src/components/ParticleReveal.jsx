
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleReveal({ onComplete }) {
  const containerRef = useRef(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    if (!width || !height) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      0.1, 100
    )
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })

    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // Dessiner le prénom sur un canvas invisible.
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    })

    const fontSize = Math.min(width * 0.085, 105)
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${fontSize}px Arial`
    ctx.fillText('ANDRÉA VISSOH', width / 2, height / 2)

    const pixels = ctx.getImageData(
      0, 0, width, height
    ).data

    const targets = []

    // Échantillonner les pixels qui composent les lettres.
    const step = width < 600 ? 3 : 4

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4

        if (pixels[index + 3] > 128) {
          targets.push([
            x - width / 2,
            height / 2 - y,
          ])
        }
      }
    }

    const count = Math.min(targets.length, 6500)
    const positions = new Float32Array(count * 3)
    const destinations = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const target = targets[
        Math.floor(i * targets.length / count)
      ]

      positions[i * 3] = (Math.random() - 0.5) * width
      positions[i * 3 + 1] = (Math.random() - 0.5) * height
      positions[i * 3 + 2] = 0

      destinations[i * 3] = target[0]
      destinations[i * 3 + 1] = target[1]
      destinations[i * 3 + 2] = 0

      const brightness = 0.5 + Math.random() * 0.5
      colors[i * 3] = 0.12 * brightness
      colors[i * 3 + 1] = 0.55 * brightness
      colors[i * 3 + 2] = 1.0 * brightness
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    )
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    )

    const material = new THREE.PointsMaterial({
      size: width < 600 ? 2 : 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    let frameId
    let finished = false
    const startTime = performance.now()
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const duration = reducedMotion ? 0 : 3600

    function animate(now) {
      const elapsed = now - startTime
      const progress = duration === 0
        ? 1
        : Math.min(elapsed / duration, 1)

      // Accélération douce puis ralentissement.
      const ease = 1 - Math.pow(1 - progress, 3)

      const array = geometry.attributes.position.array

      for (let i = 0; i < count; i++) {
        const j = i * 3
        array[j] += (destinations[j] - array[j]) * ease * 0.045
        array[j + 1] += (
          destinations[j + 1] - array[j + 1]
        ) * ease * 0.045
      }

      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
if (progress >= 1 && !finished) {
  finished = true
  onCompleteRef.current?.()
}

if (finished) {
  // Les particules s'effacent progressivement.
  const fadeProgress = Math.min(
    (elapsed - duration) / 1400,
    1
  )

  material.opacity = 0.95 * (1 - fadeProgress)

  if (fadeProgress >= 1) {
    renderer.render(scene, camera)
    return
  }
}

frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
      geometry.dispose()
      material.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="particle-reveal"
      aria-hidden="true"
    />
  )
}
