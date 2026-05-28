/**
 * shadow-baileys — lib/extend-socket.js
 * Extend sock dengan semua custom method:
 *   sendCodeBlock, sendCodeBlockV2, sendText, sendMedia,
 *   sendImage, sendVideo, sendAudio, sendSticker, sendDocument,
 *   reply, getName, parseMention, downloadMedia, react
 */

'use strict';

const {
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    proto,
    areJidsSameUser,
    downloadContentFromMessage,
} = require('alipclutch-baileys');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MIME_MAP = {
    javascript : 'text/x-javascript',  js   : 'text/x-javascript',
    typescript : 'text/x-typescript',  ts   : 'text/x-typescript',
    python     : 'text/x-python',      py   : 'text/x-python',
    java       : 'text/x-java-source',
    cpp        : 'text/x-c++src',
    c          : 'text/x-csrc',
    html       : 'text/html',
    css        : 'text/css',
    json       : 'application/json',
    bash       : 'text/x-shellscript', sh   : 'text/x-shellscript',
    php        : 'application/x-httpd-php',
    go         : 'text/x-go',
    rust       : 'text/x-rustsrc',     rs   : 'text/x-rustsrc',
    kotlin     : 'text/x-kotlin',      kt   : 'text/x-kotlin',
    swift      : 'text/x-swift',
    lua        : 'text/x-lua',
    ruby       : 'application/x-ruby', rb   : 'application/x-ruby',
    xml        : 'text/xml',
    sql        : 'text/x-sql',
    yaml       : 'text/x-yaml',        yml  : 'text/x-yaml',
};

const EXT_MAP = {
    javascript : 'js',  js : 'js',
    typescript : 'ts',  ts : 'ts',
    python     : 'py',  py : 'py',
    java       : 'java', cpp : 'cpp', c : 'c',
    html       : 'html', css : 'css', json : 'json',
    bash       : 'sh',  sh : 'sh',
    php        : 'php', go : 'go',
    rust       : 'rs',  rs : 'rs',
    kotlin     : 'kt',  kt : 'kt',
    swift      : 'swift', lua : 'lua',
    ruby       : 'rb',  rb : 'rb',
    xml        : 'xml', sql : 'sql',
    yaml       : 'yaml', yml : 'yaml',
};

/**
 * Buat contextInfo dari quoted message
 */
function makeCtx(quotedMsg) {
    if (!quotedMsg) return {};
    return {
        stanzaId      : quotedMsg.key?.id,
        participant   : quotedMsg.key?.participant || quotedMsg.sender,
        quotedMessage : quotedMsg.message,
    };
}

// ─── Extend function ─────────────────────────────────────────────────────────

/**
 * extendSocket(sock)
 * Tambahkan semua custom method ke socket.
 * Dipanggil otomatis di makeWASocket wrapper.
 */
function extendSocket(sock) {

    // ── sendCodeBlock ────────────────────────────────────────────────────────
    // Kirim kode sebagai native WhatsApp code block (Javascript kode / Lihat kode)
    sock.sendCodeBlock = async function (jid, code, quotedMsg) {
        try {
            const buf   = Buffer.from(String(code), 'utf-8');
            const media = await prepareWAMessageMedia(
                { document: buf, mimetype: 'text/x-javascript', fileName: 'code.js' },
                { upload: sock.waUploadToServer }
            );
            const msg = generateWAMessageFromContent(jid, {
                viewOnceMessage: { message: {
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body   : proto.Message.InteractiveMessage.Body.create({ text: '' }),
                        footer : proto.Message.InteractiveMessage.Footer.create({ text: '' }),
                        header : proto.Message.InteractiveMessage.Header.create({
                            title: '', hasMediaAttachment: true,
                            documentMessage: media.documentMessage,
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: [] }),
                        contextInfo: makeCtx(quotedMsg),
                    }),
                }},
            }, {});
            return await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
        } catch (e) { console.error('[ShadowBaileys] sendCodeBlock:', e.message); }
    };

    // ── sendCodeBlockV2 ──────────────────────────────────────────────────────
    // Kirim kode dengan info text (atas) + code block + footer (bawah)
    // opts: { language, text, footer, title }
    sock.sendCodeBlockV2 = async function (jid, code, quotedMsg, opts = {}) {
        try {
            const { language = 'javascript', text = '', footer = '' } = opts;
            const lang  = (language || 'javascript').toLowerCase();
            const mime  = MIME_MAP[lang] || 'text/x-javascript';
            const ext   = EXT_MAP[lang]  || 'js';
            const buf   = Buffer.from(String(code), 'utf-8');

            const media = await prepareWAMessageMedia(
                { document: buf, mimetype: mime, fileName: `code.${ext}` },
                { upload: sock.waUploadToServer }
            );
            const msg = generateWAMessageFromContent(jid, {
                viewOnceMessage: { message: {
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body   : proto.Message.InteractiveMessage.Body.create({ text: text || '' }),
                        footer : proto.Message.InteractiveMessage.Footer.create({ text: footer || '' }),
                        header : proto.Message.InteractiveMessage.Header.create({
                            title: '', hasMediaAttachment: true,
                            documentMessage: media.documentMessage,
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: [] }),
                        contextInfo: makeCtx(quotedMsg),
                    }),
                }},
            }, {});
            return await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
        } catch (e) { console.error('[ShadowBaileys] sendCodeBlockV2:', e.message); }
    };

    // ── sendText ─────────────────────────────────────────────────────────────
    sock.sendText = async function (jid, text, quotedMsg, options = {}) {
        return sock.sendMessage(jid,
            { text, mentions: sock.parseMention ? sock.parseMention(text) : [], ...options },
            { quoted: quotedMsg }
        );
    };

    // ── reply ────────────────────────────────────────────────────────────────
    if (!sock.reply) {
        sock.reply = function (jid, text, quotedMsg, options = {}) {
            return sock.sendMessage(jid,
                { text, mentions: sock.parseMention ? sock.parseMention(text) : [], ...options },
                { quoted: quotedMsg }
            );
        };
    }

    // ── react ────────────────────────────────────────────────────────────────
    sock.react = async function (jid, emoji, key) {
        return sock.sendMessage(jid, { react: { text: emoji, key } });
    };

    // ── sendImage ────────────────────────────────────────────────────────────
    sock.sendImage = async function (jid, image, caption = '', quotedMsg, options = {}) {
        return sock.sendMessage(jid,
            { image, caption, ...options },
            { quoted: quotedMsg }
        );
    };

    // ── sendVideo ────────────────────────────────────────────────────────────
    sock.sendVideo = async function (jid, video, caption = '', quotedMsg, options = {}) {
        return sock.sendMessage(jid,
            { video, caption, ...options },
            { quoted: quotedMsg }
        );
    };

    // ── sendAudio ────────────────────────────────────────────────────────────
    sock.sendAudio = async function (jid, audio, ptt = false, quotedMsg, options = {}) {
        return sock.sendMessage(jid,
            { audio, ptt, mimetype: 'audio/mp4', ...options },
            { quoted: quotedMsg }
        );
    };

    // ── sendSticker ──────────────────────────────────────────────────────────
    sock.sendSticker = async function (jid, sticker, quotedMsg, options = {}) {
        return sock.sendMessage(jid,
            { sticker, ...options },
            { quoted: quotedMsg }
        );
    };

    // ── sendDocument ─────────────────────────────────────────────────────────
    sock.sendDocument = async function (jid, document, mimetype, fileName, caption = '', quotedMsg, options = {}) {
        return sock.sendMessage(jid,
            { document, mimetype, fileName, caption, ...options },
            { quoted: quotedMsg }
        );
    };

    // ── sendMedia (universal) ─────────────────────────────────────────────────
    // Auto-detect tipe berdasarkan mimetype
    sock.sendMedia = async function (jid, buffer, caption = '', quotedMsg, options = {}) {
        let mime = options.mimetype || '';
        if (!mime) {
            try {
                const { fileTypeFromBuffer } = require('file-type');
                const ft = await fileTypeFromBuffer(buffer);
                mime = ft ? ft.mime : 'application/octet-stream';
            } catch { mime = 'application/octet-stream'; }
        }

        if (mime.startsWith('image/')) {
            return sock.sendMessage(jid, { image: buffer, caption, ...options }, { quoted: quotedMsg });
        } else if (mime.startsWith('video/')) {
            return sock.sendMessage(jid, { video: buffer, caption, ...options }, { quoted: quotedMsg });
        } else if (mime.startsWith('audio/')) {
            return sock.sendMessage(jid, { audio: buffer, ptt: false, mimetype: mime, ...options }, { quoted: quotedMsg });
        } else {
            return sock.sendMessage(jid, {
                document: buffer, mimetype: mime,
                fileName: options.fileName || 'file',
                caption, ...options
            }, { quoted: quotedMsg });
        }
    };

    // ── downloadMedia ────────────────────────────────────────────────────────
    // Download media dari quoted/message ke Buffer
    sock.downloadMedia = async function (message) {
        const msg       = message.msg || message;
        const mediaType = Object.keys(msg)[0];
        const mediaMsg  = msg[mediaType];
        if (!mediaMsg) return null;

        const stream   = await downloadContentFromMessage(mediaMsg, mediaType.replace('Message', ''));
        const chunks   = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
    };

    // ── parseMention ─────────────────────────────────────────────────────────
    if (!sock.parseMention) {
        sock.parseMention = function (text = '') {
            return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
        };
    }

    // ── getName ───────────────────────────────────────────────────────────────
    if (!sock.getName) {
        sock.getName = async function (jid) {
            try {
                const id = jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
                if (sock.store?.contacts?.[id]) {
                    const c = sock.store.contacts[id];
                    return c.name || c.verifiedName || c.notify || jid.split('@')[0];
                }
                return jid.split('@')[0];
            } catch { return jid.split('@')[0]; }
        };
    }

    // ── sendInteractive (generic) ─────────────────────────────────────────────
    // Kirim interactiveMessage dengan image/document header + buttons
    sock.sendInteractive = async function (jid, opts = {}) {
        const {
            body = '', footer = '', title = '',
            image, document, buttons = [],
            quotedMsg,
        } = opts;

        let headerObj = {};
        if (image) {
            const media = await prepareWAMessageMedia({ image }, { upload: sock.waUploadToServer });
            headerObj = { title, hasMediaAttachment: true, imageMessage: media.imageMessage };
        } else if (document) {
            const { buf, mimetype = 'application/pdf', fileName = 'file.pdf' } = document;
            const media = await prepareWAMessageMedia(
                { document: buf, mimetype, fileName },
                { upload: sock.waUploadToServer }
            );
            headerObj = { title, hasMediaAttachment: true, documentMessage: media.documentMessage };
        } else {
            headerObj = { title, hasMediaAttachment: false };
        }

        const msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: { message: {
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body  : proto.Message.InteractiveMessage.Body.create({ text: body }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
                    header: proto.Message.InteractiveMessage.Header.create(headerObj),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons }),
                    contextInfo: makeCtx(quotedMsg),
                }),
            }},
        }, {});
        return sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    };

    return sock;
}

module.exports = { extendSocket, MIME_MAP, EXT_MAP };
