import { useState } from 'react'
import { X, Zap, CreditCard, CheckCircle2, Loader, ShieldCheck } from 'lucide-react'
import api from '../api/axios'

const PACKAGES = [
  { tl: 50,  kredit: 50,  label: '50 KP',  popular: false },
  { tl: 100, kredit: 100, label: '100 KP', popular: true  },
  { tl: 250, kredit: 250, label: '250 KP', popular: false },
  { tl: 500, kredit: 500, label: '500 KP', popular: false },
]

export default function TopupModal({ onClose, onSuccess }) {
  const [selected,    setSelected]   = useState(PACKAGES[1])
  const [customTl,    setCustomTl]   = useState('')
  const [useCustom,   setUseCustom]  = useState(false)
  const [step,        setStep]       = useState(1)
  const [loading,     setLoading]    = useState(false)
  const [error,       setError]      = useState('')
  const [newBalance,  setNewBalance] = useState(null)

  const amount = useCustom ? (parseInt(customTl, 10) || 0) : selected.tl
  const kredit = amount

  const handleTopup = async () => {
    if (amount < 10) { setError("Minimum yükleme miktarı 10 KP'dir."); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/wallet/topup', { amount_tl: amount })
      setNewBalance(res.data.wallet?.balance)
      setStep(3)
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Yükleme başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30" />
      <div
        className="relative w-full sm:max-w-sm bg-white border border-slate-200 shadow-lg
                   rounded-b-none sm:rounded-2xl rounded-t-2xl p-6 pb-10 sm:pb-6 overflow-y-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">KP Yükle</p>
              <p className="text-[10px] text-slate-400">UniLoop Kredi Sistemi</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* ADIM 1 — Paket Seç */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <span className="text-emerald-700 font-semibold">1:1 Sabit Oran</span> — Şeffaf ve sabit oran, gizli ücret yok.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.tl}
                  type="button"
                  onClick={() => { setSelected(pkg); setUseCustom(false) }}
                  className={`relative p-3.5 rounded-xl border transition-all duration-200 text-left
                    ${!useCustom && selected.tl === pkg.tl
                      ? 'bg-slate-900 border-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-400 hover:-translate-y-0.5'
                    }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      POPÜLER
                    </span>
                  )}
                  <p className={`text-base font-extrabold ${!useCustom && selected.tl === pkg.tl ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.tl} KP
                  </p>
                  <p className={`font-bold text-sm ${!useCustom && selected.tl === pkg.tl ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {pkg.kredit} KP
                  </p>
                  <p className={`text-[9px] mt-1 ${!useCustom && selected.tl === pkg.tl ? 'text-slate-400' : 'text-slate-400'}`}>
                    1:1 oran
                  </p>
                </button>
              ))}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setUseCustom(v => !v)}
                className={`text-xs w-full text-center py-2.5 rounded-lg border transition-all
                  ${useCustom ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}
              >
                {useCustom ? '✓ Özel miktar seçildi' : '+ Özel miktar gir'}
              </button>

              {useCustom && (
                <div className="relative mt-2.5">
                  <input
                    type="number" min="10" max="9999"
                    placeholder="Miktar gir (min. 10)"
                    value={customTl}
                    onChange={(e) => setCustomTl(e.target.value)}
                    className="input-field text-sm py-3 pr-10"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">KP</span>
                </div>
              )}
            </div>

            {amount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-slate-500 font-medium">Yüklenecek</span>
                <span className="text-base font-extrabold text-emerald-600">{kredit} KP</span>
              </div>
            )}

            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <button
              onClick={() => {
                setError('')
                if (amount < 10) return setError("Minimum yükleme miktarı 10 KP'dir.")
                setStep(2)
              }}
              disabled={amount < 1}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <CreditCard size={16} />
              Ödemeye Geç — {amount} KP
            </button>
          </div>
        )}

        {/* ADIM 2 — Ödeme */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-slate-400 mb-1">Ödeme Özeti</p>
              <p className="text-2xl font-extrabold text-slate-900">{amount} KP</p>
              <p className="text-emerald-600 font-bold text-base">→ {kredit} KP yüklenecek</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block font-medium">Kart Numarası</label>
                <input defaultValue="4242 4242 4242 4242" className="input-field text-sm py-3 font-mono tracking-widest" readOnly />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block font-medium">Son Kullanma</label>
                  <input defaultValue="12/28" className="input-field text-sm py-3 font-mono text-center" readOnly />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block font-medium">CVV</label>
                  <input defaultValue="***" className="input-field text-sm py-3 font-mono text-center" readOnly />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <ShieldCheck size={13} className="text-slate-400 flex-shrink-0" />
              <p className="text-[10px] text-slate-400">Demo modda gerçek ödeme alınmaz. Hackathon gösterimi.</p>
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 text-sm" disabled={loading}>
                ← Geri
              </button>
              <button
                onClick={handleTopup}
                disabled={loading}
                className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
              >
                {loading ? <><Loader size={15} className="animate-spin" /> İşleniyor...</> : <><CreditCard size={15} /> Onayla</>}
              </button>
            </div>
          </div>
        )}

        {/* ADIM 3 — Başarı */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Yükleme Başarılı! 🎉</h2>
            <p className="text-emerald-600 text-2xl font-bold my-3">{kredit} KP</p>
            <p className="text-xs text-slate-400">hesabına eklendi</p>
            {newBalance !== null && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-400 font-medium">Güncel Bakiye</p>
                <p className="text-xl font-extrabold text-emerald-600">{newBalance} KP</p>
              </div>
            )}
            <button onClick={onClose} className="btn-primary w-full py-3 text-sm mt-6">
              Harika! ✓
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
