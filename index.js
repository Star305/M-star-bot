const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');

const PHONE_NUMBER = '2349060245012'; // ← CHANGE TO YOUR NUMBER (digits only)
const OWNER = PHONE_NUMBER + '2349060245012@s.whatsapp.net';

const AUTH_FOLDER = './auth_info';
const DATA_FILE = './userData.json';

let userData = {};
if (fs.existsSync(DATA_FILE)) {
  userData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

let pairingRequested = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('M STAR BOT'),
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
          console.log(`   M STAR BOT PAIRING CODE: ${formatted}`);
          console.log('════════════════════════════════════════════');
          console.log('📱 WhatsApp → Settings → Linked Devices → "Link with phone number instead"');
          console.log('Paste the code above (valid 60 seconds)\n');
        } catch (e) {
          console.log('Pairing error:', e.message);
        }
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : null;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.badSession;
      console.log(`Connection closed (${statusCode}). Reconnecting...`);
      if (shouldReconnect) setTimeout(startBot, 4000);
    } else if (connection === 'open') {
      console.log('✅ M STAR BOT V1 ONLINE – By Mr. Emmanuel 🌹');
      await sock.sendMessage(OWNER, { text: '🚀 *M STAR BOT v1 ACTIVATED*\nType /menu everywhere!' });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const m of messages) {
      if (!m.message || m.key.fromMe) continue;

      const from = m.key.remoteJid;
      const pushName = m.pushName || from.split('@')[0];
      const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim();

      if (!text.startsWith('/')) continue;

      const args = text.slice(1).trim().split(' ');
      const cmd = args.shift().toLowerCase();
      const q = args.join(' ');

      if (!userData[from]) {
        userData[from] = { name: pushName, limit: 1000, money: 10000, status: 'FREE', lastClaim: 0 };
        saveData();
      }
      const user = userData[from];

      const now = new Date();
      const options = { timeZone: 'Africa/Lagos' };
      const time = now.toLocaleTimeString('en-NG', options);
      const date = now.toLocaleDateString('en-NG', options);
      const day = now.toLocaleString('en-NG', { weekday: 'long', timeZone: 'Africa/Lagos' });

      if (cmd === 'menu' || cmd === 'help') {
        const menu = `╭─❒ ✦ *M STAR BOT* ❒
├⬡ 👤 User: ${pushName}
├⬡ 🆔 ID: ${from.split('@')[0]}
├⬡ 👑 Status: ${user.status}
├⬡ 🎫 Limit: ${user.limit}
├⬡ 💰 Money: ${user.money.toLocaleString()}
├⬡ 🌐 Prefix: /
├⬡ 🤖 Bot: M STAR BOT 
├⬡ 👨‍💻 Owner: Mr. Emmanuel 🌹
├⬡ 🔄 Mode: Public
├⬡ 📅 Date: ${date}
├⬡ 📆 Day: ${day}
├⬡ ⏰ Time: ${time}
╰────────────❒

╭────❒ *⚙️ SETTINGS* ❒
├⬡ /bot set
├⬡ /group set
╰────────────❒

╭────❒ *⭐ PRIME CORE* ❒
├⬡ /profile
├⬡ /claim
├⬡ /buy
├⬡ /transfer
├⬡ /leaderboard
├⬡ /request
├⬡ /react
├⬡ /tagme
├⬡ /runtime
├⬡ /features
├⬡ /speed
├⬡ /ping
├⬡ /afk
├⬡ /rvo
├⬡ /inspect
├⬡ /addmsg
├⬡ /delmsg
├⬡ /getmsg
├⬡ /listmsg
├⬡ /quoted
├⬡ /menfes
├⬡ /confes
├⬡ /autoai
├⬡ /delautoai
├⬡ /rentbot 🅟
├⬡ /stoprent
├⬡ /listrent
├⬡ /donasi
├⬡ /addsewa
├⬡ /delsewa
├⬡ /listsewa
╰────────────❒

╭────❒ *🛡️ GROUP CONTROL* ❒
├⬡ /add
├⬡ /kick
├⬡ /promote
├⬡ /demote
├⬡ /warn
├⬡ /unwarn
├⬡ /setname
├⬡ /setdesc
├⬡ /setppgc
├⬡ /delete
├⬡ /linkgrup
├⬡ /revoke
├⬡ /tagall
├⬡ /pin
├⬡ /unpin
├⬡ /hidetag
├⬡ /totag
├⬡ /listonline
├⬡ /group set
├⬡ /group
╰────────────❒

╭────❒ *🎨 TEXTPRO FORGE* ❒
├⬡ /mascot
├⬡ /foggy
├⬡ /galaxy
├⬡ /golden
├⬡ /mettalic
├⬡ /gradient
├⬡ /metal
├⬡ /jewel
├⬡ /gaming
├⬡ /sand
├⬡ /blackpink
├⬡ /colorful
├⬡ /matirx
├⬡ /wings
├⬡ /hacker
├⬡ /logo
├⬡ /typo
╰────────────❒

╭────❒ *🔍 SEARCH ENGINE* ❒
├⬡ /ytsearch
├⬡ /spotify
├⬡ /pixiv
├⬡ /pinterest
├⬡ /wallpaper
├⬡ /ringtone
├⬡ /google
├⬡ /bing
├⬡ /gimage
├⬡ /bingimg
├⬡ /wattpad
├⬡ /wikipedia
├⬡ /technews
├⬡ /trends
├⬡ /npm
├⬡ /style
├⬡ /weather
├⬡ /tenor
├⬡ /urban
├⬡ /lyrics 
╰────────────❒

╭────❒ *📥 DOWNLOAD HUB* ❒
├⬡ /ytmp3
├⬡ /ytmp4
├⬡ /instagram
├⬡ /tiktok
├⬡ /tiktokmp3
├⬡ /twitter
├⬡ /facebook
├⬡ /spotifydl
├⬡ /mediafire
╰────────────❒

╭────❒ *💭 WISDOM QUOTES* ❒
├⬡ /motivation
├⬡ /islamic
├⬡ /quotes
├⬡ /funfact
├⬡ /lifehack
├⬡ /pickup
├⬡ /program
├⬡ /tech
├⬡ /why
╰────────────❒

╭────❒ *🛠️ UTILITY TOOLS* ❒
├⬡ /get 🅟
├⬡ /hd
├⬡ /define
├⬡ /toaudio
├⬡ /tomp3
├⬡ /tovn
├⬡ /toimage
├⬡ /toptv
├⬡ /tourl
├⬡ /tts
├⬡ /toqr
├⬡ /brat
├⬡ /bratvid
├⬡ /ssweb 🅟
├⬡ /sticker
├⬡ /colong
├⬡ /smeme
├⬡ /dehaze
├⬡ /colorize
├⬡ /toblock
├⬡ /emojimix
├⬡ /nulis
├⬡ /readmore
├⬡ /qc
├⬡ /translate
├⬡ /wasted
├⬡ /triggered
├⬡ /shorturl
├⬡ /gitclone
├⬡ /fat
├⬡ /fast
├⬡ /bass
├⬡ /slow
├⬡ /tupai
├⬡ /deep
├⬡ /robot
├⬡ /blown
├⬡ /reverse
├⬡ /smooth
├⬡ /earrape
├⬡ /nightcore
├⬡ /getexif
╰────────────❒

╭────❒ *🤖 AI NEURAL NET* ❒
├⬡ /ai
├⬡ /simi
├⬡ /gemini
├⬡ /txt2img
╰────────────❒

╭────❒ *🌸 ANIME DIMENSION* ❒
├⬡ /waifu
├⬡ /neko
├⬡ /akiyama
├⬡ /akira
├⬡ /anna
├⬡ /asuna
├⬡ /boruto
├⬡ /chiho
├⬡ /cosplay
├⬡ /eba
├⬡ /emilia
├⬡ /erza
├⬡ /hinata
├⬡ /isuzu
├⬡ /itachi
├⬡ /mikasa
├⬡ /miku
├⬡ /naruto
├⬡ /sagiri
├⬡ /sasuke
├⬡ /yuri
╰────────────❒

╭────❒ *🎮 GAME ARENA* ❒
├⬡ /tictactoe
├⬡ /akinator
├⬡ /suit
├⬡ /slot
├⬡ /mathquiz
├⬡ /begal
├⬡ /snakeladder
├⬡ /blackjack
├⬡ /catur
├⬡ /casino
├⬡ /samgong
├⬡ /rampok
├⬡ /riddle
├⬡ /guesslyrics
├⬡ /guessword
├⬡ /guessbomb
├⬡ /arrangeword
├⬡ /colorblind
├⬡ /guesschemistry
├⬡ /trivia
├⬡ /guessnumber
├⬡ /guesscountry
├⬡ /guesspicture
├⬡ /Flag
╰────────────❒

╭────❒ *🎪 FUN ZONE* ❒
├⬡ /tryluck
├⬡ /dice
├⬡ /canthey
├⬡ /isit
├⬡ /when
├⬡ /who
├⬡ /magicshell
├⬡ /checkdeath
├⬡ /checkpersonality
├⬡ /checkguardian
├⬡ /rate
├⬡ /mysoulmate
├⬡ /couple
├⬡ /frame
├⬡ /halah
├⬡ /hilih
├⬡ /huluh
├⬡ /heleh
├⬡ /holoh
╰────────────❒

╭────❒ *🎲 RANDOM GALLERY* ❒
├⬡ /coffe
├⬡ /technology
├⬡ /programming
├⬡ /cyberspace
├⬡ /mountain
├⬡ /islamic
├⬡ /game
├⬡ /ronaldo
├⬡ /messi
╰────────────❒

╭────❒ *🕵️ CYBER STALKER* ❒
├⬡ /wastalk
├⬡ /telestalk
├⬡ /igstalk
├⬡ /tiktokstalk
├⬡ /npmstalk
├⬡ /githubstalk
├⬡ /genshinstalk
╰────────────❒

╭────❒ *⚡ OWNER CONTROL* ❒
├⬡ /bot [set]
├⬡ /setbio
├⬡ /setppbot
├⬡ /setting
├⬡ /join
├⬡ /leave
├⬡ /block
├⬡ /listblock
├⬡ /unblock
├⬡ /listpc
├⬡ /listgc
├⬡ /ban
├⬡ /unban
├⬡ /mute
├⬡ /unmute
├⬡ /creategc
├⬡ /clearchat
├⬡ /addprem
├⬡ /delprem
├⬡ /listprem
├⬡ /addlimit
├⬡ /addmoney
├⬡ /getmsgstore
├⬡ /bot --settings
├⬡ /bot settings
├⬡ /getsession
├⬡ /delsession
├⬡ /delfrankdb
├⬡ /upsw
├⬡ /backup
├⬡ $ 🅞
├⬡ > 🅞
├⬡ < 🅞
╰────────────❒

╭─────────❒
├⬡ Total Commands: 100 
├⬡ Bot Version: *M STAR BOT V1*
├⬡ Current Prefix: /
├⬡ 💡 *TIP:* Use /help <command> for detailed info
╰────────────❒
*M STAR BOT* - 
 
> 😎 *Mr. Emmanuel 🌹*`;

        await sock.sendMessage(from, { text: menu });
      }

      // WORKING COMMANDS
      else if (cmd === 'ping' || cmd === 'speed') {
        const start = Date.now();
        await sock.sendMessage(from, { text: '🏓 Pinging...' });
        await sock.sendMessage(from, { text: `✅ *M STAR BOT Speed: ${Date.now() - start}ms*` });
      }

      else if (cmd === 'profile') {
        await sock.sendMessage(from, { text: `╭─❒ *YOUR PROFILE* ❒\n├ Name: ${user.name}\n├ Limit: ${user.limit}\n├ Money: ${user.money}\n├ Status: ${user.status}\n╰────────────❒` });
      }

      else if (cmd === 'claim') {
        if (Date.now() - user.lastClaim < 86400000) return sock.sendMessage(from, { text: '⏳ Claim again after 24 hours!' });
        user.money += 5000;
        user.limit += 50;
        user.lastClaim = Date.now();
        saveData();
        sock.sendMessage(from, { text: '✅ Claimed!\n+5000 Money\n+50 Limit' });
      }

      else if (cmd === 'dice') {
        const roll = Math.floor(Math.random() * 6) + 1;
        sock.sendMessage(from, { text: `🎲 You rolled: *${roll}*` });
      }

      else if (cmd === 'txt2img') {
        if (!q) return sock.sendMessage(from, { text: 'Usage: /txt2img beautiful sunset' });
        sock.sendMessage(from, { text: '🎨 Generating with M STAR BOT AI...' });
        try {
          const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}?width=1024&height=1024`;
          await sock.sendMessage(from, { image: { url }, caption: `✅ Generated by M STAR BOT\nPrompt: ${q}` });
        } catch (e) {
          sock.sendMessage(from, { text: '❌ Image generation failed. Try again.' });
        }
      }

      else if (cmd === 'ai') {
        if (!q) return sock.sendMessage(from, { text: 'Usage: /ai how are you' });
        sock.sendMessage(from, { text: '🤖 M STAR BOT AI Thinking...' });
        try {
          const res = await axios.get(`https://api.akuari.my.id/ai/gpt?prompt=${encodeURIComponent(q)}`);
          await sock.sendMessage(from, { text: `🤖 *M STAR BOT AI*\n\n${res.data.result || res.data.message || 'No response'}` });
        } catch (e) {
          sock.sendMessage(from, { text: `🤖 M STAR BOT: ${q}\n\n(Full AI coming in V2 – Mr. Emmanuel 🌹)` });
        }
      }

      else if (cmd === 'waifu' || cmd === 'neko' || cmd === 'miku') {
        try {
          const res = await axios.get('https://api.waifu.pics/waifu');
          await sock.sendMessage(from, { image: { url: res.data.url }, caption: `🌸 ${cmd.toUpperCase()} from M STAR BOT` });
        } catch (e) {
          sock.sendMessage(from, { text: '🌸 Anime image coming soon!' });
        }
      }

      else if (cmd === 'runtime') {
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        sock.sendMessage(from, { text: `⏱️ M STAR BOT has been running for ${h}h ${m}m on KataBump` });
      }

      else if (cmd === 'owner') {
        sock.sendMessage(from, { text: '👑 Owner: Mr. Emmanuel 🌹\nCreator of M STAR BOT, Racing Game & Anti-Bug Bot' });
      }

      // Group commands example (bot must be admin)
      else if (cmd === 'add' && from.endsWith('@g.us')) {
        const num = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        try {
          await sock.groupParticipantsUpdate(from, [num], 'add');
          sock.sendMessage(from, { text: '✅ Added!' });
        } catch (e) {
          sock.sendMessage(from, { text: '❌ Failed (bot must be admin)' });
        }
      }

      else if (cmd === 'kick' && from.endsWith('@g.us')) {
        const num = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        try {
          await sock.groupParticipantsUpdate(from, [num], 'remove');
          sock.sendMessage(from, { text: '✅ Kicked!' });
        } catch (e) {
          sock.sendMessage(from, { text: '❌ Failed (bot must be admin)' });
        }
      }

      else {
        sock.sendMessage(from, { text: `Command /${cmd} is ready in menu!\nFull feature coming in V2 by Mr. Emmanuel 🌹\n\nType /menu` });
      }
    }
  });

  setInterval(() => {
    sock.sendMessage(OWNER, { text: '🛡️ M STAR BOT still running perfectly on KataBump!' });
  }, 1800000);
}

startBot().catch(err => {
  console.error('Error:', err);
  setTimeout(startBot, 5000);
});
