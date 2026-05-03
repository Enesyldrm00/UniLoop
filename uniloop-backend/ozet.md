# UniLoop — Kampüs Ekonomisi Platformu Özet Raporu

UniLoop, üniversite öğrencilerinin kendi aralarında yetenek değişimi yapabildiği, kurye hizmeti alabildiği ve ikinci el ürün alıp satabildiği güvenli bir ekosistemdir.

## 🚀 Teknolojik Mimari

### Backend (uniloop-backend)
- **Çalışma Ortamı:** Node.js & Express.js
- **Veritabanı:** PostgreSQL (pg pool üzerinden bağlantı).
- **Dosya Yönetimi:** `multer` ile yerel görsel yükleme sistemi (`uploads/` klasörü).
- **Güvenlik:** JWT tabanlı kimlik doğrulama ve `protect` middleware.
- **Ödeme Altyapısı:** ACID prensiplerine uygun, Transaction (BEGIN/COMMIT) tabanlı Escrow sistemi.

### Frontend (uniloop-frontend)
- **Kütüphane:** React (Vite tabanlı).
- **Tasarım:** "Steel Blue Fintech" teması (Özel çelik mavisi ve kehribar sarısı vurgular).
- **Stil:** Tailwind CSS, `glass-card` ve `backdrop-blur` efektleri.
- **İkonlar:** Lucide React.
- **İletişim:** Axios tabanlı API yönetimi.

---

## 🛠️ Temel Modüller ve Özellikler

### 1. İlan Sistemi (Tasks)
- **Kategoriler:** 
  - 🤝 **Yetenek Değişimi:** Bir konuda yardım et/yardım al.
  - 🚚 **Kurye Teklifi:** "X yerinden Y yerine gidiyorum, bir şey isteyen?"
  - 📦 **Kurye Talebi:** "Bana şuradan şunu getirir misiniz?"
  - 🛍️ **İkinci El Eşya:** Eşya satışı (Fotoğraf destekli).
- **Dinamik Ödül Sistemi:** Kullanıcının **Credibility Score**'una göre (1.2x, 1.5x, 2.0x) çarpan uygulanan efektif ödül miktarı.

### 2. Escrow & Ödeme Akışı
- **Güvenli Ödeme:** Para alıcıdan peşin alınır, "locked" durumunda bekletilir.
- **Onay Mekanizması:** Hem alıcı hem satıcı onayladığında para transferi gerçekleşir.
- **Şeffaflık:** `transactions` tablosunda her kuruşun kaydı tutulur.

### 3. Mesajlaşma (Messaging)
- Kullanıcılar arası doğrudan iletişim.
- İlan üzerinden başlatılan sohbetler.
- Temaya uygun, modern "floating pill" tasarımlı mesaj barı.

### 4. Kullanıcı Profili ve İstatistikler
- Cüzdan bakiyesi (KP).
- Tamamlanan görev sayıları.
- Credibility Score ve Rating sistemi.

---

## 💎 Son Yapılan Güncellemeler (Kritik)

1. **İndigo Temalı İkinci El Modülü:** Ürün satışı için özel kategori ve renk paleti eklendi.
2. **Fotoğraf Yükleme:** `multer` entegrasyonu ile ilanlara görsel ekleme özelliği getirildi.
3. **Steel Blue Fintech Migration:** Tüm arayüz standart dışı renklerden temizlenip profesyonel bir fintech görünümüne kavuşturuldu.
4. **Blur Backdrops:** Tüm modallardaki turuncu/amber arka planlar kaldırılarak modern `backdrop-blur-sm` efektiyle güncellendi.
5. **Effective Reward Bug Fix:** İlan listesinde çarpanlı gözüken ama ödemede baz alınan miktar hatası (escrow tutarsızlığı) giderildi; artık ödeme sisteminde çarpanlı tutar (effective reward) tam olarak kullanılıyor.

---

## 📂 Dosya Yapısı

- `/uniloop-backend`
  - `/src/modules/task`: İlan yönetimi ve Escrow mantığı.
  - `/src/modules/wallet`: Para transferleri ve bakiye yönetimi.
  - `/src/middleware/upload.js`: Görsel yükleme motoru.
- `/uniloop-frontend`
  - `/src/components/TaskCard.jsx`: İlan kartları ve işlem onay modalları.
  - `/src/pages/DashboardPage.jsx`: Ana akış ve filtreleme.
  - `/src/pages/MessagesPage.jsx`: Sohbet arayüzü.

---
*UniLoop — Kampüsünüzün Ekonomik Döngüsü.*
