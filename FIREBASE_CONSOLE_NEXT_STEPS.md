# Firebase Console - Sonraki Adımlar

## ✅ Şu Anda: Project Settings Sayfasındasınız

Firebase config değerleriniz doğru görünüyor:
- Project ID: `learnconnect-7c499`
- App ID: `1:94708429652:web:af1e854867d6eeaf3dcec1`

## 🎯 Sonraki Adımlar (Sırayla)

### 1. Firestore Database Oluşturun

**Sol menüden:**
1. **Firestore Database** ikonuna tıklayın (🔥 yanında database ikonu)
2. **Create database** butonuna tıklayın
3. **Production mode** seçin
4. Location seçin (örn: `europe-west`)
5. **Enable** tıklayın

**Not:** Database oluşturulduktan sonra 404 hatası kaybolacak.

### 2. Firestore Rules Yükleyin

Database oluşturulduktan sonra:
1. **Rules** sekmesine gidin
2. `FIREBASE_CONSOLE_RULES_COPY.txt` dosyasını açın
3. İçeriği kopyalayıp Rules editörüne yapıştırın
4. **Publish** butonuna tıklayın

### 3. Veri Ekleme (Seed Script)

Database ve Rules hazır olduktan sonra:

**Yöntem A: Browser Console (Önerilen)**
1. Terminal'de: `npm run dev`
2. Browser'da uygulamayı açın
3. F12 → Console
4. `BROWSER_CONSOLE_SEED.js` dosyasının içeriğini kopyalayıp yapıştırın
5. Enter

**Yöntem B: Firebase Console'dan Manuel**
1. Firestore Database → Data
2. Start collection → `curriculum` → Document: `tyt` → Subcollection: `subjects`
3. Her ders için document ekleyin

## 📋 Hızlı Kontrol Listesi

- [ ] Firestore Database oluşturuldu
- [ ] Firestore Rules yüklendi
- [ ] Seed script çalıştırıldı (veya manuel veri eklendi)
- [ ] Uygulama test edildi

## 💡 İpucu

Firebase Console'daki 404 hataları normaldir. Önemli olan Firestore Database'in oluşturulmasıdır.
