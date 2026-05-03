import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, ClipboardList, MessageCircle, User,
  Zap, LogOut, TrendingUp, Plus, Activity,
} from 'lucide-react'
import api from '../api/axios'

const NAV_BG      = '#2e3d5c'
const NAV_BORDER  = '1px solid rgba(255,255,255,0.12)'
const CARD_BG     = '#3b4b6e'
const CARD_BORDER = '1px solid rgba(255,255,255,0.15)'

const navItems = [
  { to: '/',         icon: Home,          label: 'Ana Sayfa'  },
  { to: '/tasks',    icon: ClipboardList, label: 'İlanlar'    },
  { to: '/messages', icon: MessageCircle, label: 'Mesajlar'   },
  { to: '/profile',  icon: User,          label: 'Profil'     },
]

// ── Sol Sidebar ──────────────────────────────────────────────
function LeftSidebar({ user, wallet }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('uniloop_token')
    window.location.href = '/auth'
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen py-6 px-4"
      style={{ backgroundColor: NAV_BG, borderRight: NAV_BORDER }}
    >
      {/* Logo */}
      <div 
        className="flex items-center gap-2.5 px-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/')}
      >
        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-amber-950" />
        </div>
        <div>
          <p className="text-base font-extrabold text-white leading-none">UniLoop</p>
          <p className="text-[10px] text-slate-300 leading-none mt-0.5">Kampüs Ekonomisi</p>
        </div>
      </div>

      {/* Navigasyon */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
               ${isActive
                 ? 'bg-amber-500 text-amber-950 font-semibold'
                 : 'text-slate-300 hover:text-white hover:bg-white/10'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-sm font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Alt: Kullanıcı + Bakiye */}
      <div className="mt-auto">
        {wallet && (
          <div className="mb-3 p-4 rounded-xl" style={{ backgroundColor: CARD_BG, border: CARD_BORDER }}>
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide font-medium">Bakiyem</p>
            <p className="text-lg font-extrabold text-amber-400 leading-none">
              {wallet.balance} <span className="text-sm font-bold opacity-70">KP</span>
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="text-[10px] text-slate-400 mt-1.5 hover:text-white transition-colors font-medium"
            >
              Profili Görüntüle →
            </button>
          </div>
        )}

        <div
          className="flex items-center gap-2.5 px-1 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div 
            className="flex flex-1 items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 -ml-1 rounded-lg transition-colors min-w-0"
            onClick={() => navigate('/profile')}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-xs font-bold text-amber-950 flex-shrink-0">
              {user?.full_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || '...'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            title="Çıkış Yap"
          >
            <LogOut size={13} className="text-slate-400" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Sağ Sidebar ──────────────────────────────────────────────
function RightSidebar() {
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/tasks?status=open')
      .then(res => {
        const tasks = res.data.tasks || []
        const byType = tasks.reduce((acc, t) => {
          acc[t.task_type] = (acc[t.task_type] || 0) + 1
          return acc
        }, {})
        const totalKp = tasks.reduce((sum, t) => sum + (Number(t.reward_kredi) || 0), 0)
        setStats({ total: tasks.length, byType, totalKp })
      })
      .catch(() => { })
  }, [])

  const typeLabels = {
    skill_exchange:  { label: '⚡ Yetenek Takası', color: 'text-slate-200' },
    courier_request: { label: '📦 Kurye Talebi',   color: 'text-amber-300' },
    courier_offer:   { label: '🛵 Kurye Teklifi',  color: 'text-teal-300'  },
    second_hand:     { label: '🛍️ İkinci El',      color: 'text-indigo-300' },
  }

  return (
    <aside
      className="hidden xl:flex flex-col w-60 shrink-0 sticky top-0 h-screen py-6 px-4"
      style={{ backgroundColor: NAV_BG, borderLeft: NAV_BORDER }}
    >
      {/* Platform istatistikleri */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: CARD_BG, border: CARD_BORDER }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-slate-400" />
          <p className="text-xs font-semibold text-white">Platform Durumu</p>
        </div>

        {stats ? (
          <div className="space-y-2.5">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Açık İlanlar</p>
              <p className="text-2xl font-extrabold text-white leading-tight">{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-medium">Dönen KP</p>
              <p className="text-base font-bold text-amber-400">{stats.totalKp} KP</p>
            </div>
            <div className="pt-2.5 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium ${typeLabels[type]?.color || 'text-slate-400'}`}>
                    {typeLabels[type]?.label || type}
                  </span>
                  <span className="text-[10px] text-slate-400">{count} ilan</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="h-8 rounded w-16" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="h-3 rounded"     style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <div className="h-3 rounded w-3/4" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          </div>
        )}
      </div>

      {/* Hızlı ilan ver */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: CARD_BG, border: CARD_BORDER }}>
        <p className="text-xs font-semibold text-white mb-1">İlan Ver</p>
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
          Yetenek takası, kurye talebi veya teklif oluştur.
        </p>
        <button
          onClick={() => navigate('/tasks')}
          className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
        >
          <Plus size={13} />
          Yeni İlan Oluştur
        </button>
      </div>

      {/* Nasıl Çalışır */}
      <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: CARD_BORDER }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-teal-400" />
          <p className="text-xs font-semibold text-white">Nasıl Çalışır?</p>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: '⚡', text: 'İlan ver veya mevcut ilana katıl' },
            { icon: '🔒', text: 'KP, escrow sistemiyle güvende tutulur' },
            { icon: '✅', text: 'İş bitti, her iki taraf onaylar, KP aktarılır' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <p className="text-[10px] text-slate-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ── Ana Layout ───────────────────────────────────────────────
export default function AppLayout({ children, user, wallet }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4f638f' }}>
      <div className="max-w-screen-xl mx-auto flex">
        <LeftSidebar user={user} wallet={wallet} />

        {/* Orta içerik */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}
