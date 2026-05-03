import { useState, useEffect } from 'react'
import {
  User, Phone, Instagram, Linkedin, Save, Loader,
  CheckCircle, Shield, LogOut, BookOpen, Edit3, Star,
} from 'lucide-react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useToast } from '../components/Toast'

// ── Profil Düzenleme Bölümü ──────────────────────────────────
function ProfileEditSection({ profile, onSaved }) {
  const toast = useToast()
  const [open,    setOpen]    = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({
    bio:          profile?.bio          || '',
    department:   profile?.department   || '',
    year_of_study: profile?.year_of_study || '',
    gpa:          profile?.gpa          || '',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/profile/me', {
        bio:          form.bio.trim()       || undefined,
        department:   form.department.trim()|| undefined,
        year_of_study: form.year_of_study   ? parseInt(form.year_of_study, 10) : undefined,
        gpa:          form.gpa              ? parseFloat(form.gpa)             : undefined,
      })
      toast.success('Profil güncellendi! ✅')
      onSaved()
      setOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#3b4b6e]/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Edit3 size={15} className="text-brand-light" />
          <span className="text-sm font-semibold text-white">Profili Düzenle</span>
        </div>
        <div className="text-white/30 text-xs">{open ? '▲ Kapat' : '▼ Aç'}</div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-4">
          {/* Bio */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              Biyografi <span className="text-white/25">(Kendini tanıt)</span>
            </label>
            <textarea
              value={form.bio}
              onChange={set('bio')}
              placeholder="Örn: İngilizce ve Almanca öğretiyorum, essay editing uzmanıyım..."
              rows={3}
              maxLength={300}
              className="input-field text-sm py-2.5 resize-none"
            />
            <p className="text-[10px] text-white/25 mt-1 text-right">{form.bio.length}/300</p>
          </div>

          {/* Bölüm */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Bölüm / Fakülte</label>
            <input
              value={form.department}
              onChange={set('department')}
              placeholder="Örn: İngiliz Dili ve Edebiyatı"
              className="input-field text-sm py-2.5"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sınıf */}
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Sınıf</label>
              <select value={form.year_of_study} onChange={set('year_of_study')} className="input-field text-sm py-2.5 bg-dark-card">
                <option value="">Seçin...</option>
                {[1,2,3,4,5,6].map(y => (
                  <option key={y} value={y}>{y}. Sınıf</option>
                ))}
              </select>
            </div>
            {/* GPA */}
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">GPA</label>
              <input
                type="number"
                min="0" max="4" step="0.01"
                value={form.gpa}
                onChange={set('gpa')}
                placeholder="3.50"
                className="input-field text-sm py-2.5"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── İletişim Düzenleme Bölümü ────────────────────────────────
function ContactEditSection({ contact, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    phone_number:     contact?.phone_number     || '',
    instagram_handle: contact?.instagram_handle || '',
    linkedin_url:     contact?.linkedin_url     || '',
    show_phone:       contact?.show_phone       ?? false,
    show_instagram:   contact?.show_instagram   ?? false,
    show_linkedin:    contact?.show_linkedin    ?? false,
  })

  const set    = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const toggle = (field) => () => setForm(f => ({ ...f, [field]: !f[field] }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/contact/me', form)
      toast.success('İletişim bilgileri güncellendi! ✅')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const VisibilityToggle = ({ field, activeColor }) => (
    <button
      type="button"
      onClick={toggle(field)}
      className={`ml-auto text-[10px] px-2 py-0.5 rounded-lg border transition-colors
        ${form[field] ? `${activeColor}` : 'bg-[#3b4b6e]/5 text-white/30 border-white/10'}`}
    >
      {form[field] ? '👁 Herkese Açık' : '🔒 Gizli'}
    </button>
  )

  return (
    <div>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
        İletişim Bilgilerim
      </p>

      {/* Telefon */}
      <div className="glass-card p-4 mb-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Phone size={14} className="text-emerald-400" />
          <label className="text-xs font-medium text-white/70">Telefon</label>
          <VisibilityToggle field="show_phone" activeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" />
        </div>
        <input type="tel" value={form.phone_number} onChange={set('phone_number')}
          placeholder="0530 123 4567" className="input-field text-sm py-2.5" />
      </div>

      {/* Instagram */}
      <div className="glass-card p-4 mb-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Instagram size={14} className="text-pink-400" />
          <label className="text-xs font-medium text-white/70">Instagram</label>
          <VisibilityToggle field="show_instagram" activeColor="bg-pink-500/20 text-pink-400 border-pink-500/30" />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
          <input type="text" value={form.instagram_handle} onChange={set('instagram_handle')}
            placeholder="kullanici_adi" className="input-field text-sm py-2.5 pl-7" />
        </div>
      </div>

      {/* LinkedIn */}
      <div className="glass-card p-4 mb-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Linkedin size={14} className="text-blue-400" />
          <label className="text-xs font-medium text-white/70">LinkedIn</label>
          <VisibilityToggle field="show_linkedin" activeColor="bg-blue-500/20 text-blue-400 border-blue-500/30" />
        </div>
        <input type="url" value={form.linkedin_url} onChange={set('linkedin_url')}
          placeholder="https://linkedin.com/in/..." className="input-field text-sm py-2.5" />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? 'Kaydediliyor...' : 'İletişim Bilgilerini Kaydet'}
      </button>
    </div>
  )
}

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function ProfilePage() {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    return Promise.all([
      api.get('/wallet/me'),
      api.get('/contact/me'),
    ]).then(([walletRes, contactRes]) => {
      const u = walletRes.data.user
      setUser(u)
      setContact(contactRes.data.contact)
      // Profil bilgisini de çek
      return api.get(`/profile/${u.id}`)
    }).then(res => {
      setProfile(res.data.profile)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleLogout = () => {
    localStorage.removeItem('uniloop_token')
    window.location.href = '/auth'
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <Loader size={28} className="animate-spin text-white/30" />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">Profilim</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 glass-card text-xs text-white/50 hover:text-red-400 transition-colors"
          >
            <LogOut size={13} />
            Çıkış
          </button>
        </div>

        {/* Kullanıcı Kartı */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center text-xl font-bold flex-shrink-0">
              {user?.full_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold">{user?.full_name}</p>
              {profile?.department && (
                <div className="flex items-center gap-1 mt-0.5">
                  <BookOpen size={11} className="text-white/30" />
                  <p className="text-xs text-white/40">{profile.department}</p>
                </div>
              )}
              <p className="text-xs text-white/30 mt-0.5">{user?.email}</p>
              {user?.is_edu_verified && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield size={11} className="text-brand-light" />
                  <span className="text-[10px] text-brand-light">EDU Doğrulandı</span>
                </div>
              )}
            </div>
          </div>

          {/* Yıldız puanı */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    size={16}
                    className={s <= Math.round(parseFloat(profile?.rating_average) || 0)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-white/15'}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-amber-400">
                {parseFloat(profile?.rating_average) > 0
                  ? parseFloat(profile.rating_average).toFixed(1)
                  : '—'}
              </span>
              <span className="text-xs text-white/30">
                ({profile?.rating_count || 0} değerlendirme)
              </span>
            </div>

            {/* Güvenilirlik skoru */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Güvenilirlik Skoru</span>
              <span className="text-xs font-bold text-brand-light">
                {profile?.credibility_score || 0}/100
              </span>
            </div>
            <div className="h-1.5 bg-[#3b4b6e]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gradient rounded-full transition-all duration-700"
                style={{ width: `${profile?.credibility_score || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bio önizlemesi */}
        {profile?.bio && (
          <div className="mt-3 glass-card px-4 py-3 rounded-xl">
            <p className="text-xs text-white/50 leading-relaxed italic">"{profile.bio}"</p>
          </div>
        )}
      </div>

      <div className="px-4 space-y-5">
        {/* Profil Düzenleme */}
        <ProfileEditSection
          profile={profile}
          onSaved={fetchData}
        />

        {/* İletişim Bilgileri */}
        <ContactEditSection
          contact={contact}
          onSaved={fetchData}
        />

        <div className="h-4" />
      </div>

      <Navbar />
    </div>
  )
}
