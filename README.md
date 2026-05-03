<div align="center">
  
# 🔄 UniLoop
### Kampüs İçi Kapalı Ekonomi ve Etkileşim Platformu

[![React](https://img.shields.io/badge/React-18.x-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-informational.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)

**UniLoop**, üniversite öğrencilerinin kendi aralarında yetenek takası, kurye hizmetleri, ikinci el eşya alım-satımı ve toplu etkinlikler düzenleyebilmesini sağlayan **gerçek zamanlı, cüzdan tabanlı ve kapalı uçlu (closed-loop) bir kampüs ekonomisi** sistemidir.

</div>

---

## 🚀 Proje Vizyonu & İş Mantığı (Business Logic)

Öğrenciler arasındaki finansal ve sosyal etkileşimleri tek bir güvenli çatı altında toplamayı hedefleyen UniLoop, itibari para (fiat currency) yerine **"Kampüs Puanı" (KP)** adlı dijital bir cüzdan varlığı kullanır. 

Sistem, geleneksel e-ticaret sitelerinden farklı olarak **Güvenli Ödeme Bekletme (Escrow)** mimarisiyle inşa edilmiştir. Bir görev veya etkinlik başlatıldığında, bütçe anında kullanıcının cüzdanından düşülerek sisteme kilitlenir. İşlem başarıyla sonuçlandığında dağıtılır, aksi takdirde (örneğin etkinlik kontenjanı dolmazsa) tamamen **otomatik iade (Refund)** süreci başlar.

---

## 💎 Temel Özellikler (Core Features)

1. **💸 Escrow Tabanlı İlan Sistemi:** Yetenek takası, kurye talepleri ve ikinci el ilanlarında, iş tamamlanana kadar KP sistem tarafından askıya alınır (Escrow). İş onaylandığında para karşı tarafa geçer.
2. **🎉 Bütçeli Etkinlik Modülü (Events):** Etkinlik sahibi toplam bütçeyi (Örn: 10 kişi x 50 KP = 500 KP) en baştan kilitler. Katılımcılar etkinliğe katılır ve süreç sonunda "Bitir & Dağıt" butonuyla ödüller ACID kurallarına bağlı transaction'lar ile anında dağıtılır. Artan miktar iade edilir.
3. **🛒 Ortak Sepetler (Pools):** Kullanıcıların belirli bir amaç (örneğin kahve almak) için bir araya gelip ortak bütçe oluşturmasını sağlayan havuz sistemi.
4. **⚡ Gerçek Zamanlı Cüzdan Senkronizasyonu:** Tüm bakiye harcamaları ve transferleri, `CustomEvent` mimarisiyle frontend tarafında anında (sayfa yenilenmeden) tüm sekmelerde ve bileşenlerde senkronize olur.
5. **🎨 Premium "Glassmorphism" UI:** Steel Blue (Çelik Mavisi) ve Fuşya aksan renkleri, TailwindCSS kullanılarak "Fintech" standartlarında, modern ve mobil öncelikli bir arayüz sunar.

---

## 🏗️ Mimari ve Akış Diyagramı (Architecture)

Aşağıdaki diyagram, platformun temel cüzdan ve Escrow çalışma mantığını göstermektedir:

```mermaid
sequenceDiagram
    participant Alıcı (Buyer)
    participant UniLoop Escrow
    participant Satıcı (Seller)

    Alıcı->>UniLoop Escrow: 1. İlan Aç (100 KP Kilitlenir)
    Note over UniLoop Escrow: Bakiye cüzdandan düşülür<br/>"Pending" statüsüne geçer
    Satıcı->>UniLoop Escrow: 2. Görevi Üstlen (Assign)
    Satıcı->>UniLoop Escrow: 3. Görevi Teslim Et (Review)
    Alıcı->>UniLoop Escrow: 4. Onayla ve Puanla (Approve)
    UniLoop Escrow->>Satıcı: 5. 100 KP Aktarılır
```

---

## 🗄️ Veritabanı Şeması (Entity-Relationship)

Veritabanı yapısı, yüksek performanslı ve ilişkisel bir mimariyle PostgreSQL üzerinde kurgulanmıştır.

```mermaid
erDiagram
    USERS ||--o{ WALLETS : has
    USERS ||--o{ TASKS : creates
    USERS ||--o{ EVENTS : organizes
    TASKS ||--o| ESCROWS : secured_by
    EVENTS ||--o{ EVENT_PARTICIPANTS : includes

    USERS {
        int id PK
        string full_name
        string email
        decimal rating
    }
    WALLETS {
        int id PK
        int user_id FK
        decimal balance
    }
    ESCROWS {
        int id PK
        int task_id FK
        decimal amount
        string status
    }
    EVENTS {
        int id PK
        string title
        int max_participants
        decimal reward_per_participant
        string status
    }
```

---

## 🛠️ Teknoloji Yığını (Tech Stack)

### **Frontend (İstemci)**
* **Kütüphane:** React 18
* **Build Aracı:** Vite
* **Stilleme:** TailwindCSS (Glassmorphism design system)
* **İkonlar & Tipografi:** Lucide-React, Google Fonts (Inter)
* **Tarih Formatlama:** date-fns

### **Backend (Sunucu)**
* **Çalışma Zamanı:** Node.js
* **Framework:** Express.js
* **Veritabanı:** PostgreSQL (pg modülü ile)
* **Güvenlik & Auth:** JWT (JSON Web Tokens), Bcryptjs, CORS
* **Veri Doğrulama:** express-validator

---

## ⚙️ Kurulum ve Çalıştırma (Getting Started)

Projeyi bilgisayarınızda yerel olarak çalıştırmak için aşağıdaki adımları izleyin:

### 1. Gereksinimler
- Node.js (v18.x veya üzeri)
- PostgreSQL (v14.x veya üzeri)

### 2. Projeyi Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/uniloop.git
cd uniloop
```

### 3. Veritabanı Yapılandırması (PostgreSQL)
PostgreSQL üzerinde `uniloop` adında bir veritabanı oluşturun ve tabloları/sahte verileri içeri aktarın:
```bash
cd uniloop-backend
npm run db:init
npm run db:seed
```

### 4. Çevre Değişkenleri (.env)
`uniloop-backend` dizini içinde `.env` adında bir dosya oluşturup aşağıdaki bilgileri kendi sisteminize göre doldurun:
```env
PORT=3000
DATABASE_URL=postgres://KULLANICI_ADI:SIFRE@localhost:5432/uniloop
JWT_SECRET=super_gizli_btk_hackathon_key
```

### 5. Backend'i Başlatın
```bash
cd uniloop-backend
npm install
npm run dev
```

### 6. Frontend'i Başlatın
Yeni bir terminal sekmesi açarak:
```bash
cd uniloop-frontend
npm install
npm run dev
```
*Frontend varsayılan olarak `http://localhost:5173` adresinde ayağa kalkacaktır.*

---

## 🔐 Güvenlik ve ACID Prensipleri

Sistem, finansal işlemler (KP aktarımları, kilitlenmeler ve iadeler) içerdiği için Backend tarafında PostgreSQL `BEGIN`, `COMMIT`, `ROLLBACK` komutları ile **ACID (Atomicity, Consistency, Isolation, Durability)** standartlarına uygun tasarlanmıştır.

* Herhangi bir işlem (Örn: Etkinlik onayı sırasında kullanıcılara paranın yatırılması) yarıda kesilirse, `ROLLBACK` mekanizması devreye girerek kimsenin haksız kazanç sağlamamasını veya parasının kaybolmamasını garanti eder.
* Şifreler `bcrypt` ile hashlenir, API istekleri `JWT` token'ları üzerinden doğrulanır.

---

<div align="center">
  <p><i>BTK Hackathon için özenle geliştirilmiştir. 👨‍💻🚀</i></p>
</div>
