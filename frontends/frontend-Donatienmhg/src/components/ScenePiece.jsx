/** Décor commun d'une pièce vue de face : mur du fond, plinthe, parquet en perspective. */
export default function ScenePiece({ children, className = '', ...props }) {
  return (
    <div
      {...props}
      className={`relative overflow-hidden rounded-2xl border border-nuit-700 shadow-2xl shadow-black/60 ${className}`}
    >
      {/* Mur */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-nuit-800 via-nuit-800 to-nuit-900" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_38px,rgba(255,255,255,0.012)_38px_40px)]"
      />

      {/* Sol : lames de parquet qui fuient vers le fond */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[30%] overflow-hidden [perspective:420px]">
        <div className="absolute -inset-x-1/2 top-0 h-[300%] origin-top [transform:rotateX(62deg)] bg-[repeating-linear-gradient(0deg,transparent_0_240px,#0e0b16_240px_243px),repeating-linear-gradient(90deg,#1c1729_0_90px,#120f1c_90px_93px)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
      </div>

      {/* Plinthe */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[30%] h-2 bg-nuit-700 shadow-[0_2px_8px] shadow-black/50"
      />

      {children}
    </div>
  )
}
