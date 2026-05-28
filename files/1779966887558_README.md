# shadow-baileys

Custom Baileys fork untuk **Shadow MD** — drop-in replacement `@whiskeysockets/baileys` dengan fitur lengkap.

---

## Cara Install

### 1. Taruh folder `shadow-baileys/` di root bot kamu
```
ShadowMD/
├── shadow-baileys/      ← folder ini
├── alipai-cmd.js
├── index.js
├── package.json
└── ...
```

### 2. Edit `package.json` bot kamu
Ganti baris `@whiskeysockets/baileys`:
```json
"@whiskeysockets/baileys": "file:./shadow-baileys"
```

### 3. Install
```bash
npm install
```

Selesai! Semua `require('@whiskeysockets/baileys')` otomatis pakai shadow-baileys.

---

## Fitur Tambahan

| Method | Deskripsi |
|--------|-----------|
| `sock.sendCodeBlock(jid, code, quoted)` | Native WhatsApp code block UI |
| `sock.sendCodeBlockV2(jid, code, quoted, opts)` | Code block + text atas + footer bawah |
| `sock.sendText(jid, text, quoted, opts)` | Kirim teks + auto mention |
| `sock.sendImage(jid, image, caption, quoted)` | Kirim gambar |
| `sock.sendVideo(jid, video, caption, quoted)` | Kirim video |
| `sock.sendAudio(jid, audio, ptt, quoted)` | Kirim audio / voice note |
| `sock.sendSticker(jid, sticker, quoted)` | Kirim sticker |
| `sock.sendDocument(jid, doc, mime, name, caption, quoted)` | Kirim dokumen |
| `sock.sendMedia(jid, buffer, caption, quoted)` | Auto-detect & kirim media |
| `sock.sendInteractive(jid, opts)` | Generic interactiveMessage |
| `sock.downloadMedia(message)` | Download media ke Buffer |
| `sock.react(jid, emoji, key)` | React emoji |
| `sock.reply(jid, text, quoted)` | Quick reply |
| `sock.parseMention(text)` | Parse @mention dari teks |
| `sock.getName(jid)` | Ambil nama kontak/grup |

### sendCodeBlockV2 Options
```js
await alip.sendCodeBlockV2(m.chat, code, troliReply, {
    language : 'javascript',   // js, ts, py, java, php, go, dll
    text     : '📋 Info teks di atas kode',
    footer   : '_Note: bisa langsung copy_',
});
```

### sendInteractive Options
```js
await alip.sendInteractive(m.chat, {
    body      : 'Teks isi pesan',
    footer    : 'Footer teks',
    title     : 'Judul header',
    image     : { url: 'https://...' },   // atau Buffer
    buttons   : [{ name: 'cta_url', buttonParamsJson: '...' }],
    quotedMsg : m,
});
```

---

## Auto-Update

shadow-baileys otomatis cek update dari GitHub tiap 6 jam.
Jika ada versi baru, notif muncul di console.

Untuk update manual:
```bash
# Kalau pakai file:// local
cd shadow-baileys && git pull
npm install

# Kalau sudah di-publish ke npm
npm install shadow-baileys@latest
```

---

## Kompatibilitas

- ✅ Shadow MD (CommonJS)
- ✅ Semua bot dengan struktur `require('@whiskeysockets/baileys')`
- ✅ `const { default: WAconnection, proto, prepareWAMessageMedia, ... } = require('@whiskeysockets/baileys')`
- ✅ alipclutch-baileys sebagai base
