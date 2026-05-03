import { useState } from 'react'
import { Users, MapPin, ChevronRight, Loader, CheckCircle, AlertCircle, Truck } from 'lucide-react'
import api from '../api/axios'

const LOCATION_LABELS = {
  muhendislik:   'Mühendislik',
  merkez_kantin: 'Merkez Kantin',
  yabanci_dil:   'Yabancı Dil',
  sosyal_yasam:  'Sosyal Yaşam',
  kutuphane:     'Kütüphane',
}

const getFillColor = (pct) => {
  if (pct >= 100) return { bar: 'bg-emerald-500', text: 'text-teal-400' }
  if (pct >= 80)  return { bar: 'bg-emerald-400', text: 'text-teal-400' }
  if (pct >= 50)  return { bar: 'bg-amber-400',   text: 'text-amber-600'  }
  return               { bar: 'bg-slate-200',     text: 'text-slate-400'  }
}

export default function PoolBar({ pool, onJoin }) {
  const [joining,  setJoining]  = useState(false)
  const [joined,   setJoined]   = useState(false)
  const [error,    setError]    = useState('')
  const [curPool,  setCurPool]  = useState(pool)

  const isFull  = curPool.current_capacity >= curPool.max_capacity
  const fillPct = Math.min(Math.round((curPool.current_capacity / curPool.max_capacity) * 100), 100)
  const color   = getFillColor(fillPct)

  const handleJoin = async (e) => {
    e.stopPropagation()
    if (joined || joining) return
    setError('')
    setJoining(true)
    try {
      const res = await api.post(`/pools/${curPool.id}/join`)
      setJoined(true)
      if (res.data.pool) {
        const p = res.data.pool
        setCurPool({
          ...curPool,
          current_capacity: p.current_capacity,
          fill_percentage: Math.round((p.current_capacity / p.max_capacity) * 100),
        })
      }
      onJoin?.(curPool)
    } catch (err) {
      setError(err.response?.data?.message || 'Katılım başarısız.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 min-w-[220px] max-w-[220px] flex-shrink-0
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
      {/* Başlık */}
      <p 
        className="text-sm font-semibold text-white leading-snug line-clamp-1 mb-1"
        title={curPool.title}
      >
        {curPool.title}
      </p>

      {/* Lokasyon */}
      {curPool.location && (
        <div className="flex items-center gap-1 mb-3">
          <MapPin size={11} className="text-slate-400" />
          <span className="text-[10px] text-slate-400 font-medium">
            {LOCATION_LABELS[curPool.location] || curPool.location}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1 text-slate-400">
            <Users size={11} />
            <span className="text-[11px]">
              {curPool.current_capacity}/{curPool.max_capacity} kişi
            </span>
          </div>
          <span className={`text-[11px] font-bold ${color.text}`}>
            %{fillPct}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Sepet DOLU → Otomatik kurye ilanı banner */}
      {isFull && (
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <Truck size={13} className="text-teal-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-emerald-700">Sepet Doldu!</p>
            <p className="text-[9px] text-slate-400 leading-tight">Otomatik kurye ilanı oluşturuldu 🚚</p>
          </div>
        </div>
      )}

      {/* Kişi başı + Katıl Butonu */}
      {!isFull && (
        <div className="flex items-center justify-between mt-3 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Kişi başı</span>
            <p className="text-xs font-bold text-teal-400">{curPool.cost_per_person} KP</p>
          </div>
          <button
            onClick={handleJoin}
            disabled={joining || joined || curPool.status !== 'open'}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
              ${joined
                ? 'bg-emerald-50 text-teal-400 border border-emerald-200'
                : curPool.status !== 'open'
                  ? 'bg-white/10 text-slate-300 cursor-not-allowed'
                  : 'btn-primary hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0'
              }`}
          >
            {joining  ? <Loader size={12} className="animate-spin" />
            : joined   ? <><CheckCircle size={12} /> Katıldın</>
            : curPool.status !== 'open' ? 'Dolu'
            : <>Katıl <ChevronRight size={12} /></>}
          </button>
        </div>
      )}

      {/* Hata mesajı */}
      {error && (
        <div className="flex items-start gap-1 mt-2">
          <AlertCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-500 leading-tight">{error}</p>
        </div>
      )}
    </div>
  )
}
