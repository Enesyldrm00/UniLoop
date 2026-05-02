import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, TrendingUp, Clock, CheckCheck,
  Plus, ChevronRight, Sparkles, Filter, LogOut, X, Loader, RefreshCw,
} from 'lucide-react'
import api from '../api/axios'
import TaskCard from '../components/TaskCard'
import PoolBar from '../components/PoolBar'
import EscrowModal from '../components/EscrowModal'
import NotificationsPanel from '../components/NotificationsPanel'
import TopupModal from '../components/TopupModal'
import RatingModal from '../components/RatingModal'
import Navbar from '../components/Navbar'
import { useToast } from '../components/Toast'

// ── Yeni Sepet Oluştur Modalı ────────────────────────────────
const LOCATIONS = [
  { value: 'muhendislik',   label: '🏗️ Mühendislik' },
  { value: 'merkez_kantin', label: '🍽️ Merkez Kantin' },
  { value: 'yabanci_dil',   label: '💬 Yabancı Dil' },
  { value: 'sosyal_yasam',  label: '🌿 Sosyal Yaşam' },
  { value: 'kutuphane',     label: '📚 Kütüphane' },
]

function CreatePoolModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', location: '', max_capacity: '', total_cost: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const cap = parseInt(form.max_capacity, 10)
    const cost = parseInt(form.total_cost, 10)
    if (isNaN(cap) || cap < 2) { setError('Kapasite en az 2 kişi olmalıdır.'); return }
    if (isNaN(cost) || cost < 1) { setError('Toplam maliyet 0\'dan büyük olmalıdır.'); return }
    if (cost % cap !== 0) { setError(`Toplam maliyet (${cost}), kapasiteye (${cap}) tam bölünebilmeli.`); return }
    setLoading(true)
    try {
      await api.post('/pools', {
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        max_capacity: cap,
        total_cost: cost,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Sepet oluşturulamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30" />
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-semibold">🛒 Yeni Ortak Sepet</p>
          <button onClick={onClose} className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
            <X size={15} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-600 font-medium mb-1 block">Başlık *</label>
            <input required value={form.title} onChange={set('title')} placeholder="Öğle yemeği siparişi..." className="input-field text-sm py-2.5" />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium mb-1 block">Açıklama</label>
            <input value={form.description} onChange={set('description')} placeholder="Opsiyonel detaylar..." className="input-field text-sm py-2.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 font-medium mb-1 block">Lokasyon</label>
              <select value={form.location} onChange={set('location')} className="input-field text-sm py-2.5 bg-white">
                <option value="">Seçin...</option>
                {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium mb-1 block">Maks. Kişi *</label>
              <input required type="number" min="2" value={form.max_capacity} onChange={set('max_capacity')} placeholder="5" className="input-field text-sm py-2.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium mb-1 block">Toplam Maliyet (KP) *</label>
            <input required type="number" min="1" value={form.total_cost} onChange={set('total_cost')} placeholder="250" className="input-field text-sm py-2.5" />
            {form.max_capacity && form.total_cost && !isNaN(parseInt(form.total_cost) / parseInt(form.max_capacity)) && (
              <p className="text-xs text-emerald-600 mt-1">Kişi başı: {Math.floor(parseInt(form.total_cost) / parseInt(form.max_capacity))} KP</p>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100">
            {loading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>{loading ? 'Oluşturuluyor...' : 'Sepeti Oluştur'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Wallet Card ─────────────────────────────────────────────
function WalletCard({ wallet, user, onRefresh, onTopup }) {
  const [showBalance, setShowBalance] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  if (!wallet || !user) return (
    <div className="mx-4 mb-4 mt-2 rounded-2xl h-36 bg-slate-200 animate-pulse" />
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh?.()
    setRefreshing(false)
  }

  return (
    <div className="relative mx-4 mb-4 mt-2 rounded-2xl overflow-hidden bg-slate-900 shadow-sm animate-fade-up">
      <div className="hidden" />
      <div className="hidden" />
      <div className="hidden" />

      <div className="relative p-5">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium">UniLoop Cüzdan</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              title="Bakiyeyi Yenile"
            >
              <RefreshCw size={13} className={`text-white/70 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/60 text-[10px]">Aktif</span>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-white/50 text-xs mb-1">Mevcut Bakiye</p>
          <button
            onClick={() => setShowBalance((v) => !v)}
            className="flex items-end gap-2"
          >
            {showBalance ? (
              <span className="text-4xl font-extrabold text-white tracking-tight leading-none">
                {wallet.balance}
                <span className="text-2xl ml-1 font-bold opacity-70">KP</span>
              </span>
            ) : (
              <span className="text-4xl font-extrabold text-white tracking-tight leading-none">
                ● ● ● ●
              </span>
            )}
          </button>

        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/profile')}
            className="text-left hover:opacity-80 transition-opacity"
          >
            <p className="text-white font-semibold text-sm">{user.full_name}</p>
            <p className="text-white/50 text-[10px]">{user.email}</p>
          </button>
          <div className="flex gap-2">
            <button
              onClick={onTopup}
              className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
              title="Kredi Yükle"
            >
              <Plus size={16} className="text-white" />
            </button>
            <button className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
              <TrendingUp size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white" border border-slate-200 rounded-xl p-4 space-y-2 animate-pulse>
      <div className="h-4 bg-slate-100 rounded w-3/4" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
  )
}

// ── Bekleyen Görev Kartı ─────────────────────────────────────
function PendingTaskCard({ escrow, onOpen }) {
  const statusLabel = {
    locked:          { text: 'İlan sahibi onayı bekleniyor',    cls: 'text-amber-600',   dot: 'bg-amber-400' },
    buyer_approved:  { text: 'Onayla, işlemi tamamla',         cls: 'text-slate-700',   dot: 'bg-slate-900' },
    seller_approved: { text: 'İlan sahibinin onayı bekleniyor', cls: 'text-slate-400',   dot: 'bg-slate-300' },
  }[escrow.status] || { text: escrow.status, cls: 'text-slate-400', dot: 'bg-slate-200' }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Clock size={16} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{escrow.task_title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusLabel.dot}`} />
          <p className={`text-[11px] ${statusLabel.cls} truncate`}>{statusLabel.text}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold text-emerald-600">{escrow.amount} KP</span>
        <button
          onClick={onOpen}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold
                     bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
        >
          <CheckCheck size={12} />
          Teslim Et
        </button>
      </div>
    </div>
  )
}


function FilterSheet({ filterType, filterLocation, filterMaxReward, onApply, onClose }) {
  const [localType,     setLocalType]     = useState(filterType)
  const [localLocation, setLocalLocation] = useState(filterLocation)
  const [localMax,      setLocalMax]      = useState(filterMaxReward)

  const TYPES = [
    { key: 'all',              label: 'Tümü',       icon: '📌' },
    { key: 'skill_exchange',   label: 'Yetenek',   icon: '⚡' },
    { key: 'courier_request',  label: 'Kurye Talep',icon: '📦' },
    { key: 'courier_offer',    label: 'Kurye Teklif',icon: '🛕' },
  ]

  const handleReset = () => {
    setLocalType('all')
    setLocalLocation('')
    setLocalMax('')
  }

  const activeCount = [localType !== 'all', !!localLocation, !!localMax].filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30" />
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-t-2xl shadow-sm p-5 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-slate-900">🔍 Filtrele</p>
            {activeCount > 0 && (
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
                {activeCount} aktif
              </span>
            )}
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            Sıfırla
          </button>
        </div>

        {/* Görev Türü */}
        <div className="mb-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5">Görev Türü</p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setLocalType(t.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${localType === t.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lokasyon */}
        <div className="mb-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5">Lokasyon</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLocalLocation('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                ${!localLocation ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
            >
              Hepsi
            </button>
            {LOCATIONS.map(l => (
              <button
                key={l.value}
                onClick={() => setLocalLocation(localLocation === l.value ? '' : l.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                  ${localLocation === l.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Maks. Üret */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5">
            Maks. Üret / Kazanç
            {localMax && <span className="text-emerald-600 ml-2 normal-case">≤ {localMax} KP</span>}
          </p>
          <div className="flex gap-2">
            {['', '50', '100', '200', '500'].map(v => (
              <button
                key={v}
                onClick={() => setLocalMax(v)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                  ${localMax === v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
              >
                {v ? `≤${v}` : 'Hepsi'}
              </button>
            ))}
          </div>
        </div>

        {/* Uygula */}
        <button
          onClick={() => { onApply(localType, localLocation, localMax); onClose() }}
          className="btn-primary w-full py-3 font-semibold flex items-center justify-center gap-2"
        >
          <Filter size={15} />
          {activeCount > 0 ? `${activeCount} Filtre Uygula` : 'Göster'}
        </button>
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────
export default function DashboardPage() {
  const toast = useToast()
  const [user,              setUser]              = useState(null)
  const [wallet,            setWallet]            = useState(null)
  const [tasks,             setTasks]             = useState([])
  const [pools,             setPools]             = useState([])
  const [loading,           setLoading]           = useState(true)
  const [selectedEscrow,    setSelectedEscrow]    = useState(null)
  const [filterType,        setFilterType]        = useState('all')
  const [filterLocation,    setFilterLocation]    = useState('')
  const [filterMaxReward,   setFilterMaxReward]   = useState('')
  const [showFilterSheet,   setShowFilterSheet]   = useState(false)
  const [showCreatePool,    setShowCreatePool]    = useState(false)
  const [showTopupModal,    setShowTopupModal]    = useState(false)
  const [pendingEscrows,    setPendingEscrows]    = useState([])
  const [pendingReviews,    setPendingReviews]    = useState([])
  const [selectedReview,    setSelectedReview]    = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  // ── Ref'ler ─────────────────────────────────────────────────
  const selectedEscrowRef = React.useRef(null)
  React.useEffect(() => { selectedEscrowRef.current = selectedEscrow }, [selectedEscrow])
  const pollFnRef = React.useRef(null)

  // ── Veri Fonksiyonları ───────────────────────────────────────
  async function refreshWallet() {
    try {
      const res = await api.get('/wallet/me')
      setWallet(res.data.wallet)
      setUser(res.data.user)
    } catch { }
  }

  async function refreshEscrows() {
    try {
      const res = await api.get('/escrow/pending')
      const fresh = res.data.escrows || []
      setPendingEscrows(fresh)
      // Açık modal varsa senkronize et
      const open = selectedEscrowRef.current
      if (open) {
        const hit = fresh.find(e => parseInt(e.id, 10) === parseInt(open.id, 10))
        if (hit) setSelectedEscrow(prev => ({ ...prev, ...hit }))
      }
    } catch { }
  }

  async function refreshTasks() {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data.tasks || [])
    } catch { }
  }

  async function refreshReviews() {
    try {
      const res = await api.get('/escrow/review-pending')
      setPendingReviews(res.data.reviews || [])
    } catch { }
  }

  async function refreshPools() {
    try {
      const res = await api.get('/pools')
      setPools(res.data.pools || [])
    } catch { }
  }

  // pollFnRef her render'da güncel referanslara işaret eder
  React.useEffect(() => {
    pollFnRef.current = () => {
      refreshEscrows()
      refreshReviews()
      refreshTasks()
    }
  })

  // ── İlk Yükleme + Polling ────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [walletRes, tasksRes, poolsRes, escrowRes, reviewRes] = await Promise.all([
          api.get('/wallet/me'),
          api.get('/tasks'),
          api.get('/pools'),
          api.get('/escrow/pending'),
          api.get('/escrow/review-pending'),
        ])
        setWallet(walletRes.data.wallet)
        setUser(walletRes.data.user)
        setTasks(tasksRes.data.tasks || [])
        setPools(poolsRes.data.pools || [])
        setPendingEscrows(escrowRes.data.escrows || [])
        setPendingReviews(reviewRes.data.reviews || [])
      } catch (err) {
        console.error('Dashboard yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()

    // 5 saniyede bir polling
    const interval = setInterval(() => pollFnRef.current?.(), 5000)

    const onFocus = () => { refreshWallet(); pollFnRef.current?.() }
    window.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, []) // eslint-disable-line



  const handleLogout = () => {
    localStorage.removeItem('uniloop_token')
    window.location.href = '/auth'
  }



  const filteredTasks = tasks.filter(t => {
    if (filterType !== 'all' && t.task_type !== filterType) return false
    if (filterLocation && t.location !== filterLocation) return false
    if (filterMaxReward && parseInt(t.reward_kredi, 10) > parseInt(filterMaxReward, 10)) return false
    return true
  })

  const activeFilterCount = [filterType !== 'all', !!filterLocation, !!filterMaxReward].filter(Boolean).length

  const typeFilters = [
    { key: 'all', label: 'Tümü' },
    { key: 'skill_exchange', label: '⚡ Yetenek' },
    { key: 'courier_request', label: '📦 Kurye' },
    { key: 'courier_offer', label: '🛵 Teklif' },
  ]

  return (
    <div className="min-h-screen" bg-slate-50 pb-24 lg:pb-6>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <div>
          <p className="text-slate-400 text-xs">Hoş geldin 👋</p>
          <h1 className="text-xl font-bold text-slate-900">
            {user ? user.full_name : '...'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Bell size={18} className="text-slate-500" />
            {pendingEscrows.length + pendingReviews.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full
                               text-[9px] font-bold flex items-center justify-center px-1">
                {pendingEscrows.length + pendingReviews.length}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="lg:hidden w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="Çıkış Yap"
          >
            <LogOut size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Dijital Cüzdan */}
      <WalletCard
        wallet={wallet}
        user={user}
        onRefresh={refreshWallet}
        onTopup={() => setShowTopupModal(true)}
      />

      {/* Bekleyen Görevlerim */}
      {(() => {
        if (pendingEscrows.length === 0) return null
        return (
          <section className="mb-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-base" font-semibold text-slate-900 flex items-center gap-2>
                <Clock size={15} className="text-amber-400" />
                Bekleyen İşlemlerim
              </h2>
              <span className="text-xs text-slate-400\">{pendingEscrows.length} işlem</span>
            </div>
            <div className="px-4 space-y-2">
              {pendingEscrows.map(escrow => (
                <PendingTaskCard
                  key={escrow.id}
                  escrow={escrow}
                  currentUserId={user?.id}
                  onOpen={() => setSelectedEscrow(escrow)}
                />
              ))}
            </div>
          </section>
        )
      })()}

      {/* Aktif Ortak Sepetler */}
      <section className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-base" font-semibold text-slate-900>🛒 Aktif Ortak Sepetler</h2>
          <button className="flex items-center gap-0.5 text-brand-light text-xs font-medium">
            Tümü <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 px-4 scroll-x-hidden pb-1">
          {loading
            ? [1, 2].map(i => <div key={i} className="bg-white border border-slate-200 rounded-xl min-w-[160px] h-24 animate-pulse flex-shrink-0" />)
            : pools.map((pool) => (
              <PoolBar
                key={pool.id}
                pool={pool}
                onJoin={async () => { await refreshWallet() }}
              />
            ))
          }
          <div
            className="bg-white border-2 border-dashed border-slate-200 rounded-xl min-w-[160px] flex-shrink-0 flex flex-col items-center justify-center gap-2 p-4 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all active:scale-95"
            onClick={() => setShowCreatePool(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Plus size={20} className="text-brand-light" />
            </div>
            <p className="text-xs" text-slate-400 text-center leading-tight>
              Yeni Sepet Oluştur
            </p>
          </div>
        </div>
      </section>

      {/* Filtreler */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1 no-scrollbar">
        {typeFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
              ${filterType === key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700'
              }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowFilterSheet(true)}
          className={`relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition-all ml-auto
            ${activeFilterCount > 0 ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
        >
          <Filter size={13} className={activeFilterCount > 0 ? 'text-white' : 'text-slate-500'} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full
                             text-[9px] font-bold text-white flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* İlanlar Listesi */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">📍 Yakınımdaki İlanlar</h2>
          <span className="text-xs text-slate-400">{filteredTasks.length} ilan</span>
        </div>
        <div className="space-y-3">
          {loading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
            : filteredTasks.length === 0
              ? <p className="text-center text-slate-400 text-sm py-8">Henüz ilan yok.</p>
              : filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isOwnTask={task.creator_id === user?.id}
                  onAssign={async (t) => {
                    if (t.creator_id === user?.id) {
                      toast.warning('Kendi ilanınıza görev üstlenemezsiniz.')
                      return
                    }
                    try {
                      const res = await api.patch(`/tasks/${t.id}/assign`)

                      // Otomatik kurye ilanı → anlık ödeme, modal açma
                      if (res.data.auto_paid) {
                        await Promise.all([refreshWallet(), refreshEscrows(), refreshTasks()])
                        toast.success(res.data.message)
                        return
                      }

                      // Normal ilan → görevi listeden kaldır, bekleyen işlemlere yansıt
                      await Promise.all([refreshWallet(), refreshEscrows(), refreshTasks()])
                      toast.success('Görev kabul edildi! "Bekleyen İşlemlerim" bölümünden takip edebilirsiniz.')

                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Görev alınamadı.')
                    }
                  }}
                />
              ))
          }
        </div>
      </section>

      {/* Escrow Modal */}
      {selectedEscrow && (
        <EscrowModal
          escrow={selectedEscrow}
          currentUserId={user?.id}
          onApprove={async (id) => {
            try {
              const res = await api.post(`/escrow/${id}/approve`)
              const isBuyer = parseInt(selectedEscrow.buyer_id, 10) === parseInt(user?.id, 10)
              setSelectedEscrow(prev => ({
                ...prev,
                status: res.data.status,
                buyer_approved: res.data.status === 'released' ? true : (isBuyer ? true : prev.buyer_approved),
                seller_approved: res.data.status === 'released' ? true : (!isBuyer ? true : prev.seller_approved),
              }))
              await Promise.all([refreshWallet(), refreshEscrows(), refreshReviews()])
              // İşlem tamamlandıysa, puan verme modalını hemen aç
              if (res.data.status === 'released') {
                const myId = parseInt(user?.id, 10)
                const taskType = selectedEscrow.task_type
                let shouldRate = false
                let revieweeId, revieweeName
                if (taskType === 'courier_offer') {
                  // seller (creator) rates buyer (taker)
                  shouldRate = parseInt(selectedEscrow.seller_id, 10) === myId
                  revieweeId = selectedEscrow.buyer_id
                  revieweeName = selectedEscrow.buyer_name
                } else {
                  // buyer rates seller for skill_exchange + courier_request
                  shouldRate = parseInt(selectedEscrow.buyer_id, 10) === myId
                  revieweeId = selectedEscrow.seller_id
                  revieweeName = selectedEscrow.seller_name
                }
                if (shouldRate) {
                  setSelectedEscrow(null)
                  setSelectedReview({
                    escrow_id: id,
                    task_id: selectedEscrow.task_id,
                    task_title: selectedEscrow.task_title,
                    reviewee_id: revieweeId,
                    reviewee_name: revieweeName,
                  })
                }
              }
              toast.success(res.data.status === 'released' ? 'Ödeme tamamlandı! 🎉' : 'Onay gönderildi!')
            } catch (e) {
              toast.error(e.response?.data?.message || 'Onay gönderilemedi.')
            }
          }}
          onDispute={async (id) => {
            try {
              await api.post(`/escrow/${id}/dispute`)
              await refreshEscrows()
            } catch (e) { console.error(e) }
          }}
          onClose={() => setSelectedEscrow(null)}
        />
      )}

      {/* Create Pool Modal */}
      {showCreatePool && (
        <CreatePoolModal
          onClose={() => setShowCreatePool(false)}
          onCreated={refreshPools}
        />
      )}

      {/* Kredi Yükleme Modalı */}
      {showTopupModal && (
        <TopupModal
          onClose={() => setShowTopupModal(false)}
          onSuccess={refreshWallet}
        />
      )}

      {/* Bildirimler Paneli */}
      {showNotifications && (
        <NotificationsPanel
          escrows={pendingEscrows}
          pendingReviews={pendingReviews}
          currentUserId={user?.id}
          onSelect={(escrow) => {
            setSelectedEscrow(escrow)
            setShowNotifications(false)
          }}
          onSelectReview={(rev) => {
            setSelectedReview(rev)
            setShowNotifications(false)
          }}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Puan Verme Modalı */}
      {selectedReview && (
        <RatingModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onSubmitted={() => { setSelectedReview(null); refreshReviews() }}
        />
      )}

      {/* Filter Sheet */}
      {showFilterSheet && (
        <FilterSheet
          filterType={filterType}
          filterLocation={filterLocation}
          filterMaxReward={filterMaxReward}
          onApply={(type, loc, max) => {
            setFilterType(type)
            setFilterLocation(loc)
            setFilterMaxReward(max)
          }}
          onClose={() => setShowFilterSheet(false)}
        />
      )}

      <Navbar />
    </div>
  )
}
