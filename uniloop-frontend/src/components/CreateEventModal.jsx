import { useState } from 'react'
import { Calendar, Users, Award, X, Loader } from 'lucide-react'
import api from '../api/axios'

export default function CreateEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    max_participants: '',
    reward_per_participant: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const totalBudget = (parseInt(form.max_participants) || 0) * (parseInt(form.reward_per_participant) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/events', {
        title: form.title,
        description: form.description,
        max_participants: parseInt(form.max_participants),
        reward_per_participant: parseInt(form.reward_per_participant)
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Etkinlik oluşturulamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-lg glass-card rounded-3xl p-6 shadow-2xl animate-fade-up border border-fuchsia-500/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
              <Calendar size={20} className="text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Yeni Etkinlik Oluştur</h2>
              <p className="text-xs text-slate-400">Topluluğunuz için bütçeli bir etkinlik başlatın</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#3b4b6e]/20 flex items-center justify-center hover:bg-[#3b4b6e]/40 transition-colors">
            <X size={16} className="text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Etkinlik Başlığı <span className="text-red-400">*</span></label>
            <input
              required
              maxLength={80}
              value={form.title}
              onChange={set('title')}
              placeholder="Örn: Hafta Sonu Kodlama Kampı"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Açıklama</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Etkinliğin detayları, nerede yapılacağı vs."
              rows={3}
              className="input-field text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                <Users size={12} /> Kapasite (Kişi) <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="number"
                min="1"
                max="500"
                value={form.max_participants}
                onChange={set('max_participants')}
                placeholder="10"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                <Award size={12} /> Kişi Başı Ödül (KP) <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="number"
                min="1"
                max="1000"
                value={form.reward_per_participant}
                onChange={set('reward_per_participant')}
                placeholder="100"
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl p-4 flex justify-between items-center mt-2">
            <div>
              <p className="text-xs text-fuchsia-300/70">Cüzdanınızdan Kilitlenecek Bütçe</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Etkinlik dolmazsa kalan miktar iade edilir.</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-fuchsia-400">{totalBudget}</span>
              <span className="text-xs font-medium text-fuchsia-400/70 ml-1">KP</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

          <button 
            type="submit" 
            disabled={loading || totalBudget <= 0}
            className="w-full btn-primary bg-fuchsia-600 hover:bg-fuchsia-500 border-fuchsia-500 py-3 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Calendar size={16} />}
            <span>{loading ? 'Oluşturuluyor...' : 'Bütçeyi Kilitle & Etkinliği Oluştur'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
