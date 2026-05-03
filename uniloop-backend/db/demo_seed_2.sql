-- İkinci el ilanları temizle
DELETE FROM tasks WHERE task_type = 'second_hand';

-- Havuzları ve üyelerini temizle
DELETE FROM pool_members;
DELETE FROM pools;

-- Ortak sepetleri (pools) ekle
INSERT INTO pools (title, creator_id, description, location, max_capacity, current_capacity, total_cost, status) VALUES 
('Akşam Yemeği: Büyük Boy Pizza', 3, 'Kütüphanede akşam yemeği için pizza söylüyoruz. Kişi başı 80 KP düşüyor.', 'kutuphane', 4, 2, 320, 'open'),
('İleri Fizik Toplu Ders Notu Çekimi', 2, 'Kırtasiyeden 100 sayfalık notu toplu çektireceğiz, ucuza gelecek.', 'merkez_kantin', 5, 1, 250, 'open');

-- Üyeleri ekle (alt sorgularla pool_id bularak)
INSERT INTO pool_members (pool_id, user_id, paid_amount) VALUES 
((SELECT id FROM pools WHERE title = 'Akşam Yemeği: Büyük Boy Pizza'), 3, 80),
((SELECT id FROM pools WHERE title = 'Akşam Yemeği: Büyük Boy Pizza'), 4, 80),
((SELECT id FROM pools WHERE title = 'İleri Fizik Toplu Ders Notu Çekimi'), 2, 50);
