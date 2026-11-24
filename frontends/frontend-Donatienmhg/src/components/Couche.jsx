// Un plan de la scène pour l'effet de profondeur (voir utils/useParallaxe.js).

import { motion, useTransform } from 'framer-motion'

/**
 * Plus `profondeur` est grand, plus le plan bouge (= plus il paraît proche).
 * Le plan laisse passer les clics : ses enfants cliquables doivent avoir `pointer-events-auto`.
 */
export default function Couche({ souris, profondeur, children }) {
  const x = useTransform(souris.x, (v) => -v * profondeur)
  const y = useTransform(souris.y, (v) => -v * profondeur * 0.5)
  return (
    <motion.div style={{ x, y }} className="pointer-events-none absolute inset-0">
      {children}
    </motion.div>
  )
}
