import { Bell, CheckCircle2, Clock, X, ShieldCheck, Star } from 'lucide-react'

/*
  Props:
    escrows       — getPendingEscrows'dan gelen dizi (onay bekleyenler)
    pendingReviews— getReviewPending'den gelen dizi  (puan bekleyenler)
    currentUserId — giriş yapan kişinin id'si
    onSelect      — (escrow) => void  → EscrowModal'ı aç
    onSelectReview— (review) => void  → RatingModal'ı aç
    onClose       — () => void
*/
export default function NotificationsPanel({
  escrows = [],
  pendingReviews = [],
  currentUserId,
  onSelect,
  onSelectReview,
  onClose,
}) {
  const total = escrows.length + pendingReviews.length

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Arka plan overlay - hafif karartma */}
      <div className="absolute inset-0 bg-slate-900/20" />
      <div
        className="relative w-full max-w-sm h-full bg-white border-l border-slate-200 shadow-lg
                   overflow-y-auto animate-slide-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bildirimler</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {total > 0 ? `${total} bekleyen bildirim` : 'Bildirim yok'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-4 space-y-3">
          {total === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔔</div>
              <p className="text-slate-400 text-sm">Henüz bildirim yok</p>
            </div>
          ) : (
            <>
              {/* Puan Bildirimleri */}
              {pendingReviews.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest px-1">
                    ⭐ Puan Bekliyor
                  </p>
                  {pendingReviews.map((rev) => (
                    <ReviewCard
                      key={rev.escrow_id}
                      review={rev}
                      onSelect={onSelectReview}
                    />
                  ))}
                  {escrows.length > 0 && (
                    <div className="border-t border-slate-100 pt-1" />
                  )}
                </>
              )}

              {/* Escrow Onay Bildirimleri */}
              {escrows.length > 0 && (
                <>
                  {pendingReviews.length > 0 && (
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">
                      🔒 Onay Bekliyor
                    </p>
                  )}
                  {escrows.map((escrow) => (
                    <NotifCard
                      key={escrow.id}
                      escrow={escrow}
                      currentUserId={currentUserId}
                      onSelect={onSelect}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Puan bildirim kartı ──────────────────────────────────── */
function ReviewCard({ review, onSelect }) {
  return (
    <button
      onClick={() => onSelect(review)}
      className="w-full text-left bg-white border border-amber-200 rounded-xl p-4
                 hover:bg-amber-50 hover:border-amber-300 hover:-translate-y-0.5 hover:shadow-sm
                 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 border border-amber-200">
          <Star size={18} className="text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{review.task_title}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            Değerlendir: <span className="text-amber-600 font-medium">{review.reviewee_name}</span>
          </p>
          <p className="text-xs font-semibold mt-1.5 text-amber-600">
            ⭐ Puan vermek için tıkla
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        </div>
      </div>
    </button>
  )
}

/* ── Escrow onay kartı ───────────────────────────────────── */
function NotifCard({ escrow, currentUserId, onSelect }) {
  const isBuyer  = parseInt(currentUserId, 10) === parseInt(escrow.buyer_id,  10)
  const isSeller = parseInt(currentUserId, 10) === parseInt(escrow.seller_id, 10)

  const myApproved    = isBuyer ? escrow.buyer_approved : escrow.seller_approved
  const needsMyAction = !myApproved

  let statusText  = ''
  let statusColor = 'text-slate-400'
  if (escrow.status === 'released') {
    statusText  = '✅ Ödeme tamamlandı'
    statusColor = 'text-emerald-600'
  } else if (escrow.status === 'disputed') {
    statusText  = '⚠️ Anlaşmazlık bildirildi'
    statusColor = 'text-amber-600'
  } else if (myApproved) {
    statusText  = '⏳ Diğer tarafın onayı bekleniyor'
    statusColor = 'text-slate-400'
  } else if (isBuyer) {
    statusText  = '🔔 İlanınız üstlenildi — onayınız bekleniyor'
    statusColor = 'text-slate-700'
  } else {
    statusText  = '🔔 Görevi teslim et ve onayla'
    statusColor = 'text-slate-700'
  }

  return (
    <button
      onClick={() => onSelect(escrow)}
      className={`w-full text-left bg-white rounded-xl p-4 border transition-all duration-200
                  active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-sm
                  ${needsMyAction
                    ? 'border-slate-900/20 hover:border-slate-900/30 hover:bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                         ${needsMyAction ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <ShieldCheck size={18} className={needsMyAction ? 'text-white' : 'text-slate-400'} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{escrow.task_title}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {isBuyer
              ? `Görevi yapan: ${escrow.seller_name}`
              : `İlan sahibi: ${escrow.buyer_name}`}
          </p>
          <p className={`text-xs font-medium mt-1.5 ${statusColor}`}>{statusText}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-bold text-emerald-600">{escrow.amount} KP</p>
          {needsMyAction && (
            <span className="inline-block mt-1 w-2 h-2 bg-slate-900 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    </button>
  )
}
