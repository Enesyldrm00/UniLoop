import { Users, MapPin, ChevronRight } from 'lucide-react'

const LOCATION_LABELS = {
  muhendislik:   'Mühendislik',
  merkez_kantin: 'Merkez Kantin',
  yabanci_dil:   'Yabancı Dil',
  sosyal_yasam:  'Sosyal Yaşam',
  kutuphane:     'Kütüphane',
}

// Doluluk oranına göre renk
const getFillColor = (pct) => {
  if (pct >= 80) return { bar: 'bg-emerald-400', text: 'text-emerald-400', glow: 'shadow-kredit' }
  if (pct >= 50) return { bar: 'bg-amber-400',   text: 'text-amber-400',   glow: '' }
  return              { bar: 'bg-white/30',       text: 'text-white/50',    glow: '' }
}

export default function PoolBar({ pool, onJoin }) {
  const color = getFillColor(pool.fill_percentage)

  return (
    <div
      className="glass-card p-4 min-w-[220px] max-w-[220px] flex-shrink-0
                 cursor-pointer hover:bg-white/[0.07] transition-all duration-200
                 active:scale-[0.97] animate-fade-up"
      onClick={() => onJoin?.(pool)}
    >
      {/* Başlık */}
      <p className="text-sm font-semibold text-white leading-snug line-clamp-1 mb-1">
        {pool.title}
      </p>

      {/* Lokasyon */}
      {pool.location && (
        <div className="flex items-center gap-1 mb-3">
          <MapPin size={11} className="text-white/40" />
          <span className="text-[10px] text-white/40">
            {LOCATION_LABELS[pool.location] || pool.location}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1 text-white/50">
            <Users size={11} />
            <span className="text-[11px]">
              {pool.current_capacity}/{pool.max_capacity} kişi
            </span>
          </div>
          <span className={`text-[11px] font-bold ${color.text}`}>
            %{pool.fill_percentage}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
            style={{ width: `${pool.fill_percentage}%` }}
          />
        </div>
      </div>

      {/* Kişi başı ücret */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px] text-white/40">Kişi başı</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-kredit">
            {pool.cost_per_person} K₺
          </span>
          <ChevronRight size={12} className="text-white/30" />
        </div>
      </div>
    </div>
  )
}
