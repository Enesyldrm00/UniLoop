# UniLoop Platformu - Güncel Proje Özeti

Bu belge, UniLoop platformunun mevcut mimarisini, ekonomik sistemini ve son yapılan güncellemeleri özetlemektedir.

## 1. Projenin Amacı ve Temel Yapısı
UniLoop, kampüs içi mikro görevleri, yetenek takasını ve öğrencilerin ortaklaşa kullanabileceği kurye sepetlerini tek bir platformda birleştiren modern bir sistemdir.
- **Frontend:** React, TailwindCSS, Lucide Icons (Koyu tema, Glassmorphism ve animasyonlu modern UI).
- **Backend:** Node.js, Express, PostgreSQL.

## 2. Ekonomik Sistem (Kampüs Puanı - KP)
- Platformdaki işlemler **KP (Kampüs Puanı)** üzerinden yürütülür.
- Güçlü bir başlangıç deneyimi için standart kullanıcıların başlangıç bakiyesi **100.000 KP**'ye sabitlenmiştir.
- Sistemin otomatik süreçlerini (örneğin kurye sepetlerini fonlamak) yönetmesi amacıyla **SYSTEM (ID: 1)** adlı özel bir yönetici cüzdanı kurulmuş olup bakiyesi **10.000 KP**'dir.

## 3. Görev ve Escrow (Güvenli Ödeme) Sistemi
Sistemde güvenli alışveriş için çift taraflı onay mekanizmasına dayalı bir **Escrow (Emanet)** modeli bulunmaktadır:
- **Para Kilitleme:** Bir görev kabul edildiğinde (veya kurye sepeti dolduğunda), ilan sahibinden (veya SYSTEM'den) tutar kesilerek escrow kasasında kilitlenir (`locked`).
- **İki Yönlü Onay (Double Confirmation):** 
  - Görevi alan kişi işi bitirdiğinde **"Teslim Et"** butonuna basar (`seller_approved: true`).
  - Görevi veren kişi (ilan sahibi) bu durumu onayladığında **"Onayla"** butonuna basar (`buyer_approved: true`).
  - Her iki onay sağlandığında para görevi tamamlayan kişiye aktarılır (`released`).
- İşlem esnasında problem çıkarsa, `dispute` (anlaşmazlık) butonuyla işlem dondurulabilir.

## 4. Gerçek Zamanlı Senkronizasyon (Polling Mekanizması)
- Kullanıcıların karşılıklı onayları ve işlemlerin ilerleyişi **5 saniyelik Polling (arka plan sorgusu)** mekanizmasıyla anında güncellenir.
- React'teki `setInterval` işlemlerinden kaynaklanan *Stale Closure* (eski veri kalma) hataları `useRef` tabanlı modern bir yaklaşımla çözüldü.
- **Sonuç:** Ali bir görevi teslim ettiğinde, Ayşe'nin açık olan modalı veya "Bekleyen İşlemlerim" kartı sayfayı yenilemeye gerek kalmadan **anında** güncellenir. İlan birisi tarafından kabul edildiğinde de görev listesinden anında silinip bekleyen işlemlere geçer.

## 5. Otomatik Kurye (Ortak Sepet) Sistemi
- Öğrenciler aynı mekandan verilen siparişleri ortak sepetlerde (örn. Yemekhane Ortak Sepet) birleştirebilir.
- Sepet dolduğunda (örn. 5/5), sistem devreye girerek otomatik bir Kurye İlanı oluşturur.
- Parası **SYSTEM** tarafından fonlanan bu otomatik görevler, bir kurye tarafından üstlenildiğinde escrow (bekleme) sürecine girmeden **anında onaylanıp** kuryeye ödemesi yapılır.

## 6. Gelişmiş Filtreleme Arayüzü (Filter Sheet)
- Kullanıcılar aradıkları ilanlara kolayca ulaşabilmek için, Dashboard ekranında gelişmiş bir **Filtreleme Modalı (FilterSheet)** kullanabilir.
- **Filtreleme Kriterleri:**
  1. **Görev Türü:** Yetenek, Kurye Talep, Kurye Teklif
  2. **Lokasyon:** Mühendislik, Merkez Kantin, Yabancı Dil, Sosyal Yaşam, Kütüphane (Hepsi emoji desteklidir).
  3. **Maksimum Ücret (KP):** ≤50, ≤100, ≤200, ≤500
- İkonun sağ üstünde, aktif olarak kullanılan filtre sayısını gösteren akıllı bir bildirim ("Badge") bulunur.

## 7. Son Durum Özeti
UniLoop, güvenli cüzdan altyapısı, sorunsuz çalışan escrow onaylama sistemi, eş zamanlı ekran senkronizasyonu ve gelişmiş filtreleme özellikleriyle stabil, canlı bir "Kampüs Pazaryeri" haline gelmiştir. Eski tüm geçici dosyalar (ozet1.md, ozet11.md vs.) temizlenerek tek bir dökümantasyonda toplanmıştır.
