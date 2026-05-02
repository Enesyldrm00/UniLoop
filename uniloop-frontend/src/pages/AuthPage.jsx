import { useState } from 'react'
import { Eye, EyeOff, GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import api from '../api/axios'

const MOCK_MODE = false

export default function AuthPage({ onSuccess }) {
  const [tab, setTab] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
  })

  const set = (field) => (e) => {
    setError('')
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const emailValid = form.email.toLowerCase().endsWith('.edu.tr')
  const emailTouched = form.email.length > 0
  const showEduHint = emailTouched && !emailValid

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
        await new Promise((r) => setTimeout(r, 800))
        localStorage.setItem('uniloop_token', 'mock_jwt_token')
        onSuccess?.()
        return
      }

      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register'
      const payload = tab === 'login'
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo & Başlık */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">UniLoop</h1>
          <p className="text-slate-400 text-sm mt-1">Kampüs içi kapalı ekonomi</p>
        </div>

        {/* Tab Geçişi */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 mb-5">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${tab === t
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">

          {/* Ad Soyad — sadece kayıt */}
          {tab === 'register' && (
            <div className="animate-fade-up">
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Ad Soyad</label>
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
            <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5 block">
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
                className={`input-field pr-10 ${emailTouched
                    ? emailValid
                      ? 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500'
                      : 'border-red-400 focus:ring-red-400 focus:border-red-400'
                    : ''
                  }`}
              />
              {emailTouched && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {emailValid ? '✅' : '❌'}
                </span>
              )}
            </div>

            {showEduHint && (
              <div className="flex items-start gap-1.5 mt-2 animate-fade-up">
                <AlertCircle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600">
                  UniLoop yalnızca <span className="font-bold">.edu.tr</span> uzantılı akademik
                  e-postaları kabul eder.
                </p>
              </div>
            )}

            {emailValid && emailTouched && (
              <p className="text-[11px] text-emerald-600 mt-1.5 animate-fade-up font-medium">
                ✓ Geçerli akademik e-posta
              </p>
            )}
          </div>

          {/* Şifre */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5 block">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Genel Hata */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 animate-fade-up">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !emailValid}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
          <p className="text-center text-[11px] text-slate-400 leading-relaxed">
            🎓 Yalnızca <span className="font-semibold text-slate-500">.edu.tr</span> uzantılı üniversite
            e-postaları kabul edilir.
          </p>
        </form>
      </div>
    </div>
  )
}
