import { useState } from 'react'
import {
  Star, MapPin, ArrowRight, MessageCircle,
  Zap, Package, Navigation, BadgeCheck,
} from 'lucide-react'

// ── Sabitler ────────────────────────────────────────────────
const LOCATION_CONFIG = {
  muhendislik:   { label: 'Mühendislik',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25'    },
  merkez_kantin: { label: 'Merkez Kantin',  cls: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  yabanci_dil:   { label: 'Yabancı Dil',   cls: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
  sosyal_yasam:  { label: 'Sosyal Yaşam',  cls: 'bg-pink-500/15 text-pink-400 border-pink-500/25'    },
  kutuphane:     { label: 'Kütüphane',     cls: 'bg-teal-500/15 text-teal-400 border-teal-500/25'    },
}

const TASK_TYPE_CONFIG = {
  skill_exchange: { label: 'Yetenek Takası', icon: Zap,        cls: 'bg-brand/15 text-brand-light border-brand/25'         },
  courier_request:{ label: 'Kurye Talebi',   icon: Package,    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25'   },
  courier_offer:  { label: 'Kurye Teklifi',  icon: Navigation, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
}

// ── Yıldız ─────────────────────────────────────────────────
function StarRating({ value, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <Star
            key={s}
            size={11}
            className={s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-white/20 fill-white/10'}
          />
        ))}
      </div>
      <span className="text-[11px] text-white/50">
        {value?.toFixed(1)} ({count})
      </span>
    </div>
  )
}

// ── İletişim Modalı ─────────────────────────────────────────
function ContactDrawer({ contact, onClose }) {
  if (!contact) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full glass-card rounded-b-none rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        <p className="text-base font-semibold mb-4">İletişime Geç</p>
        <div className="space-y-3">
          {contact.instagram_handle && contact.show_instagram && (
            <a
              href={`https://instagram.com/${contact.instagram_handle}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-3 p-3 glass-card hover:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
                <span className="text-sm">📸</span>
              </div>
              <div>
                <p className="text-xs text-white/50">Instagram</p>
                <p className="text-sm font-medium">@{contact.instagram_handle}</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/30" />
            </a>
          )}
          {contact.linkedin_url && contact.show_linkedin && (
            <a
              href={contact.linkedin_url}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-3 p-3 glass-card hover:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <span className="text-sm">💼</span>
              </div>
              <div>
                <p className="text-xs text-white/50">LinkedIn</p>
                <p className="text-sm font-medium">Profili Görüntüle</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/30" />
            </a>
          )}
          {contact.phone_number && contact.show_phone && (
            <a
              href={`tel:${contact.phone_number}`}
              className="flex items-center gap-3 p-3 glass-card hover:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <span className="text-sm">📞</span>
              </div>
              <div>
                <p className="text-xs text-white/50">Telefon</p>
                <p className="text-sm font-medium">{contact.phone_number}</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/30" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Ana TaskCard ────────────────────────────────────────────
export default function TaskCard({ task, onAssign, contact }) {
  const [showContact, setShowContact] = useState(false)

  const typeConf = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.skill_exchange
  const TypeIcon = typeConf.icon

  // Lokasyon: courier_offer için from→to göster
  const locationDisplay = task.task_type === 'courier_offer' && task.from_location && task.to_location
    ? { label: `${LOCATION_CONFIG[task.from_location]?.label} → ${LOCATION_CONFIG[task.to_location]?.label}`, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' }
    : task.location ? LOCATION_CONFIG[task.location] : null

  const hasDiscount = task.effective_reward && task.effective_reward !== task.reward_kredi

  return (
    <>
      <div className="glass-card p-4 animate-fade-up hover:bg-white/[0.06] transition-all duration-200">
        {/* Üst: Oluşturan + Credibility */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-sm font-bold flex-shrink-0">
              {task.creator_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-white">{task.creator_name}</span>
                {task.credibility_score >= 61 && (
                  <BadgeCheck size={13} className="text-brand-light" />
                )}
              </div>
              <StarRating value={task.rating_average} count={task.rating_count} />
            </div>
          </div>

          {/* Ödül */}
          <div className="text-right flex-shrink-0">
            {hasDiscount && (
              <p className="text-[10px] text-white/30 line-through">{task.reward_kredi} K₺</p>
            )}
            <p className="text-base font-bold text-kredit leading-none">
              {task.effective_reward || task.reward_kredi} K₺
            </p>
            {hasDiscount && (
              <p className="text-[9px] text-brand-light">+Credibility Bonus</p>
            )}
          </div>
        </div>

        {/* Başlık & Açıklama */}
        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">{task.title}</h3>
        <p className="text-xs text-white/50 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>

        {/* Badge'lar */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium ${typeConf.cls}`}>
            <TypeIcon size={9} />
            {typeConf.label}
          </span>
          {locationDisplay && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium ${locationDisplay.cls}`}>
              <MapPin size={9} />
              {locationDisplay.label}
            </span>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex gap-2">
          <button
            onClick={() => onAssign?.(task)}
            className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5"
          >
            <span>Görevi Al</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => setShowContact(true)}
            className="btn-secondary flex items-center justify-center gap-1.5 px-3 text-sm"
          >
            <MessageCircle size={15} />
            <span>İletişim</span>
          </button>
        </div>
      </div>

      {showContact && (
        <ContactDrawer contact={contact} onClose={() => setShowContact(false)} />
      )}
    </>
  )
}
