import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, ClipboardList, MessageCircle, User,
  Zap, LogOut, TrendingUp, Plus, Activity,
} from 'lucide-react'
import api from '../api/axios'

const navItems = [
  { to: '/', icon: Home, label: 'Ana Sayfa' },
  { to: '/tasks', icon: ClipboardList, label: 'İlanlar' },
  { to: '/messages', icon: MessageCircle, label: 'Mesajlar' },
  { to: '/profile', icon: User, label: 'Profil' },
]

// ── Sol Sidebar ──────────────────────────────────────────────
function LeftSidebar({ user, wallet }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('uniloop_token')
    window.location.href = '/auth'
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen py-6 px-4
                      bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold text-slate-900 leading-none">UniLoop</p>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Kampüs Ekonomisi</p>
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
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
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
        {/* Bakiye kartı */}
        {wallet && (
          <div className="mb-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide font-medium">Bakiyem</p>
            <p className="text-lg font-extrabold text-emerald-600 leading-none">
              {wallet.balance} <span className="text-sm font-bold opacity-70">KP</span>
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="text-[10px] text-slate-500 mt-1.5 hover:text-slate-900 transition-colors font-medium"
            >
              Profili Görüntüle →
            </button>
          </div>
        )}

        {/* Kullanıcı satırı */}
        <div className="flex items-center gap-2.5 px-1 pt-3 border-t border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.full_name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.full_name || '...'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
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
    skill_exchange: { label: '⚡ Yetenek Takası', color: 'text-slate-700' },
    courier_request: { label: '📦 Kurye Talebi', color: 'text-amber-600' },
    courier_offer: { label: '🛵 Kurye Teklifi', color: 'text-emerald-600' },
  }

  return (
    <aside className="hidden xl:flex flex-col w-60 shrink-0 sticky top-0 h-screen py-6 px-4
                      bg-white border-l border-slate-200">
      {/* Platform istatistikleri */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-900">Platform Durumu</p>
        </div>

        {stats ? (
          <div className="space-y-2.5">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Açık İlanlar</p>
              <p className="text-2xl font-extrabold text-slate-900 leading-tight">{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-medium">Dönen KP</p>
              <p className="text-base font-bold text-emerald-600">{stats.totalKp} KP</p>
            </div>
            <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
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
            <div className="h-8 bg-slate-100 rounded w-16" />
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        )}
      </div>

      {/* Hızlı ilan ver */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-slate-900 mb-1">İlan Ver</p>
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
          Yetenek takası, kurye talebi veya kurye teklifi oluştur.
        </p>
        <button
          onClick={() => navigate('/tasks')}
          className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
        >
          <Plus size={13} />
          Yeni İlan Oluştur
        </button>
      </div>

      {/* Nasıl Çalışır? */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-emerald-600" />
          <p className="text-xs font-semibold text-slate-900">Nasıl Çalışır?</p>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: '⚡', text: 'İlan ver veya mevcut ilana katıl' },
            { icon: '🔒', text: 'KP, escrow sistemiyle güvende tutulur' },
            { icon: '✅', text: 'İş bitti, her iki taraf onaylar, KP aktarılır' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">{text}</p>
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
    <div className="min-h-screen bg-slate-50">
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
