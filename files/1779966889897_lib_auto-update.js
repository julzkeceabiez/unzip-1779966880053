/**
 * shadow-baileys — lib/auto-update.js
 * Cek versi terbaru shadow-baileys dari GitHub releases
 * Jika ada update, print notif di console saat bot start
 */

'use strict';

const CURRENT_VERSION = require('../package.json').version;
const REPO            = 'ShadowMD-Dev/shadow-baileys'; // ganti sesuai repo kamu
const CHECK_INTERVAL  = 6 * 60 * 60 * 1000; // cek tiap 6 jam

let _timer = null;

async function checkUpdate(silent = false) {
    try {
        const fetch = require('node-fetch');
        const res   = await fetch(
            `https://api.github.com/repos/${REPO}/releases/latest`,
            { headers: { 'User-Agent': 'shadow-baileys-auto-update' }, timeout: 8000 }
        );
        if (!res.ok) return;

        const data   = await res.json();
        const latest = (data.tag_name || '').replace(/^v/, '');
        if (!latest) return;

        const [cMaj, cMin, cPat] = CURRENT_VERSION.split('.').map(Number);
        const [lMaj, lMin, lPat] = latest.split('.').map(Number);

        const hasUpdate =
            lMaj > cMaj ||
            (lMaj === cMaj && lMin > cMin) ||
            (lMaj === cMaj && lMin === cMin && lPat > cPat);

        if (hasUpdate) {
            console.log('\n╔════════════════════════════════════════╗');
            console.log('║  🔔  shadow-baileys UPDATE TERSEDIA    ║');
            console.log(`║  Versi saat ini : v${CURRENT_VERSION.padEnd(22)} ║`);
            console.log(`║  Versi terbaru  : v${latest.padEnd(22)} ║`);
            console.log('║  Jalankan:                             ║');
            console.log('║  npm install shadow-baileys@latest     ║');
            console.log('╚════════════════════════════════════════╝\n');
        } else if (!silent) {
            console.log(`[ShadowBaileys] ✅ Versi terbaru (v${CURRENT_VERSION})`);
        }
    } catch {
        // Gagal cek update — tidak masalah, bot tetap jalan
    }
}

/**
 * Mulai auto-update checker.
 * Dipanggil otomatis saat makeWASocket pertama kali dijalankan.
 */
function startAutoUpdateChecker() {
    checkUpdate(false);                          // cek langsung saat start
    if (_timer) clearInterval(_timer);
    _timer = setInterval(() => checkUpdate(true), CHECK_INTERVAL);
    _timer.unref?.();                            // jangan block proses exit
}

module.exports = { startAutoUpdateChecker, checkUpdate };
