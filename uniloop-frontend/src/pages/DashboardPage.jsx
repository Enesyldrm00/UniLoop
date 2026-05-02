import { useState } from 'react'
import {
  Bell, Wallet, TrendingUp, ArrowUpRight,
  Plus, ChevronRight, Sparkles, Filter,
} from 'lucide-react'
import {
  mockUser, mockWallet, mockTasks, mockPools,
  mockEscrow, mockContacts,
} from '../mock/data'
import TaskCard   from '../components/TaskCard'
import PoolBar    from '../components/PoolBar'
import EscrowModal from '../components/EscrowModal'
import Navbar from '../components/Navbar'

// ── Wallet Card ─────────────────────────────────────────────
function WalletCard({ wallet, user }) {
  const [showBalance, setShowBalance] = useState(true)

  return (
    <div className="relative mx-4 mb-4 mt-2 rounded-3xl overflow-hidden
                    bg-wallet-gradient shadow-wallet animate-fade-up wallet-card">
      {/* Dekoratif daireler */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-12 -left-6 w-40 h-40 bg-black/10 rounded-full" />
      {/* Shimmer overlay */}
      <div className="absolute inset-0 shimmer-bg" />

      <div className="relative p-5">
        {/* Üst: Logo + Bildirim */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium">UniLoop Cüzdan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white/60 text-[10px]">Aktif</span>
          </div>
        </div>

        {/* Bakiye */}
        <div className="mb-5">
          <p className="text-white/50 text-xs mb-1">Mevcut Bakiye</p>
          <button
            onClick={() => setShowBalance((v) => !v)}
            className="flex items-end gap-2"
          >
            {showBalance ? (
              <span className="text-4xl font-extrabold text-white tracking-tight leading-none">
                {wallet.balance}
                <span className="text-2xl ml-1 font-bold opacity-70">K₺</span>
              </span>
            ) : (
              <span className="text-4xl font-extrabold text-white tracking-tight leading-none">
                ● ● ● ●
              </span>
            )}
          </button>
          <p className="text-white/40 text-xs mt-1.5">
            Toplam yüklenen: {wallet.total_topup_tl} TL
          </p>
        </div>

        {/* Alt: Kullanıcı + Hızlı İşlemler */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">{user.full_name}</p>
            <p className="text-white/50 text-[10px]">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center
                               justify-center transition-colors">
              <Plus size={16} className="text-white" />
            </button>
            <button className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center
                               justify-center transition-colors">
              <TrendingUp size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────
export default function DashboardPage() {
  const [selectedEscrow, setSelectedEscrow] = useState(null)
  const [filterType, setFilterType]         = useState('all')

  const filteredTasks = filterType === 'all'
    ? mockTasks
    : mockTasks.filter((t) => t.task_type === filterType)

  const typeFilters = [
    { key: 'all',            label: 'Tümü'     },
    { key: 'skill_exchange', label: '⚡ Yetenek' },
    { key: 'courier_request',label: '📦 Kurye'  },
    { key: 'courier_offer',  label: '🛵 Teklif' },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <div>
          <p className="text-white/40 text-xs">Hoş geldin 👋</p>
          <h1 className="text-xl font-bold text-white">{mockUser.full_name}</h1>
        </div>
        <button className="relative w-10 h-10 glass-card flex items-center justify-center">
          <Bell size={18} className="text-white/70" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full" />
        </button>
      </div>

      {/* Dijital Cüzdan */}
      <WalletCard wallet={mockWallet} user={mockUser} />

      {/* Aktif Ortak Sepetler */}
      <section className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="section-title">🛒 Aktif Ortak Sepetler</h2>
          <button className="flex items-center gap-0.5 text-brand-light text-xs font-medium">
            Tümü <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 px-4 scroll-x-hidden pb-1">
          {mockPools.map((pool) => (
            <PoolBar key={pool.id} pool={pool} onJoin={(p) => alert(`"${p.title}" havuzuna katılınıyor...`)} />
          ))}
          {/* Yeni havuz oluştur kartı */}
          <div className="glass-card min-w-[160px] flex-shrink-0 flex flex-col items-center
                          justify-center gap-2 p-4 cursor-pointer hover:bg-white/10
                          transition-all border-dashed border-white/10 active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Plus size={20} className="text-brand-light" />
            </div>
            <p className="text-xs text-white/40 text-center leading-tight">
              Yeni Sepet Oluştur
            </p>
          </div>
        </div>
      </section>

      {/* Filtreler */}
      <div className="flex gap-2 px-4 mb-3 scroll-x-hidden pb-1">
        {typeFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
              ${filterType === key
                ? 'bg-brand text-white shadow-brand'
                : 'glass-card text-white/50 hover:text-white/80'
              }`}
          >
            {label}
          </button>
        ))}
        <button className="flex-shrink-0 w-8 h-8 glass-card flex items-center justify-center ml-auto">
          <Filter size={13} className="text-white/50" />
        </button>
      </div>

      {/* İlanlar Listesi */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">📍 Yakınımdaki İlanlar</h2>
          <span className="text-xs text-white/30">{filteredTasks.length} ilan</span>
        </div>
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              contact={mockContacts}
              onAssign={(t) => {
                // Mock: Gerçekte API'ye istek gönderilir ve escrow açılır
                setSelectedEscrow({ ...mockEscrow, task_title: t.title, amount: t.effective_reward || t.reward_kredi })
              }}
            />
          ))}
        </div>
      </section>

      {/* Escrow Modal */}
      {selectedEscrow && (
        <EscrowModal
          escrow={selectedEscrow}
          currentUserId={mockUser.id}
          onApprove={async (id) => {
            console.log('Escrow onaylandı:', id)
            // await api.post(`/escrow/${id}/approve`)
          }}
          onDispute={async (id) => {
            console.log('Anlaşmazlık bildirildi:', id)
            // await api.post(`/escrow/${id}/dispute`)
          }}
          onClose={() => setSelectedEscrow(null)}
        />
      )}

      <Navbar />
    </div>
  )
}
