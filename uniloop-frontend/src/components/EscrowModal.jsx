import { useState } from 'react'
import { ShieldCheck, Lock, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react'

/*
  EscrowModal Props:
    escrow        — mockEscrow verisi
    currentUserId — giriş yapan kullanıcının id'si
    onApprove     — (escrowId) => void
    onDispute     — (escrowId) => void
    onClose       — () => void
*/
export default function EscrowModal({ escrow, currentUserId, onApprove, onDispute, onClose }) {
  const [loading, setLoading]   = useState(false)
  const [disputed, setDisputed] = useState(false)

  if (!escrow) return null

  const isBuyer  = parseInt(currentUserId, 10) === parseInt(escrow.buyer_id,  10)
  const isSeller = parseInt(currentUserId, 10) === parseInt(escrow.seller_id, 10)

  const myApproved    = isBuyer ? escrow.buyer_approved : isSeller ? escrow.seller_approved : false
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
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
      />

      {/* Modal Kartı */}
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg animate-slide-up">
        {/* Kapat */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                     rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <X size={16} className="text-slate-400" />
        </button>

        {/* İkon */}
        <div className="flex justify-center mb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                          ${isReleased || bothApproved
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-slate-100 border border-slate-200'
                          }`}>
            {isReleased || bothApproved ? (
              <CheckCircle2 size={32} className="text-emerald-600" />
            ) : (
              <Lock size={32} className="text-slate-600" />
            )}
          </div>
        </div>

        {/* Başlık */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Güvenli Ödeme — Escrow
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">
            {escrow.task_title}
          </h2>
          <p className="text-2xl font-extrabold text-emerald-600">
            {escrow.amount} KP
          </p>
          <p className="text-xs text-slate-400 mt-1">emanet hesapta kilitli</p>
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

        {/* Bilgi notu */}
        {!isReleased && !bothApproved && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-5">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Her iki taraf da onayladığında{' '}
              <span className="text-emerald-600 font-semibold">{escrow.amount} KP</span>{' '}
              otomatik olarak satıcıya aktarılır.
            </p>
          </div>
        )}

        {/* Butonlar */}
        {isReleased ? (
          <div className="text-center py-2">
            <CheckCircle2 size={20} className="text-emerald-600 mx-auto mb-1" />
            <p className="text-sm font-semibold text-emerald-600">Ödeme Tamamlandı!</p>
          </div>
        ) : disputed ? (
          <div className="text-center py-2">
            <p className="text-sm text-amber-600 font-semibold">Anlaşmazlık bildirildi.</p>
            <p className="text-xs text-slate-400 mt-1">Moderatör incelemesi başlatıldı.</p>
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
              <div className="flex items-center justify-center gap-2 py-3 text-slate-400">
                <Clock size={15} className="animate-pulse-soft" />
                <span className="text-sm">
                  {otherApproved ? 'Her ikisi de onayladı...' : 'Diğer tarafın onayı bekleniyor'}
                </span>
              </div>
            )}

            <button
              onClick={handleDispute}
              className="w-full text-center text-xs text-slate-300 hover:text-amber-500
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
                       ? 'bg-emerald-50 border-emerald-200'
                       : 'bg-slate-50 border-slate-200'
                     }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                       ${approved ? 'bg-emerald-100' : 'bg-slate-100'}`}>
        {approved
          ? <CheckCircle2 size={16} className="text-emerald-600" />
          : <Clock size={16} className="text-slate-400 animate-pulse-soft" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
          {isMe && (
            <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Sen
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400">{role}</p>
      </div>
      <span className={`text-xs font-semibold flex-shrink-0 ${approved ? 'text-emerald-600' : 'text-slate-300'}`}>
        {approved ? 'Onayladı ✓' : 'Bekliyor…'}
      </span>
    </div>
  )
}
