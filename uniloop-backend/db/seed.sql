-- ============================================================
-- UniLoop — Seed Data (Örnek Veriler)
-- ============================================================

-- 1. KULLANICILAR (şifre: "password123" için bcrypt hash)
INSERT INTO users (email, password_hash, full_name, is_edu_verified) VALUES
  ('system@uniloop.edu.tr',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh2W', 'SYSTEM',           TRUE),
  ('ali.yilmaz@ogu.edu.tr',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh2W', 'Ali Yılmaz',       TRUE),
  ('ayse.kaya@ogu.edu.tr',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh2W', 'Ayşe Kaya',        TRUE),
  ('mehmet.demir@ogu.edu.tr',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh2W', 'Mehmet Demir',     TRUE),
  ('fatma.celik@ogu.edu.tr',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh2W', 'Fatma Çelik',      TRUE),
  ('can.ozturk@ogu.edu.tr',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh2W', 'Can Öztürk',       TRUE);

-- 2. PROFİLLER
INSERT INTO user_profiles (user_id, bio, gpa, department, year_of_study, certifications, achievements, credibility_score) VALUES
  (1, 'Sistem hesabı', NULL, NULL, NULL, '[]', '[]', 0),
  (2, 'Yazılım mühendisliği 3. sınıf, Python & ML meraklısı', 3.50, 'Yazılım Mühendisliği', 3,
      '[{"title":"AWS Cloud Practitioner","issuer":"Amazon","year":2024}]',
      '[{"title":"Hackathon 1.si","year":2023}]', 75),
  (3, 'İngilizce ve Almanca öğretiyorum, essay editing uzmanı', 3.80, 'İngiliz Dili ve Edebiyatı', 4,
      '[{"title":"IELTS 8.0","issuer":"British Council","year":2023},{"title":"C1 Almanca","issuer":"Goethe Institut","year":2024}]',
      '[{"title":"Lisans Burs Ödülü","year":2023}]', 90),
  (4, 'Mat & Fizik özel ders, problem seti çözümü', 2.80, 'Makine Mühendisliği', 2,
      '[]', '[]', 25),
  (5, 'Grafik tasarım ve video editing', 3.20, 'Endüstri Tasarımı', 3,
      '[{"title":"Adobe Certified","issuer":"Adobe","year":2024}]',
      '[]', 55),
  (6, 'Kampüs içi kurye, hızlı teslimat', 2.50, 'İşletme', 1, '[]', '[]', 10);

-- 3. İLETİŞİM BİLGİLERİ
INSERT INTO user_contacts (user_id, phone_number, instagram_handle, show_phone, show_instagram) VALUES
  (2, '05301234567', 'ali.yl', FALSE, TRUE),
  (3, '05309876543', 'ayse.kaya.eng', FALSE, TRUE),
  (4, '05321112233', 'mehmet_demir', TRUE,  TRUE),
  (5, '05334445566', 'fatma.designs', FALSE, TRUE),
  (6, '05357778899', 'can_courier',  TRUE,  TRUE);

-- 4. CÜZDANLAR
INSERT INTO wallets (user_id, balance, total_topup_tl) VALUES
  (1,   0,    0),
  (2, 350,  200),
  (3, 500,  300),
  (4, 120,  100),
  (5, 280,  150),
  (6,  80,   50);

-- 5. GÖREVLER (Çeşitli türler ve lokasyonlar)
INSERT INTO tasks (creator_id, title, description, task_type, status, reward_kredi, location, from_location, to_location) VALUES
  -- Yetenek takası ilanları
  (2, 'Python & Veri Analizi (2 Saat)',
      'NumPy, Pandas ve Matplotlib konularında birebir anlatım yapabilirim.',
      'skill_exchange', 'open', 120, 'muhendislik', NULL, NULL),

  (3, 'İngilizce Essay Düzeltme ve Geri Bildirim',
      'Akademik essay, cover letter veya CV metinlerinizi düzeltirim. 24 saat içinde geri dönüş.',
      'skill_exchange', 'open', 75, 'yabanci_dil', NULL, NULL),

  (4, 'Mat2 Özel Ders — Türev & İntegral',
      'Final döneminde zorlandığın konuları beraber çözelim. 1 saat, kütüphanede.',
      'skill_exchange', 'open', 100, 'kutuphane', NULL, NULL),

  (5, 'Sunum Tasarımı (PowerPoint / Canva)',
      'Profesyonel ve şık sunum hazırlarım. İçeriği sen ver, tasarımı ben yaparım.',
      'skill_exchange', 'open', 60, 'sosyal_yasam', NULL, NULL),

  -- Kurye talep ilanları
  (2, 'Merkez Kantin''den Kahve & Poğaça',
      'Büyük sütlü kahve + 2 poğaça. Parayı escrow ile kilitliyorum.',
      'courier_request', 'open', 15, 'merkez_kantin', NULL, NULL),

  (3, 'Kütüphane Fotokopicisinden Baskı Al',
      '20 sayfalık PDF, çift taraflı. Dosyayı WhatsApp''tan atarım.',
      'courier_request', 'open', 10, 'kutuphane', NULL, NULL),

  -- Tersine kurye ilanları (kurye kendi teklifini açıyor)
  (6, '[KURYE] Mühendislik → Merkez Kantin geçiyorum',
      'Şu an Mühendislik binasındayım, 20 dakika sonra Merkez Kantin''e geçiyorum. Yolda taşıyabileceğim bir şey var mı?',
      'courier_offer', 'open', 20, NULL, 'muhendislik', 'merkez_kantin'),

  (6, '[KURYE] Kantin → Kütüphane geçiyorum',
      'Öğlen kantinden çıkıp kütüphaneye geçiyorum. Sipariş almaya açığım.',
      'courier_offer', 'open', 15, NULL, 'merkez_kantin', 'kutuphane');

-- 6. HAVUZLAR (Ortak sepetler)
INSERT INTO pools (creator_id, title, description, location, max_capacity, current_capacity, total_cost, status) VALUES
  (2, 'Öğle Yemeği Ortak Siparişi',
      'Dışarıdan yemek söylüyoruz, minimum sipariş 5 kişi lazım.',
      'merkez_kantin', 5, 2, 250, 'open'),
  (3, 'Kırtasiye Toplu Sipariş',
      'Tükenmez, defter ve post-it. Herkese 40 Kredi düşüyor.',
      'sosyal_yasam', 4, 1, 160, 'open');

-- 7. HAVUZ ÜYELERİ
INSERT INTO pool_members (pool_id, user_id, paid_amount) VALUES
  (1, 2, 50),
  (1, 4, 50),
  (2, 3, 40);

-- 8. İŞLEM GEÇMİŞLERİ
INSERT INTO transactions (wallet_id, amount, type, description) VALUES
  (2, 200,  'topup',  '200 TL yükleme → 200 K-Kredi'),
  (2, -50,  'spend',  'Öğle yemeği havuzuna katılım (Pool #1)'),
  (3, 300,  'topup',  '300 TL yükleme → 300 K-Kredi'),
  (3, -40,  'spend',  'Kırtasiye havuzuna katılım (Pool #2)'),
  (4, 100,  'topup',  '100 TL yükleme → 100 K-Kredi'),
  (4, -50,  'spend',  'Öğle yemeği havuzuna katılım (Pool #1)'),
  (5, 150,  'topup',  '150 TL yükleme → 150 K-Kredi'),
  (6, 50,   'topup',  '50 TL yükleme → 50 K-Kredi');
