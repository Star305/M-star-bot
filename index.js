const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');

const PHONE_NUMBER = '234'; // ← CHANGE TO YOUR NUMBER (digits only, no +)
const OWNER = PHONE_NUMBER + '@s.whatsapp.net';

const AUTH_FOLDER = './auth_info';

let pairingRequested = false;
const userStates = new Map(); // for quiz game

// Sample quiz questions
const quizQuestions = [
  { q: "What is the capital of Nigeria?", options: ["Lagos", "Abuja", "Kano", "Port Harcourt"], a: 1 },
  { q: "Which is the largest planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], a: 2 },
  { q: "What is 15 + 27?", options: ["32", "42", "52", "62"], a: 1 },
  { q: "Who painted Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], a: 2 },
  { q: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], a: 2 }
];

const jokes = [
  "Why don't programmers prefer dark mode? Because light attracts bugs! 😆",
  "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
  "Parallel lines have so much in common... it's a shame they'll never meet. 😢"
];

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
    const { connection, lastDisconnect, qr } = update;

    if ((connection === 'connecting' || qr) && !pairingRequested) {
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
      await sock.sendMessage(OWNER, { text: '🚀 *MSTARBOT v1.0 ACTIVATED*\nBy Mr. Emmanuel 🌹\nType .menu to begin!' });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const m of messages) {
      if (!m.message || m.key.fromMe) continue;
      const from = m.key.remoteJid;
      const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim().toLowerCase();

      if (!text.startsWith('.')) continue;

      const cmd = text.split(' ')[0];
      const args = text.slice(cmd.length + 1).trim();

      // ====================== COMMANDS ======================
      if (cmd === '.menu' || cmd === '.help') {
        const menu = `🌟 *MSTARBOT* by Mr. Emmanuel 🌹\n\n` +
                     `📜 *Main Commands*\n` +
                     `.menu - Show this menu\n` +
                     `.owner - Bot creator info\n` +
                     `.ping - Check speed\n` +
                     `.alive - Bot status\n` +
                     `.github - Source code\n\n` +
                     `🎮 *Games*\n` +
                     `.quiz - Start quiz game\n` +
                     `.endquiz - End quiz\n` +
                     `.coin - Coin flip\n` +
                     `.dice - Roll dice\n\n` +
                     `🖼️ *Media & Fun*\n` +
                     `.img <prompt> - AI Image Generation\n` +
                     `.joke - Random joke\n` +
                     `.fact - Random fact\n\n` +
                     `Type any command to use!\nPowered by Baileys + KataBump`;
        await sock.sendMessage(from, { text: menu });
      }

      else if (cmd === '.owner') {
        await sock.sendMessage(from, { text: '👑 *Bot Owner*\nMr. Emmanuel 🌹\nCreator of Real Drive Racing PRO & Anti-Bug Bot\nThank you for using MSTARBOT!' });
      }

      else if (cmd === '.ping') {
        const start = Date.now();
        await sock.sendMessage(from, { text: '🏓 Pinging...' });
        const speed = Date.now() - start;
        await sock.sendMessage(from, { text: `✅ *MSTARBOT Speed: ${speed}ms*` });
      }

      else if (cmd === '.alive') {
        await sock.sendMessage(from, { text: '🌟 MSTARBOT is Alive & Running 24/7 on KataBump!\nUptime: Always ON 🔥' });
      }

      else if (cmd === '.github' || cmd === '.repo') {
        await sock.sendMessage(from, { text: '📂 GitHub Repository:\nhttps://github.com/YOURUSERNAME/mstarbot\n(Replace with your actual repo link)' });
      }

      // Games
      else if (cmd === '.quiz') {
        if (userStates.has(from)) return await sock.sendMessage(from, { text: 'You already have an active quiz! Type .endquiz first.' });
        const q = quizQuestions[0];
        userStates.set(from, { index: 0, score: 0 });
        let msg = `🧠 *MSTARBOT Quiz Started!*\n\nQ1: ${q.q}\n\n`;
        q.options.forEach((opt, i) => msg += `${i+1}. ${opt}\n`);
        msg += '\nReply with the number (1-4)';
        await sock.sendMessage(from, { text: msg });
      }

      else if (cmd === '.endquiz') {
        if (!userStates.has(from)) return await sock.sendMessage(from, { text: 'No active quiz!' });
        const state = userStates.get(from);
        await sock.sendMessage(from, { text: `🏆 Quiz ended! Your score: \( {state.score}/ \){quizQuestions.length}` });
        userStates.delete(from);
      }

      else if (cmd === '.coin') {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await sock.sendMessage(from, { text: `🪙 Coin flip: *${result}*` });
      }

      else if (cmd === '.dice') {
        const roll = Math.floor(Math.random() * 6) + 1;
        await sock.sendMessage(from, { text: `🎲 You rolled: *${roll}*` });
      }

      else if (cmd === '.joke') {
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await sock.sendMessage(from, { text: `😂 ${joke}` });
      }

      else if (cmd === '.fact') {
        const facts = ["Octopuses have three hearts.", "Honey never spoils.", "A flock of flamingos is called a flamboyance."];
        await sock.sendMessage(from, { text: `🌍 Fun Fact: ${facts[Math.floor(Math.random() * facts.length)]}` });
      }

      // Image Generation
      else if (cmd === '.img' || cmd === '.generate' || cmd === '.aiimg') {
        const prompt = args || 'beautiful cyberpunk city at night';
        await sock.sendMessage(from, { text: '🎨 Generating image with MSTARBOT AI...' });
        try {
          const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&safe=false`;
          await sock.sendMessage(from, {
            image: { url },
            caption: `✅ Generated by *MSTARBOT* 🌟\nPrompt: ${prompt}`
          });
        } catch (e) {
          await sock.sendMessage(from, { text: '❌ Image generation failed. Try again.' });
        }
      }

      // Quiz answer handler
      if (userStates.has(from) && !isNaN(parseInt(text)) && text.length === 1) {
        const state = userStates.get(from);
        const currentQ = quizQuestions[state.index];
        const answer = parseInt(text) - 1;

        let reply = '';
        if (answer === currentQ.a) {
          state.score++;
          reply = '✅ Correct!';
        } else {
          reply = `❌ Wrong! Correct answer was ${currentQ.options[currentQ.a]}`;
        }

        state.index++;
        if (state.index < quizQuestions.length) {
          const nextQ = quizQuestions[state.index];
          let msg = `\( {reply}\n\nQ \){state.index + 1}: ${nextQ.q}\n\n`;
          nextQ.options.forEach((opt, i) => msg += `${i+1}. ${opt}\n`);
          msg += '\nReply with number';
          await sock.sendMessage(from, { text: msg });
        } else {
          await sock.sendMessage(from, { text: `🏆 Quiz Complete!\nYour final score: \( {state.score}/ \){quizQuestions.length}\nType .quiz to play again!` });
          userStates.delete(from);
        }
      }
    }
  });

  setInterval(() => {
    sock.sendMessage(OWNER, { text: '🛡️ MSTARBOT is still protecting & entertaining you on KataBump!' });
  }, 1800000);
}

startBot().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
