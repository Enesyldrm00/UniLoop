-- Reset wallets to a good amount
UPDATE wallets SET balance = 500;

-- Delete all tasks except second_hand
DELETE FROM tasks WHERE task_type != 'second_hand';

-- Delete all events
DELETE FROM events;

-- Insert realistic tasks (using users 2, 3, 4, 5, 6)
INSERT INTO tasks (creator_id, title, description, task_type, status, reward_kredi, location, from_location, to_location) VALUES
(2, 'Matematik Finali Çalışma Grubu', 'Kütüphanede 2 saatlik Mat-101 çalışma arkadaşı arıyorum. Anlayamadığım kısımları açıklayabilecek birine 150 KP.', 'skill_exchange', 'open', 150, 'kutuphane', NULL, NULL),
(3, 'İngilizce Konuşma Pratiği (Mülakat Hazırlığı)', 'Yurtdışı staj mülakatım var, 45 dakika boyunca karşılıklı İngilizce pratik yapmak istiyorum.', 'skill_exchange', 'open', 100, 'sosyal_yasam', NULL, NULL),
(4, 'Kantinden Kütüphaneye 2 Kahve', 'Şu an kütüphanenin 2. katındayım, çıkamıyorum. Merkez kantinden 2 filtre kahve alıp getirebilecek var mı? Kahvelerin ücretini KP olarak vereceğim.', 'courier_request', 'open', 60, 'kutuphane', NULL, NULL),
(5, 'Yabancı Diller → Mühendislik Kuryesi', 'Şu an Yabancı Diller binasındayım, 15 dakika içinde Mühendislik binasına geçeceğim. Oraya ulaştırılacak bir eşyanız/notunuz varsa getirebilirim.', 'courier_offer', 'open', 30, NULL, 'yabanci_dil', 'muhendislik'),
(6, 'React & Frontend Proje Yardımı', 'Dönem projemde React Router kısmında takıldım. Hatayı bulup çözebilecek deneyimli bir arkadaş arıyorum.', 'skill_exchange', 'open', 200, 'muhendislik', NULL, NULL);

-- Insert realistic events
INSERT INTO events (creator_id, title, description, max_participants, reward_per_participant, total_locked_amount, status) VALUES
(2, 'Halı Saha Hazırlık Maçı', 'Akşamki halı saha maçı için eksik 3 kişi aranıyor. Katılım sağlayanlara 50 KP bütçe ayrılmıştır.', 3, 50, 150, 'open'),
(3, 'Girişimcilik Kulübü Tanışma Toplantısı', 'Sosyal Yaşam Merkezinde toplanıp yeni fikirler tartışacağız. Katılımcılara ikramlık için puan dağıtımı yapılacaktır.', 5, 20, 100, 'open'),
(4, 'Algoritma ve Veri Yapıları Vize Öncesi Çözüm Kampı', 'Vize öncesi çıkmış algoritma sorularını çözmek için toplanıyoruz. Çalışma grubuna düzenli katılım için KP ödülü ayrıldı.', 4, 30, 120, 'open');
