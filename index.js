// ====================== MSTARBOT v2.0 ======================
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');

const PHONE_NUMBER = '2347012345678'; // ← CHANGE TO YOUR NUMBER
const OWNER = PHONE_NUMBER + '@s.whatsapp.net';
const AUTH_FOLDER = './auth_info';

let pairingRequested = false;
const userStates = new Map(); // For quiz game

// Sample quiz questions
const quizQuestions = [
    { q: "What is the capital of Nigeria?", options: ["Lagos", "Abuja", "Kano", "Port Harcourt"], a: 1 },
    { q: "Which is the largest planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], a: 2 },
    { q: "What is 15 + 27?", options: ["32", "42", "52", "62"], a: 1 },
    { q: "Who painted Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], a: 2 },
    { q: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], a: 2 }
];

// Jokes array
const jokes = [
    "Why don't programmers prefer dark mode? Because light attracts bugs! 😆",
    "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
    "Parallel lines have so much in common... it's a shame they'll never meet. 😢"
];

// ------------------- START BOT -------------------
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        // ------------------- PAIRING -------------------
        if ((connection === 'connecting') && !pairingRequested) {
            pairingRequested = true;
            if (!sock.authState.creds.registered) {
                try {
                    const code = await sock.requestPairingCode(PHONE_NUMBER);
                    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                    console.log('\n🔥════════════════════════════════════════════');
                    console.log(`   MSTARBOT PAIRING CODE: ${formatted}`);
                    console.log('════════════════════════════════════════════');
                    console.log('📱 Steps to link:');
                    console.log('1. Open WhatsApp on your phone');
                    console.log('2. Settings → Linked Devices → Link a Device');
                    console.log('3. Tap "Link with phone number instead"');
                    console.log(`4. Enter the MSTARBOT code above\n`);
                } catch (e) {
                    console.log('Pairing error:', e.message);
                }
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error instanceof Boom
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;
            if (shouldReconnect) {
                console.log('Reconnecting in 3s...');
                setTimeout(startBot, 3000);
            }
        } else if (connection === 'open') {
            console.log('✅ MSTARBOT IS NOW ONLINE! 🌟');
            await sock.sendMessage(OWNER, { text: '🚀 *MSTARBOT v2.0 ACTIVATED*\nBy Mr. Emmanuel 🌹\nType /menu to begin!' });
        }
    });

    // ------------------- MESSAGES HANDLER -------------------
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            if (!m.message || m.key.fromMe) continue;
            const from = m.key.remoteJid;
            const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim();
            const lowerText = text.toLowerCase();
            const cmd = lowerText.split(' ')[0];
            const args = text.slice(cmd.length + 1).trim();

            // ------------------- MENU COMMAND -------------------
            if (cmd === '/menu' || cmd === '/help') {
                const date = moment().tz('Africa/Lagos');
                const userName = m.pushName || 'User';
                const prefix = '/';
                const botVersion = 'EF-PRIME-MD-ULTRA';
                const totalCommands = 546;

                const menu = `╭─❒ ❀ *M star bot* ❒
├⬡ 👤 User: ${userName}
├⬡ 🆔 ID: @⁨Mr. Emmanuel 🌹⁩
├⬡ 👑 Status: FREE
├⬡ 🎫 Limit: 100
├⬡ 💰 Money: 10.000
├⬡ 🌐 Prefix: ${prefix}
├⬡ 🤖 Bot: Authur
├⬡ 👨‍💻 Owner: @145917739024404
├⬡ 🔄 Mode: Public
├⬡ 📅 Date: ${date.format('DD/MM/YYYY')}
├⬡ 📆 Day: ${date.format('dddd')}
├⬡ ⏰ Time: ${date.format('HH:mm:ss')} WIB
╰────────────❒

╭────❒ *⚙️ SETTINGS* ❒
├⬡ ${prefix}bot set
├⬡ ${prefix}group set
╰────────────❒

╭────❒ *⭐ STAR CORE* ❒
├⬡ ${prefix}profile
├⬡ ${prefix}claim
├⬡ ${prefix}buy
├⬡ ${prefix}transfer
├⬡ ${prefix}leaderboard
├⬡ ${prefix}request
├⬡ ${prefix}react
├⬡ ${prefix}tagme
├⬡ ${prefix}runtime
├⬡ ${prefix}features
├⬡ ${prefix}speed
├⬡ ${prefix}ping
├⬡ ${prefix}afk
├⬡ ${prefix}rvo
├⬡ ${prefix}inspect
├⬡ ${prefix}addmsg
├⬡ ${prefix}delmsg
├⬡ ${prefix}getmsg
├⬡ ${prefix}listmsg
├⬡ ${prefix}quoted
├⬡ ${prefix}menfes
├⬡ ${prefix}confes
├⬡ ${prefix}autoai
├⬡ ${prefix}delautoai
├⬡ ${prefix}rentbot 🅟
├⬡ ${prefix}stoprent
├⬡ ${prefix}listrent
├⬡ ${prefix}donasi
├⬡ ${prefix}addsewa
├⬡ ${prefix}delsewa
├⬡ ${prefix}listsewa
╰────────────❒


╭─────────❒
├⬡ Total Commands: ${totalCommands}
├⬡ Bot Version: ${botVersion}
├⬡ Current Prefix: ${prefix}
├⬡ 💡 *TIP:* Use \`${prefix}help <command>\` for detailed info
╰────────────❒
*${botVersion}* 

> 😎 *Mr. Emmanuel 🌹*`;

                await sock.sendMessage(from, { text: menu });
            }

            // ------------------- OWNER -------------------
            else if (cmd === '/owner') {
                await sock.sendMessage(from, { text: '👑 *Bot Owner*\nMr. Emmanuel 🌹\nCreator of MSTARBOT\nThank you for using it!' });
            }

            // ------------------- QUIZ -------------------
            else if (cmd === '/quiz') {
                if (userStates.has(from)) return await sock.sendMessage(from, { text: 'You already have an active quiz! Type /endquiz first.' });
                const q = quizQuestions[0];
                userStates.set(from, { index: 0, score: 0 });
                let msg = `🧠 *MSTARBOT Quiz Started!*\n\nQ1: ${q.q}\n`;
                q.options.forEach((opt, i) => msg += `${i + 1}. ${opt}\n`);
                msg += '\nReply with the number (1-4)';
                await sock.sendMessage(from, { text: msg });
            } else if (cmd === '/endquiz') {
                if (!userStates.has(from)) return await sock.sendMessage(from, { text: 'No active quiz!' });
                const state = userStates.get(from);
                await sock.sendMessage(from, { text: `🏆 Quiz ended! Your score: ${state.score}/${quizQuestions.length}` });
                userStates.delete(from);
            }

            // ------------------- FUN -------------------
            else if (cmd === '/joke') {
                const joke = jokes[Math.floor(Math.random() * jokes.length)];
                await sock.sendMessage(from, { text: `😂 ${joke}` });
            }

            // ------------------- QUIZ ANSWER HANDLER -------------------
            if (userStates.has(from) && !isNaN(parseInt(text)) && text.length === 1) {
                const state = userStates.get(from);
                const currentQ = quizQuestions[state.index];
                const answer = parseInt(text) - 1;

                let reply = '';
                if (answer === currentQ.a) {
                    state.score++;
                    reply = '✅ Correct!';
                } else {
                    reply = `❌ Wrong! Correct answer: ${currentQ.options[currentQ.a]}`;
                }

                state.index++;
                if (state.index < quizQuestions.length) {
                    const nextQ = quizQuestions[state.index];
                    let msg = `${reply}\n\nQ${state.index + 1}: ${nextQ.q}\n`;
                    nextQ.options.forEach((opt, i) => msg += `${i + 1}. ${opt}\n`);
                    msg += '\nReply with the number (1-4)';
                    await sock.sendMessage(from, { text: msg });
                } else {
                    await sock.sendMessage(from, { text: `🏆 Quiz Complete!\nYour final score: ${state.score}/${quizQuestions.length}\nType /quiz to play again!` });
                    userStates.delete(from);
                }
            }
        }
    });

    // ------------------- KEEPALIVE -------------------
    setInterval(() => {
        sock.sendMessage(OWNER, { text: '🛡️ MSTARBOT is still protecting & entertaining you on KataBump!' });
    }, 1800000);
}

// ------------------- START -------------------
startBot().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
