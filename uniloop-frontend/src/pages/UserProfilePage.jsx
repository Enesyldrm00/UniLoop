import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Star, Shield, MapPin, BookOpen,
  Loader, Zap, Package, Navigation, ChevronDown, ChevronUp, User,
  Instagram, Linkedin, Phone,
} from 'lucide-react'
import api from '../api/axios'
import Navbar from '../components/Navbar'

// ── Yardımcı: yıldız render ──────────────────────────────────
function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/15'}
        />
      ))}
    </div>
  )
}

// ── Task türü etiketi ────────────────────────────────────────
const TYPE_CONFIG = {
  skill_exchange:  { emoji: '⚡', label: 'Yetenek',  color: 'text-brand-light   bg-brand/10   border-brand/20'   },
  courier_request: { emoji: '📦', label: 'Kurye',    color: 'text-blue-300      bg-blue-500/10 border-blue-500/20' },
  courier_offer:   { emoji: '🛵', label: 'Teklif',   color: 'text-amber-300     bg-amber-500/10 border-amber-500/20' },
  second_hand:     { emoji: '🛍️', label: 'İkinci El', color: 'text-indigo-300    bg-indigo-500/10 border-indigo-500/20' },
}

function TaskBadge({ task }) {
  const cfg = TYPE_CONFIG[task.task_type] || {}
  return (
    <div className={`glass-card p-3.5 rounded-2xl border ${cfg.color?.split(' ').slice(1).join(' ') || ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{cfg.emoji}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${cfg.color?.split(' ')[0]}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-white line-clamp-2">{task.title}</p>
          {task.description && (
            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          {(task.location || task.from_location) && (
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin size={10} className="text-white/30" />
              <span className="text-[10px] text-white/30">
                {task.from_location
                  ? `${task.from_location} → ${task.to_location}`
                  : task.location}
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-base font-extrabold text-kredit leading-none">{task.reward_kredi}</p>
          <p className="text-[9px] text-kredit/60 font-medium">KP</p>
        </div>
      </div>
    </div>
  )
}

// ── Review kartı ─────────────────────────────────────────────
function ReviewCard({ review }) {
  const date = new Date(review.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <div className="glass-card p-4 rounded-2xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#3b4b6e]/10 flex items-center justify-center flex-shrink-0">
            <User size={12} className="text-white/40" />
          </div>
          <span className="text-xs font-medium text-white/60">{review.reviewer_name}</span>
        </div>
        <span className="text-[10px] text-white/25">{date}</span>
      </div>
      <StarRow rating={review.rating} size={13} />
      {review.comment && (
        <p className="text-xs text-white/50 leading-relaxed pl-1 border-l border-white/10">
          "{review.comment}"
        </p>
      )}
    </div>
  )
}

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function UserProfilePage() {
  const { userId } = useParams()
  const navigate   = useNavigate()

  const [profile,  setProfile]  = useState(null)
  const [reviews,  setReviews]  = useState([])
  const [tasks,    setTasks]    = useState([])
  const [contact,  setContact]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [showTasks, setShowTasks] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.all([
      api.get(`/profile/${userId}`),
      api.get(`/profile/${userId}/reviews`),
      api.get(`/profile/${userId}/tasks`),
      api.get(`/contact/${userId}`).catch(() => ({ data: { contact: null } })),
    ])
      .then(([profRes, revRes, taskRes, contactRes]) => {
        setProfile(profRes.data.profile)
        setReviews(revRes.data.reviews || [])
        setTasks(taskRes.data.tasks || [])
        setContact(contactRes.data.contact)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <Loader size={28} className="animate-spin text-white/30" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-container flex flex-col items-center justify-center gap-4">
        <p className="text-white/30 text-sm">Kullanıcı bulunamadı.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary px-6 py-2 text-sm">
          Geri Dön
        </button>
      </div>
    )
  }

  const avgRating  = parseFloat(profile.rating_average) || 0
  const ratingCount = parseInt(profile.rating_count, 10) || 0
  const initials   = profile.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 glass-card flex items-center justify-center hover:bg-[#3b4b6e]/10 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={17} className="text-white/70" />
        </button>
        <h1 className="text-lg font-bold">Profil</h1>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Avatar + İsim Kartı */}
        <div className="glass-card p-5 rounded-3xl">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center
                              text-xl font-extrabold text-white shadow-brand">
                {initials}
              </div>
              {profile.credibility_score >= 61 && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-dark-card rounded-lg
                                flex items-center justify-center border border-white/10">
                  <Shield size={12} className="text-brand-light" />
                </div>
              )}
            </div>

            {/* Bilgiler */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">{profile.full_name}</p>
              {profile.department && (
                <div className="flex items-center gap-1 mt-0.5">
                  <BookOpen size={11} className="text-white/30" />
                  <span className="text-xs text-white/40">{profile.department}</span>
                </div>
              )}
              {/* Yıldız özeti */}
              <div className="flex items-center gap-2 mt-2">
                <StarRow rating={avgRating} size={14} />
                <span className="text-sm font-bold text-amber-400">
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-white/30">({ratingCount} değerlendirme)</span>
              </div>
            </div>
          </div>

          {/* Credibility bar */}
          {profile.credibility_score > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Güvenilirlik Skoru</span>
                <span className="text-xs font-bold text-brand-light">{profile.credibility_score}/100</span>
              </div>
              <div className="h-1.5 bg-[#3b4b6e]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-gradient rounded-full transition-all duration-700"
                  style={{ width: `${profile.credibility_score}%` }}
                />
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 pt-4 border-t border-white/[0.06] text-sm text-white/50 leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Değerlendirmeler */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              ⭐ Değerlendirmeler
            </p>
            <span className="text-xs text-white/30">{reviews.length} yorum</span>
          </div>

          {reviews.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center">
              <p className="text-3xl mb-2">⭐</p>
              <p className="text-sm text-white/30">Henüz değerlendirme yok</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviews.map((rev, i) => (
                <ReviewCard key={i} review={rev} />
              ))}
            </div>
          )}
        </div>

        {/* İletişim Bilgileri */}
        {contact && (contact.instagram_handle || contact.linkedin_url || contact.phone_number) && (
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              📬 İletişim
            </p>
            <div className="space-y-2">
              {contact.instagram_handle && (
                <a
                  href={`https://instagram.com/${contact.instagram_handle}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 glass-card p-3.5 rounded-2xl
                             hover:bg-[#3b4b6e]/5 transition-colors active:scale-[0.99]"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400
                                  flex items-center justify-center flex-shrink-0">
                    <Instagram size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/40">Instagram</p>
                    <p className="text-sm font-medium text-white">@{contact.instagram_handle}</p>
                  </div>
                  <span className="text-white/20 text-lg">›</span>
                </a>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 glass-card p-3.5 rounded-2xl
                             hover:bg-[#3b4b6e]/5 transition-colors active:scale-[0.99]"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-600
                                  flex items-center justify-center flex-shrink-0">
                    <Linkedin size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/40">LinkedIn</p>
                    <p className="text-sm font-medium text-white">Profili Görüntüle</p>
                  </div>
                  <span className="text-white/20 text-lg">›</span>
                </a>
              )}
              {contact.phone_number && (
                <a
                  href={`tel:${contact.phone_number}`}
                  className="flex items-center gap-3 glass-card p-3.5 rounded-2xl
                             hover:bg-[#3b4b6e]/5 transition-colors active:scale-[0.99]"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600
                                  flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/40">Telefon</p>
                    <p className="text-sm font-medium text-white">{contact.phone_number}</p>
                  </div>
                  <span className="text-white/20 text-lg">›</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Aktif İlanlar */}
        <div>
          <button
            onClick={() => setShowTasks(v => !v)}
            className="w-full glass-card p-4 rounded-2xl flex items-center justify-between
                       hover:bg-[#3b4b6e]/5 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className="text-sm font-semibold text-white">Aktif İlanlar</span>
              {tasks.length > 0 && (
                <span className="text-[10px] bg-brand/20 text-brand-light border border-brand/30
                                 px-2 py-0.5 rounded-lg font-medium">
                  {tasks.length}
                </span>
              )}
            </div>
            {showTasks
              ? <ChevronUp size={16} className="text-white/40" />
              : <ChevronDown size={16} className="text-white/40" />
            }
          </button>

          {showTasks && (
            <div className="mt-2 space-y-2">
              {tasks.length === 0 ? (
                <div className="glass-card p-5 rounded-2xl text-center">
                  <p className="text-sm text-white/30">Aktif ilan yok</p>
                </div>
              ) : (
                tasks.map(task => <TaskBadge key={task.id} task={task} />)
              )}
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  )
}
