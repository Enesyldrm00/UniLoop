import { useState } from 'react'
import { Eye, EyeOff, GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import api from '../api/axios'

// Mock: Backend hazır olmadan da çalışır
const MOCK_MODE = true

export default function AuthPage({ onSuccess }) {
  const [tab, setTab]           = useState('login')   // 'login' | 'register'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
  })

  const set = (field) => (e) => {
    setError('')
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  // .edu.tr anlık validasyon
  const emailValid  = form.email.toLowerCase().endsWith('.edu.tr')
  const emailTouched = form.email.length > 0
  const showEduHint  = emailTouched && !emailValid

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emailValid) {
      setError('Yalnızca .edu.tr uzantılı akademik e-postalar kabul edilmektedir.')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (MOCK_MODE) {
        // Mock başarı — backend hazır olunca kaldır
        await new Promise((r) => setTimeout(r, 800))
        localStorage.setItem('uniloop_token', 'mock_jwt_token')
        onSuccess?.()
        return
      }

      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register'
      const payload  = tab === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, full_name: form.full_name }

      const { data } = await api.post(endpoint, payload)
      localStorage.setItem('uniloop_token', data.token)
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu, tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4
                    relative overflow-hidden">
      {/* Arka plan degrade efektleri */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-sm max-h-sm
                      bg-brand/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] max-w-xs max-h-xs
                      bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo & Başlık */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center
                          mx-auto mb-4 shadow-brand">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">UniLoop</h1>
          <p className="text-white/40 text-sm mt-1">Kampüs içi kapalı ekonomi</p>
        </div>

        {/* Tab Geçişi */}
        <div className="glass-card p-1 flex gap-1 mb-6">
          {['login','register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                ${tab === t
                  ? 'bg-brand-gradient text-white shadow-brand'
                  : 'text-white/40 hover:text-white/70'
                }`}
            >
              {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {/* Ad Soyad — sadece kayıt */}
          {tab === 'register' && (
            <div className="animate-fade-up">
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Ad Soyad</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="Adın Soyadın"
                className="input-field"
              />
            </div>
          )}

          {/* E-posta */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 flex items-center gap-1.5 block">
              <Mail size={12} />
              Akademik E-posta
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="isim@universite.edu.tr"
                className={`input-field pr-10 ${
                  emailTouched
                    ? emailValid
                      ? 'border-kredit/50 focus:border-kredit'
                      : 'border-red-500/50 focus:border-red-500'
                    : ''
                }`}
              />
              {emailTouched && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {emailValid ? '✅' : '❌'}
                </span>
              )}
            </div>

            {/* .edu.tr Uyarısı */}
            {showEduHint && (
              <div className="flex items-start gap-1.5 mt-2 animate-fade-up">
                <AlertCircle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/90">
                  UniLoop yalnızca <span className="font-bold">.edu.tr</span> uzantılı akademik
                  e-postaları kabul eder.
                </p>
              </div>
            )}

            {emailValid && emailTouched && (
              <p className="text-[10px] text-kredit mt-1.5 animate-fade-up">
                ✓ Geçerli akademik e-posta
              </p>
            )}
          </div>

          {/* Şifre */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 flex items-center gap-1.5 block">
              <Lock size={12} />
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={set('password')}
                placeholder="En az 6 karakter"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40
                           hover:text-white/70 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Genel Hata */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-up">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !emailValid}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="animate-pulse">İşleniyor...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* .edu.tr notu */}
          <p className="text-center text-[10px] text-white/25 leading-relaxed">
            🎓 Yalnızca <span className="text-white/40">.edu.tr</span> uzantılı üniversite
            e-postaları kabul edilir.
          </p>
        </form>
      </div>
    </div>
  )
}
