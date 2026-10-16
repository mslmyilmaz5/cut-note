# Cut Note

Hafif bir macOS not uygulaması. Siyah bir pano açılır, hemen yazarsın, makasla kesince her parça kendi notu olur.

## İndir

Hazır uygulama: **[Son sürümü indir](https://github.com/mslmyilmaz5/cut-note/releases/latest)**

| Dosya | Link |
| --- | --- |
| DMG (önerilen) | [CutNote.dmg](https://github.com/mslmyilmaz5/cut-note/releases/latest/download/CutNote.dmg) |
| ZIP | [CutNote.zip](https://github.com/mslmyilmaz5/cut-note/releases/latest/download/CutNote.zip) |

**Kurulum:** DMG veya ZIP'i açın, uygulamayı `/Applications` klasörüne sürükleyin.
İlk açılışta **sağ tık → Aç** deyin. "Bozuk olduğu için açılamıyor" uyarısı
çıkarsa Terminal'e şunu yazın:

```sh
xattr -cr "/Applications/Cut Note.app"
```

Uygulama Apple Developer ID ile imzalanmadığı için Gatekeeper uyarısı normaldir.

`.cutnote` dosyasına çift tıklayınca pano açılır.

## Özellikler

- Açılışta siyah pano; beyaz panoya `⌘⇧B` ile geçilir.
- Makasla dikey veya yatay kesim. Her parça ayrı not olur.
- **File** menüsü en soldadır: New Note, Save as .cutnote, Import.
- Yazı stilleri logonun sağında tek tek durur: type, size, style, align, list, satır aralığı. Renkler tek noktada toplanır; noktaya basınca liste açılır.
- Otomatik kayıt. Başlıktaki rozet `Saving…`, `Saved` veya `Not saved` der.
- Şablonlar, not listesi, odak modu, pano geri al / yinele.

## Kısayollar

| Kısayol | İş |
| --- | --- |
| `Tab` `Tab` (hızlıca) | Makas modu (listede Tab girinti yapar) |
| `⌘⇧C` | Makas modu |
| `⌘⇧B` | Siyah / beyaz pano |
| `⌘⇧F` | Notu odakla / panoya dön |
| `⌘S` | Panoyu `.cutnote` olarak kaydet |
| `⌘O` | `.cutnote` içe aktar |
| `⌘T` | Şablonlar |
| `⌘L` | Not listesi |
| `Esc` | Makas modundan çık / panelleri kapat |
| `⌘Z` / `⌘⇧Z` | Pano kesimlerini geri al / yinele (yazarken değil) |

## Kes, taşı, birleştir

Her panoda **•••** (Note actions) vardır:

- **Cut to right / Cut below** seçili yazıyı yeni bir pane'e taşır; biçim ve listeler korunur. Seçim yoksa imleçten sonrasını taşır. Boş kesim kapalıdır. Makas jesti yine boş bir pane açar.
- **Move note** notu seçilen hedefin soluna, sağına, üstüne veya altına koyar.
- **Merge into target** bu notun içeriğini hedefin sonuna ekler ve kaynak pane'i kaldırır.

Bu işlemler başlıktaki geri al / yinele oklarıyla geri alınır. Metin geri alımı editörde kalır.

## Odak

Pane'deki **↗** veya **⌘⇧F** notu tüm panoya yayar. **Esc**, **Back to board** veya aynı kısayol yerleşimi geri getirir.

## Gereksinimler

- macOS 13 veya üzeri
- Apple Silicon (M1 ve sonrası) — hazır sürüm `arm64` için derlenir

## Geliştirme

```sh
npm install
npm run tauri:dev
```

Kontrol:

```sh
npm test
npm run lint
npm run build
```

Sürüm paketi:

```sh
npm run tauri:build
```

`.app` çıktısı `src-tauri/target/release/bundle/macos/` altındadır.
