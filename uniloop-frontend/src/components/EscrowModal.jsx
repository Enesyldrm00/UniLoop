import { useState } from 'react'
import { ShieldCheck, Lock, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react'

/*
  EscrowModal Props:
    escrow    — mockEscrow verisi
    currentUserId — giriş yapan kullanıcının id'si
    onApprove — (escrowId) => void
    onDispute — (escrowId) => void
    onClose   — () => void
*/
export default function EscrowModal({ escrow, currentUserId, onApprove, onDispute, onClose }) {
  const [loading, setLoading]   = useState(false)
  const [disputed, setDisputed] = useState(false)

  if (!escrow) return null

  const isBuyer  = currentUserId === escrow.buyer_id
  const isSeller = currentUserId === escrow.seller_id

  const myApproved = isBuyer ? escrow.buyer_approved : isSeller ? escrow.seller_approved : false
  const otherApproved = isBuyer ? escrow.seller_approved : escrow.buyer_approved

  const bothApproved = escrow.buyer_approved && escrow.seller_approved
  const isReleased   = escrow.status === 'released'

  const handleApprove = async () => {
    setLoading(true)
    await onApprove?.(escrow.id)
    setLoading(false)
  }

  const handleDispute = async () => {
    setDisputed(true)
    await onDispute?.(escrow.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Kartı */}
      <div className="relative w-full max-w-sm glass-card p-6 animate-slide-up">
        {/* Kapat */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                     rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-white/60" />
        </button>

        {/* İkon */}
        <div className="flex justify-center mb-5">
          <div className={`relative w-20 h-20 rounded-3xl flex items-center justify-center
                          ${isReleased
                            ? 'bg-kredit/20'
                            : bothApproved
                              ? 'bg-kredit/20'
                              : 'bg-brand/20'
                          }`}>
            {isReleased || bothApproved ? (
              <CheckCircle2 size={40} className="text-kredit" />
            ) : (
              <Lock size={40} className="text-brand-light" />
            )}
            {/* Pulse ring */}
            <span className={`absolute inset-0 rounded-3xl animate-ping opacity-20
                              ${isReleased ? 'bg-kredit' : 'bg-brand'}`} />
          </div>
        </div>

        {/* Başlık */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck size={14} className="text-brand-light" />
            <span className="text-xs text-brand-light font-medium uppercase tracking-wider">
              Güvenli Ödeme — Escrow
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mb-1 line-clamp-2">
            {escrow.task_title}
          </h2>
          <p className="text-2xl font-extrabold text-kredit">
            {escrow.amount} K₺
          </p>
          <p className="text-xs text-white/40 mt-1">emanet hesapta kilitli</p>
        </div>

        {/* Onay Durumları */}
        <div className="space-y-2.5 mb-6">
          <ApprovalRow
            label={escrow.buyer_name}
            role="Alıcı (Hizmet Alan)"
            approved={escrow.buyer_approved}
            isMe={isBuyer}
          />
          <ApprovalRow
            label={escrow.seller_name}
            role="Satıcı (Hizmeti Veren)"
            approved={escrow.seller_approved}
            isMe={isSeller}
          />
        </div>

        {/* Para Nasıl Serbest Kalır? */}
        {!isReleased && !bothApproved && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-5">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              Her iki taraf da onayladığında <span className="text-kredit font-medium">{escrow.amount} K₺</span> otomatik
              olarak satıcıya aktarılır.
            </p>
          </div>
        )}

        {/* Butonlar */}
        {isReleased ? (
          <div className="text-center py-2">
            <CheckCircle2 size={20} className="text-kredit mx-auto mb-1" />
            <p className="text-sm font-semibold text-kredit">Ödeme Tamamlandı!</p>
          </div>
        ) : disputed ? (
          <div className="text-center py-2">
            <p className="text-sm text-amber-400 font-medium">Anlaşmazlık bildirildi.</p>
            <p className="text-xs text-white/40 mt-1">Moderatör incelemesi başlatıldı.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {!myApproved && (isBuyer || isSeller) && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <span className="animate-pulse">İşleniyor...</span>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    <span>
                      {isBuyer
                        ? 'İşi Teslim Aldım — Onayla'
                        : 'İşi Teslim Ettim — Onayla'}
                    </span>
                  </>
                )}
              </button>
            )}

            {myApproved && !bothApproved && (
              <div className="flex items-center justify-center gap-2 py-3 text-white/50">
                <Clock size={15} className="animate-pulse-soft" />
                <span className="text-sm">
                  {otherApproved ? 'Her ikisi de onayladı...' : 'Diğer tarafın onayı bekleniyor'}
                </span>
              </div>
            )}

            <button
              onClick={handleDispute}
              className="w-full text-center text-xs text-white/30 hover:text-amber-400
                         transition-colors py-1"
            >
              Sorun mu var? Anlaşmazlık bildir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ApprovalRow({ label, role, approved, isMe }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                     ${approved
                       ? 'bg-kredit/10 border-kredit/20'
                       : 'bg-white/[0.03] border-white/[0.06]'
                     }`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                       ${approved ? 'bg-kredit/20' : 'bg-white/10'}`}>
        {approved
          ? <CheckCircle2 size={16} className="text-kredit" />
          : <Clock size={16} className="text-white/40 animate-pulse-soft" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-white truncate">{label}</p>
          {isMe && (
            <span className="text-[9px] bg-brand/20 text-brand-light border border-brand/30
                             px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
              Sen
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/40">{role}</p>
      </div>
      <span className={`text-xs font-semibold flex-shrink-0 ${approved ? 'text-kredit' : 'text-white/30'}`}>
        {approved ? 'Onayladı ✓' : 'Bekliyor…'}
      </span>
    </div>
  )
}
