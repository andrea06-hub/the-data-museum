// Effet de profondeur : suit la souris sur la scène (valeurs lissées entre -0,5 et 0,5).

import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

/** Renvoie la position lissée de la souris et les gestionnaires à poser sur la scène. */
export function useParallaxe() {
  const brutX = useMotionValue(0)
  const brutY = useMotionValue(0)
  const x = useSpring(brutX, { stiffness: 60, damping: 18 })
  const y = useSpring(brutY, { stiffness: 60, damping: 18 })
  const sansAnimation = useReducedMotion()

  function onMouseMove(e) {
    if (sansAnimation) return
    const zone = e.currentTarget.getBoundingClientRect()
    brutX.set((e.clientX - zone.left) / zone.width - 0.5)
    brutY.set((e.clientY - zone.top) / zone.height - 0.5)
  }

  function onMouseLeave() {
    brutX.set(0)
    brutY.set(0)
  }

  return { souris: { x, y }, gestionnaires: { onMouseMove, onMouseLeave } }
}
