/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║              shadow-baileys  v1.0.0                       ║
 * ║  Drop-in replacement untuk @whiskeysockets/baileys        ║
 * ║  ─────────────────────────────────────────────────────── ║
 * ║  ✅ Re-export 100% semua export asli alipclutch-baileys   ║
 * ║  ✅ makeWASocket otomatis extend dengan custom methods:   ║
 * ║       • sendCodeBlock      (native WA code block UI)      ║
 * ║       • sendCodeBlockV2    (dengan text/footer/language)  ║
 * ║       • sendText           (text + mention)               ║
 * ║       • sendImage          (image + caption)              ║
 * ║       • sendVideo          (video + caption)              ║
 * ║       • sendAudio          (audio/ptt)                    ║
 * ║       • sendSticker        (sticker)                      ║
 * ║       • sendDocument       (file/dokumen)                 ║
 * ║       • sendMedia          (auto-detect tipe)             ║
 * ║       • sendInteractive    (interactiveMessage generic)   ║
 * ║       • downloadMedia      (download ke Buffer)           ║
 * ║       • react              (emoji reaction)               ║
 * ║       • reply              (quick reply text)             ║
 * ║       • parseMention       (parse @mention)               ║
 * ║       • getName            (ambil nama kontak/grup)       ║
 * ║  ✅ Auto-update checker tiap 6 jam                        ║
 * ║  ✅ Kompatibel penuh dengan Shadow MD CJS structure       ║
 * ╚═══════════════════════════════════════════════════════════╝
 *
 * CARA PAKAI:
 *   1. Taruh folder shadow-baileys/ di root bot kamu
 *   2. Di package.json bot:
 *      "@whiskeysockets/baileys": "file:./shadow-baileys"
 *   3. npm install
 *   4. Selesai — semua require('@whiskeysockets/baileys') otomatis pakai ini
 */

'use strict';

// ── Re-export semua dari alipclutch-baileys ────────────────────────────────
const originalBaileys = require('alipclutch-baileys');
module.exports = { ...originalBaileys };

// ── Import helpers ─────────────────────────────────────────────────────────
const { extendSocket }          = require('./lib/extend-socket');
const { startAutoUpdateChecker } = require('./lib/auto-update');

// ── Auto-update checker (jalankan sekali saat module di-load) ──────────────
let _updateStarted = false;
if (!_updateStarted) {
    _updateStarted = true;
    setImmediate(() => startAutoUpdateChecker());
}

// ── Wrap makeWASocket ──────────────────────────────────────────────────────
const _originalMakeWASocket = originalBaileys.default || originalBaileys.makeWASocket;

/**
 * makeWASocket — wrapper yang otomatis extend socket dengan custom methods.
 * Signature 100% sama dengan makeWASocket asli.
 */
function makeWASocket(config) {
    const sock = _originalMakeWASocket(config);
    extendSocket(sock);
    return sock;
}

// Export sebagai default DAN named (kompatibel dengan CJS destructure)
module.exports.default       = makeWASocket;
module.exports.makeWASocket  = makeWASocket;

// ── Re-export WAconnection (alias makeWASocket untuk Shadow MD) ────────────
module.exports.WAconnection  = makeWASocket;

// ── Pastikan semua named export asli tetap ada ────────────────────────────
const REQUIRED_EXPORTS = [
    'BufferJSON', 'WA_DEFAULT_EPHEMERAL', 'S_WHATSAPP_NET',
    'generateWAMessageFromContent', 'proto', 'getBinaryNodeChildren',
    'useMultiFileAuthState', 'generateWAMessageContent',
    'downloadContentFromMessage', 'generateWAMessage',
    'prepareWAMessageMedia', 'areJidsSameUser', 'getContentType',
    'DisconnectReason', 'fetchLatestBaileysVersion',
    'makeCacheableSignalKeyStore', 'Browsers',
    'isJidBroadcast', 'isJidGroup', 'isJidUser',
    'jidNormalizedUser', 'jidDecode', 'jidEncode',
    'getDevice', 'extractMessageContent', 'normalizeMessageContent',
    'generateForwardMessageContent', 'generateWAMessageContent',
    'downloadMediaMessage', 'getStream', 'toBuffer',
];

for (const key of REQUIRED_EXPORTS) {
    if (originalBaileys[key] !== undefined && module.exports[key] === undefined) {
        module.exports[key] = originalBaileys[key];
    }
}
