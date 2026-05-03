import { Users, Calendar, Award, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function EventCard({ event, currentUserId, onJoin }) {
  const isCreator = event.creator_id === currentUserId
  const isJoined = event.is_joined
  const isFull = event.status === 'full'

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* Fuşya gradient arka plan parlaması */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl -mr-10 -mt-10 pointer-events-none" />

      <div className="relative">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
              <Calendar size={16} className="text-fuchsia-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">{event.creator_name}</p>
              <h3 className="text-sm font-semibold text-white leading-tight">{event.title}</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded-lg border border-fuchsia-500/20">
              {event.reward_per_participant} KP / Kişi
            </span>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-slate-300 mb-4 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users size={14} className="text-fuchsia-400" />
            <span>
              <strong className="text-white">{event.current_participants}</strong> / {event.max_participants} Katılımcı
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Award size={14} className="text-emerald-400" />
            <span>Toplam Bütçe: {event.total_locked_amount} KP</span>
          </div>
        </div>

        {/* Aksiyon Alanı */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-white/40">
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: tr })} eklendi
          </span>
          
          {isCreator ? (
            <span className="text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5">
              Sizin Etkinliğiniz
            </span>
          ) : isJoined ? (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle size={14} /> Katıldınız
            </span>
          ) : isFull ? (
            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              Kontenjan Dolu
            </span>
          ) : (
            <button
              onClick={() => onJoin(event)}
              className="btn-primary py-2 px-6 bg-fuchsia-600 hover:bg-fuchsia-500 border-fuchsia-500 text-xs shadow-fuchsia-500/20"
            >
              Etkinliğe Katıl
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
