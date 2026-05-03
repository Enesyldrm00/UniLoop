import { useState } from 'react'
import { Star, X, Loader, CheckCircle2 } from 'lucide-react'
import api from '../api/axios'
import { useToast } from './Toast'

export default function RatingModal({ review, onClose, onSubmitted }) {
  const toast                   = useToast()
  const [rating,   setRating]   = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [comment,  setComment]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  if (!review) return null

  const handleSubmit = async () => {
    if (rating === 0) { toast.warning('Lütfen bir puan seçin.'); return }
    setLoading(true)
    try {
      await api.post('/tasks/reviews', {
        task_id:     review.task_id,
        reviewee_id: review.reviewee_id,
        rating,
        comment: comment.trim() || undefined,
      })
      setDone(true)
      toast.success(`${review.reviewee_name} için ${rating} yıldız verildi! ⭐`)
      setTimeout(() => { onSubmitted?.(); onClose() }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Puan gönderilemedi.')
    } finally {
      setLoading(false)
    }
  }

  const STAR_LABELS = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel']
  const activeRating = hovered || rating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-card rounded-2xl p-6 shadow-lg animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg border border-white/15 hover:bg-white/5 transition-colors"
        >
          <X size={16} className="text-slate-400" />
        </button>

        {done ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle2 size={48} className="text-teal-400" />
            <p className="text-lg font-bold text-white">Puan Verildi!</p>
            <p className="text-sm text-slate-400">Teşekkürler 🎉</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">⭐</div>
              <h2 className="text-lg font-bold text-white">Deneyimini Puanla</h2>
              <p className="text-sm text-slate-300 mt-1">
                <span className="text-white font-semibold">{review.reviewee_name}</span> ile çalışman nasıldı?
              </p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{review.task_title}</p>
            </div>

            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={`transition-colors duration-150 ${
                      star <= activeRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className={`text-center text-sm font-semibold text-white/80 mb-4 transition-opacity duration-150 ${activeRating ? 'opacity-100' : 'opacity-0'}`}>
              {STAR_LABELS[activeRating]}
            </p>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Yorum <span className="text-slate-400 font-normal">(isteğe bağlı)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Deneyimini kısaca anlat..."
                rows={3}
                maxLength={300}
                className="input-field text-sm py-2.5 resize-none"
              />
              <p className="text-[10px] text-slate-300 mt-1 text-right">{comment.length}/300</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">
                Daha Sonra
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? <><Loader size={15} className="animate-spin" /> Gönderiliyor...</> : <><Star size={15} /> Puanla</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
