# SnapLead - Geliştirme Yol Haritası

Kabul edilen geliştirme sırası aşağıdaki gibidir:

1. [x] **DB (Veritabanı)**: Supabase üzerinde `profiles`, `leads` gibi temel tabloların oluşturulması, Row Level Security (RLS) politikalarının yazılması ve projedeki TypeScript tiplerinin ayarlanması.
2. [x] **Dashboard**: Kullanıcı arayüzünün (veri tabloları, grafikler, istatistikler) inşası ve veritabanına bağlanması.
3. [x] **Lead score**: Potansiyel müşteriler (leads) için etkileşim ve uygunluğa göre puanlama algoritması.
4. [x] **Enrichment**: Sadece e-posta veya isim kullanılarak dış API'ler (Clearbit, Apollo vb.) üzerinden veri zenginleştirme (şirket boyutu, sektör vb. bulma).
5. [x] **AI (Yapay Zeka) ve Otomasyon**: SnapLead üzerinden "Send to n8n" dediğimizde VEYA puanı 70'i geçen biri olduğunda kodlarımız webhook ile n8n'e verileri yollayacak. n8n veriyi Google Gemini/OpenAI ile harmanlayıp o kişiye özel soğuk satış maili (Cold Email) üretecek.
6. [x] **Automation**: Belirli koşullara bağlı olarak arka planda çalışan iş akışları (Örn: Puanı yüksek olan lead'e otomatik mail atılması).
7. [x] **Export**: Filtrelenen veya seçili lead verilerinin CSV, Excel olarak dışa aktarılması veya dış CRM'lere gönderilmesi.
8. [ ] **Deploy**: Tüm ayarların yapılarak platformun Vercel gibi bir ortamda canlıya (Production) alınması.
