import { useState, useEffect } from 'react'
import {
  Plus, Filter, X, Loader, Search,
  Zap, Package, Navigation, MapPin,
  ChevronDown, SlidersHorizontal,
} from 'lucide-react'
import api from '../api/axios'
import TaskCard      from '../components/TaskCard'
import Navbar        from '../components/Navbar'
import { useToast } from '../components/Toast'

// ── Sabitler ────────────────────────────────────────────────
const LOCATIONS = [
  { value: 'muhendislik',   label: 'Mühendislik'   },
  { value: 'merkez_kantin', label: 'Merkez Kantin'  },
  { value: 'yabanci_dil',   label: 'Yabancı Dil'   },
  { value: 'sosyal_yasam',  label: 'Sosyal Yaşam'  },
  { value: 'kutuphane',     label: 'Kütüphane'     },
]

const TASK_TYPES = [
  { value: 'skill_exchange',  label: '⚡ Yetenek Takası', icon: Zap       },
  { value: 'courier_request', label: '📦 Kurye Talebi',   icon: Package   },
  { value: 'courier_offer',   label: '🛵 Kurye Teklifi',  icon: Navigation },
]

// ── İlan Oluşturma Modalı (Multi-Step) ──────────────────────
const TASK_TYPE_DETAILS = [
  {
    value:    'skill_exchange',
    emoji:    '⚡',
    label:    'Yetenek Takası',
    subtitle: 'Yeteneğini sun, KP kazan',
    desc:     'Özel ders, essay düzeltme, tasarım, yazılım yardımı gibi beceri gerektiren hizmetler.',
    flow:     'Sen Kazanıyorsun',
    flowDesc: 'Bu ilanı kabul eden kişi KP öder, sen kazanırsın.',
    flowIcon: '🎯',
    flowColor:'text-emerald-300',
    flowBg:   'bg-emerald-500/10 border-emerald-500/20',
    btnColor: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  },
  {
    value:    'courier_request',
    emoji:    '📦',
    label:    'Kurye Talebi',
    subtitle: 'Birine bir şey taşıt',
    desc:     'Kantinden yemek, kırtasiyeden baskı, kütüphaneden kitap gibi getir-götür işleri.',
    flow:     'Yaparak Kazan',
    flowDesc: 'Bu ilanı alan kurye işi yapar, sen KP ödersin.',
    flowIcon: '💰',
    flowColor:'text-brand-light',
    flowBg:   'bg-brand/10 border-brand/20',
    btnColor: 'bg-brand/20 border-brand/40 text-brand-light',
  },
  {
    value:    'courier_offer',
    emoji:    '🛵',
    label:    'Kurye Teklifi',
    subtitle: 'Ben kurye olabilirim',
    desc:     'Zaten gidiyorsun, yolda bir şey taşıyabilirsin. Kabul eden sana KP öder.',
    flow:     'Sen Ödüyorsun',
    flowDesc: 'Bu ilanı kabul eden kişi bakiyesinden KP öder, sen kazanırsın.',
    flowIcon: '🎯',
    flowColor:'text-amber-300',
    flowBg:   'bg-amber-500/10 border-amber-500/20',
    btnColor: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  },
]

function CreateTaskModal({ onClose, onCreated }) {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState({
    title: '', description: '', task_type: '', reward_kredi: '',
    location: '', from_location: '', to_location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const selectedType   = TASK_TYPE_DETAILS.find(t => t.value === form.task_type)
  const isCourierOffer = form.task_type === 'courier_offer'

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/tasks', {
        title:         form.title,
        description:   form.description   || undefined,
        task_type:     form.task_type,
        reward_kredi:  parseInt(form.reward_kredi, 10),
        location:      isCourierOffer ? undefined : (form.location || undefined),
        from_location: isCourierOffer ? form.from_location : undefined,
        to_location:   isCourierOffer ? form.to_location   : undefined,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'İlan oluşturulamadı.')
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-card rounded-3xl p-6 pb-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-2 mb-6">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand' : 'bg-white/10'}`} />
          ))}
          <button onClick={onClose} className="ml-2 w-8 h-8 glass-card flex items-center justify-center hover:bg-white/10 flex-shrink-0">
            <X size={15} className="text-white/50" />
          </button>
        </div>

        {/* Adım 1 */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="text-center mb-6">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Adım 1 / 3</p>
              <h2 className="text-lg font-bold">Ne tür bir ilan vereceksin?</h2>
              <p className="text-xs text-white/40 mt-1">Türü seçince para akışını açıklayacağım</p>
            </div>
            {TASK_TYPE_DETAILS.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => { setForm(f => ({ ...f, task_type: type.value })); setStep(2) }}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${form.task_type === type.value ? type.btnColor : 'glass-card hover:border-white/20'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{type.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{type.label}</p>
                    <p className="text-xs text-white/50 mt-0.5">{type.subtitle}</p>
                    <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed">{type.desc}</p>
                    <div className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-medium ${type.flowBg} ${type.flowColor}`}>
                      <span>{type.flowIcon}</span>
                      <span>{type.flow}</span>
                    </div>
                  </div>
                  <div className="text-white/20 text-lg mt-1">›</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Adım 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Adım 2 / 3</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">{selectedType?.emoji}</span>
                <h2 className="text-lg font-bold">{selectedType?.label}</h2>
              </div>
            </div>

            <div className={`flex items-start gap-3 p-3 rounded-xl border ${selectedType?.flowBg}`}>
              <span className="text-lg">{selectedType?.flowIcon}</span>
              <div>
                <p className={`text-xs font-semibold ${selectedType?.flowColor}`}>{selectedType?.flow}</p>
                <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{selectedType?.flowDesc}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Başlık <span className="text-red-400">*</span></label>
              <input
                value={form.title}
                onChange={set('title')}
                placeholder={isCourierOffer ? 'Örn: Mühendislik → Kantin geçiyorum' : 'Örn: Python ödev yardımı lazım'}
                className="input-field text-sm py-3"
                maxLength={80}
              />
              <p className="text-[10px] text-white/25 mt-1 text-right">{form.title.length}/80</p>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Açıklama</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Detayları buraya yaz... (isteğe bağlı)"
                rows={3}
                className="input-field text-sm py-3 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                {isCourierOffer ? 'Alacağın Ücret (KP)' : 'Ödül Miktarı (KP)'}
                <span className="text-red-400"> *</span>
              </label>
              <div className="relative">
                <input
                  type="number" min="1" max="9999"
                  value={form.reward_kredi}
                  onChange={set('reward_kredi')}
                  placeholder="50"
                  className="input-field text-sm py-3 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-kredit">KP</span>
              </div>
              {form.reward_kredi > 0 && (
                <p className={`text-[11px] mt-1 ${selectedType?.flowColor}`}>
                  {form.task_type === 'courier_request'
                    ? `✓ Görevi yapan ${form.reward_kredi} KP kazanır, sen ödersin`
                    : `✓ Kabul eden kişi ${form.reward_kredi} KP öder, sen kazanırsın`}
                </p>
              )}
            </div>

            {isCourierOffer ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Kalkış <span className="text-red-400">*</span></label>
                  <select value={form.from_location} onChange={set('from_location')} className="input-field text-sm py-3 bg-dark-card">
                    <option value="">Seçin...</option>
                    {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Varış <span className="text-red-400">*</span></label>
                  <select value={form.to_location} onChange={set('to_location')} className="input-field text-sm py-3 bg-dark-card">
                    <option value="">Seçin...</option>
                    {LOCATIONS.filter(l => l.value !== form.from_location).map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Lokasyon</label>
                <select value={form.location} onChange={set('location')} className="input-field text-sm py-3 bg-dark-card">
                  <option value="">📍 Tüm Kampüs</option>
                  {LOCATIONS.map(l => <option key={l.value} value={l.value}>📍 {l.label}</option>)}
                </select>
              </div>
            )}

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setStep(1); setError('') }} className="btn-secondary flex-1 py-3 text-sm">
                ← Geri
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  if (!form.title.trim()) return setError('Başlık zorunludur.')
                  if (!form.reward_kredi || parseInt(form.reward_kredi) < 1) return setError('Ödül miktarı en az 1 KP olmalı.')
                  if (isCourierOffer && (!form.from_location || !form.to_location)) return setError('Kalkış ve varış noktası zorunludur.')
                  setStep(3)
                }}
                className="btn-primary flex-1 py-3 text-sm"
              >
                Önizle →
              </button>
            </div>
          </div>
        )}

        {/* Adım 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Adım 3 / 3</p>
              <h2 className="text-lg font-bold">İlanı Onayla</h2>
              <p className="text-xs text-white/40 mt-1">Her şey doğru mu?</p>
            </div>

            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedType?.emoji}</span>
                <div>
                  <p className="text-[10px] text-white/40">{selectedType?.label}</p>
                  <p className="font-semibold text-white text-sm">{form.title}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className={`text-[9px] uppercase ${selectedType?.flowColor}`}>{selectedType?.flow}</p>
                  <p className="text-lg font-bold text-kredit">{form.reward_kredi} KP</p>
                </div>
              </div>
              {form.description && (
                <p className="text-xs text-white/50 leading-relaxed border-t border-white/[0.06] pt-3">{form.description}</p>
              )}
              <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                {isCourierOffer ? (
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">
                    📍 {LOCATIONS.find(l => l.value === form.from_location)?.label} → {LOCATIONS.find(l => l.value === form.to_location)?.label}
                  </span>
                ) : form.location ? (
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-1 rounded-lg">
                    📍 {LOCATIONS.find(l => l.value === form.location)?.label}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/30 px-2 py-1">📍 Tüm Kampüs</span>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedType?.flowBg}`}>
              <span className="text-xl">{selectedType?.flowIcon}</span>
              <p className={`text-xs leading-relaxed ${selectedType?.flowColor}`}>
                {form.task_type === 'courier_request'
                  ? `Görevi yapan kişi ${form.reward_kredi} KP kazanır → sen ${form.reward_kredi} KP ödersin`
                  : `Bu ilanı kabul eden ${form.reward_kredi} KP öder → sen ${form.reward_kredi} KP kazanırsın`}
              </p>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3 text-sm" disabled={loading}>
                ← Düzenle
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
              >
                {loading ? <><Loader size={15} className="animate-spin" /> Yayınlanıyor...</> : '🚀 Yayınla!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// ── Filtre Paneli ────────────────────────────────────────────
function FilterPanel({ filters, onChange, onClose }) {
  const [local, setLocal] = useState(filters)
  const set = (field) => (val) => setLocal(f => ({ ...f, [field]: val === f[field] ? '' : val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-card rounded-3xl p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-semibold">🔍 Filtrele</p>
          <button onClick={onClose} className="w-8 h-8 glass-card flex items-center justify-center">
            <X size={15} className="text-white/50" />
          </button>
        </div>

        {/* İlan Türü */}
        <div className="mb-4">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">İlan Türü</label>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('type')(value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                  ${local.type === value
                    ? 'bg-brand/20 border-brand/40 text-brand-light'
                    : 'glass-card text-white/50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lokasyon */}
        <div className="mb-6">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Lokasyon</label>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('location')(value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                  ${local.location === value
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'glass-card text-white/50'
                  }`}
              >
                📍 {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { onChange({ type: '', location: '' }); onClose() }}
            className="btn-secondary flex-1 py-3 text-sm"
          >
            Temizle
          </button>
          <button
            onClick={() => { onChange(local); onClose() }}
            className="btn-primary flex-1 py-3 text-sm"
          >
            Uygula
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card p-4 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="w-9 h-9 bg-white/10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-2.5 bg-white/5 rounded w-1/3" />
        </div>
        <div className="h-5 w-14 bg-white/10 rounded" />
      </div>
      <div className="h-3 bg-white/10 rounded w-3/4" />
      <div className="h-2.5 bg-white/5 rounded" />
      <div className="h-2.5 bg-white/5 rounded w-2/3" />
      <div className="h-10 bg-white/5 rounded-xl" />
    </div>
  )
}

// ── Ana Sayfa ────────────────────────────────────────────────
export default function TasksPage() {
  const toast = useToast()
  const [tasks,          setTasks]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [myId,           setMyId]           = useState(null)
  const [showCreate,     setShowCreate]     = useState(false)
  const [showFilter,     setShowFilter]     = useState(false)
  const [filters,        setFilters]        = useState({ type: '', location: '' })
  const [searchText,     setSearchText]     = useState('')

  const fetchTasks = async (f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'open' })
      if (f.type)     params.set('type',     f.type)
      if (f.location) params.set('location', f.location)
      const res = await api.get(`/tasks?${params}`)
      setTasks(res.data.tasks || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get('/wallet/me').then(res => setMyId(parseInt(res.data.user?.id, 10))).catch(() => {})
    fetchTasks()
  }, [])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchTasks(newFilters)
  }

  const handleTaskAssign = async (task) => {
    if (parseInt(task.creator_id, 10) === myId) {
      toast.warning('Kendi ilanınıza katılamazsınız.')
      return
    }

    try {
      await api.patch(`/tasks/${task.id}/assign`)
      setTasks(prev => prev.filter(t => t.id !== task.id))

      try {
        const walletRes = await api.get('/wallet/me')
        const newBalance = walletRes.data.wallet?.balance
        const isBuyer = task.task_type === 'courier_request' ? false : true
        if (newBalance !== undefined) {
          const msg = isBuyer
            ? `Görev alındı! ${task.reward_kredi} KP bakiyenden escrow'a kilitlendi.\nGüncel bakiye: ${newBalance} KP`
            : `Görev kabul edildi! ${task.reward_kredi} KP escrow'a kilitlendi.\nGüncel bakiye: ${newBalance} KP`
          toast.success(msg)
        } else {
          toast.success('Görev başarıyla alındı!')
        }
      } catch {
        toast.success('Görev başarıyla alındı!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'İşlem gerçekleştirilemedi.')
    }
  }

  const displayed = tasks.filter(t =>
    !searchText ||
    t.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.creator_name?.toLowerCase().includes(searchText.toLowerCase())
  )

  const activeFilterCount = [filters.type, filters.location].filter(Boolean).length

  return (
    <div className="page-container">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">İlanlar</h1>
            <p className="text-xs text-white/40 mt-0.5">{displayed.length} ilan bulundu</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <Plus size={16} />
            <span>İlan Ver</span>
          </button>
        </div>

        {/* Arama */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="İlan veya kişi ara..."
            className="input-field text-sm py-2.5 pl-9"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={14} className="text-white/40" />
            </button>
          )}
        </div>

        {/* Filtre / Sıralama Çubuğu */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2 flex-1 overflow-x-auto scroll-x-hidden pb-1">
            {/* Tür filtreleri */}
            <button
              onClick={() => handleFilterChange({ ...filters, type: '' })}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                ${!filters.type ? 'bg-brand/20 border-brand/40 text-brand-light' : 'glass-card text-white/40'}`}
            >
              Tümü
            </button>
            {TASK_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange({ ...filters, type: filters.type === value ? '' : value })}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                  ${filters.type === value ? 'bg-brand/20 border-brand/40 text-brand-light' : 'glass-card text-white/40'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Gelişmiş filtre */}
          <button
            onClick={() => setShowFilter(true)}
            className={`relative flex-shrink-0 w-9 h-9 glass-card flex items-center justify-center transition-colors
              ${activeFilterCount > 0 ? 'border-brand/40 text-brand-light' : 'text-white/50'}`}
          >
            <SlidersHorizontal size={15} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* İlan Listesi */}
      <div className="px-4 space-y-3">
        {loading
          ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
          : displayed.length === 0
            ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-white/30 text-sm">
                  {searchText || filters.type || filters.location
                    ? 'Bu filtreye uyan ilan bulunamadı.'
                    : 'Henüz hiç ilan yok.'}
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="btn-primary mt-4 px-6 py-2.5 text-sm inline-flex items-center gap-2"
                >
                  <Plus size={14} />
                  İlk İlanı Sen Ver
                </button>
              </div>
            )
            : displayed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isOwnTask={parseInt(task.creator_id, 10) === myId}
                onAssign={handleTaskAssign}
              />
            ))
        }
        <div className="h-4" />
      </div>

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={() => fetchTasks()}
        />
      )}

      {showFilter && (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onClose={() => setShowFilter(false)}
        />
      )}

      <Navbar />
    </div>
  )
}
