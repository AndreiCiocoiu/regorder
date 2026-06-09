const {
  Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder,
  ChannelType, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder,
  ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// ── CONFIG ───────────────────────────────────────────────
const TOKEN    = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID || '1509279596074373271';
const SUPA_URL = process.env.SUPABASE_URL || 'https://wrjvymujwjsjytigzdua.supabase.co';
const SUPA_KEY = process.env.SUPABASE_KEY;

let CH_ALERTE     = null;
let CH_PUBLICATII = null;
let CH_MISIUNI    = null;
let CH_GENERAL    = null;
let CH_TEREN      = null;
let CAT_ECHIPE_ID = null;

const sb = createClient(SUPA_URL, SUPA_KEY);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ── CULORI ───────────────────────────────────────────────
const RED    = 0xC0181A;
const GREEN  = 0x4ade80;
const YELLOW = 0xf59e0b;
const PURPLE = 0xa78bfa;
const BLUE   = 0x60a5fa;

// ── GRADE CU PERMISIUNI SA CREEZE ECHIPE ────────────────
const GRADE_SUPERIOARE = ['👁️ Fondator Regorder','🔱 Director General','⚡ Director Editorial','🔐 Administrator','🎙️ Șef Redacție','⚖️ Editor Șef','📹 Reporter Activ','🔍 Investigator'];

// ── MISIUNI ──────────────────────────────────────────────
const MISIUNI = [
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Tăierea ilegală de lemne', tags:['Braconaj','Teren'], status:'Planificat', pasi:['Cercetare prealabilă','Prima ieșire pe teren','Colectare probe video/foto','Interviuri surse și martori'] },
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Transportul (Tiristul)', tags:['Transport','Corupție'], status:'Planificat', pasi:['Identificare vehicule și rute','Angajare sub acoperire','Probe marfă și documente'] },
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Braconajul & vânătoarea ilegală', tags:['Ilegal','Teren'], status:'Planificat', pasi:['Maparea zonelor','Documentare activitate','Piața neagră'] },
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Industria petrolieră — nereguli', tags:['Mediu','Corupție'], status:'Planificat', pasi:['Cercetare industrie','Observație internă','Conexiuni politice'] },
  { cat:2, catLabel:'Evaziune fiscală & afaceri legale', titlu:'Bonuri false la afaceri legale', tags:['Evaziune','Financiar'], status:'Planificat', pasi:['Identificare afaceri suspecte','Angajare sub acoperire','Probe documentare'] },
  { cat:2, catLabel:'Evaziune fiscală & afaceri legale', titlu:'Bani nestampilați în cluburi de noapte', tags:['Spălare','Noapte'], status:'Planificat', pasi:['Cercetare cluburi','Infiltrare','Probe financiare'] },
  { cat:2, catLabel:'Evaziune fiscală & afaceri legale', titlu:'Infiltrare în mafie (SOA / CAYO)', tags:['Mafie','Pericol'], status:'Planificat', pasi:['Construire identitate','Apropiere treptată','Colectare probe','Ieșire în siguranță'] },
  { cat:3, catLabel:'Corupția poliției', titlu:'Corupția polițiștilor', tags:['Corupție','Poliție'], status:'Planificat', pasi:['Identificare tipare','Teste integritate','Probe și martori'] },
  { cat:3, catLabel:'Corupția poliției', titlu:'Incompetența în forțele de ordine', tags:['Incompetență','Sistem'], status:'Planificat', pasi:['Colectare cazuri','Testare sistem','Documentar'] },
  { cat:3, catLabel:'Corupția poliției', titlu:'Legătura poliție — mafie', tags:['Pericol','Corupție'], status:'Planificat', pasi:['Mapare relații','Probe colaborare'] },
  { cat:4, catLabel:'Mafii & crimă organizată', titlu:'Zone rău famate controlate', tags:['Teren','Risc'], status:'Planificat', pasi:['Cercetare zone','Documentare teren','Harta criminală'] },
  { cat:4, catLabel:'Mafii & crimă organizată', titlu:'Semnificația culorilor', tags:['Gang','Cercetare'], status:'Planificat', pasi:['Observație vizuală','Interviuri','Ghid vizual'] },
  { cat:4, catLabel:'Mafii & crimă organizată', titlu:'Distribuția drogurilor în oraș', tags:['Droguri','Pericol'], status:'Planificat', pasi:['Mapare rețea','Documentare puncte deal','Lanț aprovizionare'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Cine conduce orașul?', tags:['Putere','Cercetare'], status:'Planificat', pasi:['Lideri vizibili','Conducere din umbră','Probe'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Scopul Sindicatului în oraș', tags:['Strategie','Analiză'], status:'Planificat', pasi:['Domenii control','Strategie','Impact cetățeni'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Conexiuni între Sindicat și celelalte grupări', tags:['Rețea','Complex'], status:'Planificat', pasi:['Mapare relații','Relații ascunse','Graf putere'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Documentarul final — sinteza', tags:['Producție','Final'], status:'Planificat', pasi:['Compilare probe','Narațiune','Montaj și prezentare'] },
];

// ── TEREN LIVE STORE ────────────────────────────────────
// { userId: { nume, locatie, misiune, startTime, messageId } }
const peTerenAcum = {};
let terenMesajId = null; // ID-ul mesajului principal de status

// ── PUNCTE TEREN ─────────────────────────────────────────
async function adaugaPuncte(userId, username, minutePeTeren) {
  try {
    const puncte = Math.floor(minutePeTeren / 60); // 1h = 1 punct
    if (puncte <= 0) return;
    const sapt = getWeekKey();
    let data = null;
    try { const r = await sb.from('puncte_teren').select('*').eq('user_id', userId).eq('saptamana', sapt).single(); data = r.data; } catch(e) {}
    if (data) {
      await sb.from('puncte_teren').update({
        puncte: data.puncte + puncte,
        minute: data.minute + minutePeTeren,
        username
      }).eq('id', data.id);
    } else {
      await sb.from('puncte_teren').insert({
        user_id: userId, username, puncte, minute: minutePeTeren,
        saptamana: sapt, created_at: new Date().toISOString()
      });
    }
  } catch(e) { console.error('Puncte error:', e.message); }
}

function getWeekKey() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0,0,0,0);
  start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  return start.toISOString().slice(0,10);
}

function formatTimp(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

async function updateTerenMesaj(guild) {
  const ch = guild.channels.cache.get(CH_TEREN);
  if (!ch) return;

  const activi = Object.values(peTerenAcum);

  const embed = new EmbedBuilder()
    .setColor(activi.length > 0 ? RED : 0x1a1a2e)
    .setAuthor({ name: 'REGORDER · TEREN LIVE', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
    .setTitle(activi.length > 0 ? '🔴 REPORTERI ACTIVI PE TEREN' : '⬛ NICIUN REPORTER ACTIV')
    .setTimestamp();

  if (activi.length === 0) {
    embed.setDescription('*Serverul e în standby. Folosește `/teren-on` pentru a anunța o misiune.*');
  } else {
    embed.setDescription(activi.map((r, i) => {
      const elapsed = Math.floor((Date.now() - r.startTime) / 60000);
      const timp = formatTimp(elapsed);
      const punct_preview = Math.floor(elapsed / 60);
      return [
        `**${i+1}. ${r.nume}**`,
        `┣ 📍 **Locație:** ${r.locatie}`,
        r.misiune ? `┣ 🎯 **Misiune:** ${r.misiune}` : null,
        `┣ ⏱️ **Timp activ:** ${timp}`,
        `┗ ⭐ **Puncte acumulate:** ${punct_preview}p`,
      ].filter(Boolean).join('\n');
    }).join('\n\n'));
    embed.addFields({ name: '━━━━━━━━━━━━━━━━━━━━━━', value: `📊 **${activi.length}** reporter${activi.length > 1 ? 'i' : ''} activ${activi.length > 1 ? 'i' : ''} · 1h = 1 punct`, inline: false });
  }

  embed.setFooter({ text: 'REGORDER · Investigații independente · regorder.live' });

  try {
    if (terenMesajId) {
      const msg = await ch.messages.fetch(terenMesajId).catch(() => null);
      if (msg) { await msg.edit({ embeds: [embed] }); return; }
    }
    const msg = await ch.send({ embeds: [embed] });
    terenMesajId = msg.id;
  } catch(e) { console.error('Eroare update teren:', e.message); }
}

const CAT_COLORS = { 1:YELLOW, 2:YELLOW, 3:RED, 4:RED, 5:PURPLE };
const CAT_EMOJI  = { 1:'🪚', 2:'💼', 3:'👮', 4:'🔴', 5:'👁️' };

// ── HELPER: hex → rgba string ────────────────────────────
function c2r(hex, a=0.15) {
  const h = hex.toString(16).padStart(6,'0');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
}


// ── APLICARE SISTEM ──────────────────────────────────────
let CH_APLICA    = null;  // canal unde lumea apasa butonul
let CH_APL_ADMIN = null;  // canal privat unde ajung aplicatiile
let CH_WELCOME   = null;  // canal welcome pentru noi veniti
let ROLE_APLICANT = null; // rol dat automat la intrare

// Grade care pot accepta/respinge aplicatii
const GRADE_RECRUTARE = ['👁️ Fondator Regorder', '🔱 Director General', '⚡ Director Editorial', '🔐 Administrator', '🎙️ Șef Redacție', '⚖️ Editor Șef'];

// Pozitii disponibile pentru aplicare
const POZITII_APLICARE = [
  { label: '📹 Reporter de Investigații', value: 'reporter' },
  { label: '📷 Fotograf / Cameraman', value: 'cameraman' },
  { label: '🎬 Editor Video', value: 'editor_video' },
  { label: '✍️ Redactor / Jurnalist', value: 'redactor' },
  { label: '🔍 Researcher / Analist', value: 'researcher' },
  { label: '🌐 Social Media Manager', value: 'social_media' },
  { label: '🤝 Colaborator / Altul', value: 'colaborator' },
];

async function setupAplicare(guild) {
  // Categorie aplicatii
  let catApl = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '📥 APLICAȚII');
  if (!catApl) catApl = await guild.channels.create({ name: '📥 APLICAȚII', type: ChannelType.GuildCategory });

  // Canal cum-aplici (vizibil pentru toti)
  let chInfo = guild.channels.cache.find(c => c.name === '📋・cum-aplici');
  if (!chInfo) chInfo = await guild.channels.create({
    name: '📋・cum-aplici', type: ChannelType.GuildText, parent: catApl.id,
    topic: 'Informații despre cum poți face parte din echipa Regorder'
  });

  // Canal aplica-aici (vizibil pentru toti, doar botul scrie)
  let chAplica = guild.channels.cache.find(c => c.name === '📩・aplică-aici');
  if (!chAplica) chAplica = await guild.channels.create({
    name: '📩・aplică-aici', type: ChannelType.GuildText, parent: catApl.id,
    topic: 'Apasă butonul pentru a aplica în echipa Regorder'
  });
  CH_APLICA = chAplica.id;

  // Canal aplicatii-primite (PRIVAT - doar admini)
  const roleAdmin    = guild.roles.cache.find(r => r.name === '🔐 Admin');
  const roleFondator = guild.roles.cache.find(r => r.name === '👑 Fondator');
  const roleSef      = guild.roles.cache.find(r => r.name === '🎙️ Șef Redacție');
  const roleEditor   = guild.roles.cache.find(r => r.name === '⚖️ Editor Șef');

  const adminPerms = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...[roleAdmin, roleFondator, roleSef, roleEditor].filter(Boolean).map(r => ({
      id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
    }))
  ];

  let chAdmin = guild.channels.cache.find(c => c.name === '🔏・aplicații-primite');
  if (!chAdmin) chAdmin = await guild.channels.create({
    name: '🔏・aplicații-primite', type: ChannelType.GuildText, parent: catApl.id,
    topic: 'Aplicații primite de la candidați', permissionOverwrites: adminPerms
  });
  CH_APL_ADMIN = chAdmin.id;

  // Canal status-aplicatie (vizibil pentru toti, readonly)
  let chStatus = guild.channels.cache.find(c => c.name === '🔔・status-aplicație');
  if (!chStatus) chStatus = await guild.channels.create({
    name: '🔔・status-aplicație', type: ChannelType.GuildText, parent: catApl.id,
    topic: 'Statusul aplicațiilor tale'
  });

  // Canal welcome
  let catWelcome = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '👋 BINE AI VENIT');
  if (!catWelcome) catWelcome = await guild.channels.create({ name: '👋 BINE AI VENIT', type: ChannelType.GuildCategory });

  let chWelcome = guild.channels.cache.find(c => c.name === '👋・bine-ai-venit');
  if (!chWelcome) chWelcome = await guild.channels.create({
    name: '👋・bine-ai-venit', type: ChannelType.GuildText, parent: catWelcome.id,
    topic: 'Bine ai venit pe serverul Regorder!'
  });
  CH_WELCOME = chWelcome.id;

  // Rol Aplicant
  let rolAplicant = guild.roles.cache.find(r => r.name === '📥 Aplicant');
  if (!rolAplicant) rolAplicant = await guild.roles.create({
    name: '📥 Aplicant', color: 0x6b7280, hoist: false, mentionable: false, reason: 'Rol implicit la intrare'
  });
  ROLE_APLICANT = rolAplicant.id;

  // Restrictii pentru Aplicant - vad doar welcome si aplicatii
  const canalePublice = ['📋・cum-aplici', '📩・aplică-aici', '🔔・status-aplicație', '👋・bine-ai-venit'];
  for (const [, ch] of guild.channels.cache) {
    if (ch.type !== ChannelType.GuildText) continue;
    const isPublic = canalePublice.includes(ch.name);
    if (!isPublic) {
      try {
        await ch.permissionOverwrites.edit(rolAplicant.id, { ViewChannel: false });
        await new Promise(r => setTimeout(r, 100));
      } catch(e) {}
    }
  }
  // Restrictii categorii
  for (const [, ch] of guild.channels.cache) {
    if (ch.type !== ChannelType.GuildCategory) continue;
    const catPublice = ['📥 APLICAȚII', '👋 BINE AI VENIT'];
    if (!catPublice.includes(ch.name)) {
      try {
        await ch.permissionOverwrites.edit(rolAplicant.id, { ViewChannel: false });
        await new Promise(r => setTimeout(r, 100));
      } catch(e) {}
    }
  }

  // Posteaza mesaj info in cum-aplici
  const msgs = await chInfo.messages.fetch({ limit: 10 });
  const hasBotMsg = msgs.some(m => m.author.id === guild.client.user.id);
  if (!hasBotMsg) {
    await chInfo.send({ embeds: [new EmbedBuilder()
      .setColor(RED)
      .setTitle('📋 CUM INTRI ÎN ECHIPA REGORDER')
      .setDescription([
        '**Regorder** este o echipă de jurnaliști și documentariști independenți.',
        '',
        'Dacă vrei să faci parte din proiect, urmează pașii de mai jos:',
        '',
        '**1.** Mergi în canalul <#' + chAplica.id + '>',
        '**2.** Apasă butonul **APLICĂ ACUM**',
        '**3.** Completează formularul cu datele tale',
        '**4.** Echipa va analiza aplicația și te va contacta',
        '',
        '**Pozițiile disponibile:**',
        POZITII_APLICARE.map(p => p.label).join('\n'),
        '',
        '> *Participarea este voluntară. Analizăm fiecare aplicație individual.*'
      ].join('\n'))
      .setFooter({ text: 'REGORDER · Echipă independentă de investigații' })
    ]});
  }

  // Posteaza buton in aplica-aici
  const msgsAplica = await chAplica.messages.fetch({ limit: 5 });
  const hasBtnMsg = msgsAplica.some(m => m.author.id === guild.client.user.id && m.components?.length > 0);
  if (!hasBtnMsg) {
    await chAplica.send({
      embeds: [new EmbedBuilder()
        .setColor(RED)
        .setTitle('📩 APLICĂ ÎN ECHIPA REGORDER')
        .setDescription([
          'Suntem o echipă de jurnaliști independenți care investigează subiecte de interes public.',
          '',
          '**Apasă butonul de mai jos** pentru a completa formularul de aplicare.',
          '',
          '> Aplicația ta ajunge direct la echipa editorială. Îți vom răspunde în cel mai scurt timp.'
        ].join('\n'))
        .setFooter({ text: 'REGORDER · Apasă butonul pentru a aplica' })
      ],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_aplica')
          .setLabel('📩 APLICĂ ACUM')
          .setStyle(ButtonStyle.Danger)
      )]
    });
  }

  console.log('✓ Sistem aplicare gata');
}

// ── WELCOME AUTOMAT ──────────────────────────────────────
async function welcomeMembru(member) {
  // Da rol Aplicant automat
  if (ROLE_APLICANT) {
    try { await member.roles.add(ROLE_APLICANT); } catch(e) {}
  }

  // Mesaj in welcome
  const chW = member.guild.channels.cache.get(CH_WELCOME);
  if (chW) {
    await chW.send({ embeds: [new EmbedBuilder()
      .setColor(RED)
      .setTitle(`👋 BUN VENIT, ${member.displayName.toUpperCase()}!`)
      .setDescription([
        `Salut <@${member.id}>! Bine ai venit pe serverul **REGORDER**.`,
        '',
        'Suntem o echipă de jurnaliști și documentariști independenți.',
        '',
        '**Ce poți face acum:**',
        `📋 Citește <#${CH_APLICA ? (member.guild.channels.cache.find(c=>c.name==='📋・cum-aplici')?.id||'') : ''}> pentru a afla cum funcționăm`,
        `📩 Aplică în echipă din canalul <#${CH_APLICA||''}> — apasă butonul **APLICĂ ACUM**`,
        '',
        '> *Dacă ai fost invitat direct de un membru, contactează un admin.*'
      ].join('\n'))
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: 'REGORDER · Investigații independente' })
      .setTimestamp()
    ]});
  }

  // DM cu instructiuni
  try {
    await member.send({ embeds: [new EmbedBuilder()
      .setColor(RED)
      .setTitle('📩 BINE AI VENIT PE SERVERUL REGORDER!')
      .setDescription([
        'Salut! Tocmai ai intrat pe serverul **REGORDER**.',
        '',
        'Pentru a accesa serverul complet, trebuie să aplici în echipă:',
        '**1.** Intră pe server',
        '**2.** Mergi în canalul 📩・aplică-aici',
        '**3.** Apasă **APLICĂ ACUM** și completează formularul',
        '',
        'Aplicația ta va fi analizată de echipă și vei primi un răspuns.',
        '',
        '*— Echipa Regorder*'
      ].join('\n'))
      .setFooter({ text: 'REGORDER · Nu răspunde la acest mesaj' })
    ]});
  } catch(e) {} // DM-urile pot fi dezactivate
}

// ── HELPER: posteaza template daca nu exista deja ───────
async function postTemplate(ch, embedFn, botId) {
  const msgs = await ch.messages.fetch({ limit: 5 }).catch(() => null);
  if (msgs && msgs.some(m => m.author.id === botId && m.embeds?.length > 0)) return;
  await ch.send(embedFn());
}

// ── SETUP CANALE ─────────────────────────────────────────
async function setupCanale(guild) {
  const ensure = async (name, topic, catId) => {
    let ch = guild.channels.cache.find(c => c.name === name);
    if (!ch) ch = await guild.channels.create({ name, type:ChannelType.GuildText, parent:catId, topic });
    return ch;
  };

  // ── Categorie OFICIAL ──
  let catOficial = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '📢 OFICIAL');
  if (!catOficial) catOficial = await guild.channels.create({ name:'📢 OFICIAL', type:ChannelType.GuildCategory });

  const chReg  = await ensure('📌・regulament',  'Regulamentul serverului REGORDER', catOficial.id);
  const chAnunt = await ensure('📣・anunțuri',   'Anunțuri oficiale echipă', catOficial.id);
  const chLive  = await ensure('🔴・live-acum',  'Investigații live în desfășurare', catOficial.id);

  // ── Categorie REDACȚIE ──
  let catRedactie = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '🗂 REDACȚIE');
  if (!catRedactie) catRedactie = await guild.channels.create({ name:'🗂 REDACȚIE', type:ChannelType.GuildCategory });

  const chProbe   = await ensure('🔍・probe-media',   'Template probe — foto/video/documente', catRedactie.id);
  const chPers    = await ensure('🧑・persoane',       'Template persoane identificate', catRedactie.id);
  const chVeh     = await ensure('🚗・vehicule',       'Template vehicule identificate', catRedactie.id);
  const chRaport  = await ensure('📊・rapoarte',       'Rapoarte misiuni și activitate', catRedactie.id);
  const chBriefing = await ensure('📋・briefing',      'Briefinguri înainte de misiune', catRedactie.id);
  const chPub     = await ensure('📰・publicații',     'Articole și dosare publicate', catRedactie.id);

  CH_PUBLICATII = chPub.id;

  // ── Categorie TEREN ──
  let catTeren = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '📡 TEREN');
  if (!catTeren) catTeren = await guild.channels.create({ name:'📡 TEREN', type:ChannelType.GuildCategory });

  const chTeren = await ensure('📡・teren-live',  'Reporteri activi — /teren-on /teren-off', catTeren.id);
  const chAlerte = await ensure('🚨・alerte',     'Alerte urgente — /alert /sos', catTeren.id);
  CH_TEREN = chTeren.id; CH_ALERTE = chAlerte.id;

  // ── Categorie COMUNITATE ──
  let catComun = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '💬 COMUNITATE');
  if (!catComun) catComun = await guild.channels.create({ name:'💬 COMUNITATE', type:ChannelType.GuildCategory });

  const chGeneral = await ensure('💬・general',      'Discuții generale echipă', catComun.id);
  const chIdei    = await ensure('💡・idei-subiecte', 'Propuneri investigații', catComun.id);
  const chComenzi = await ensure('🤖・comenzi',       'Comenzi bot', catComun.id);
  CH_GENERAL = chGeneral.id; CH_MISIUNI = chComenzi.id;

  // ── Categorie ECHIPE ──
  let catE = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '🔴 ECHIPE ACTIVE');
  if (!catE) catE = await guild.channels.create({ name:'🔴 ECHIPE ACTIVE', type:ChannelType.GuildCategory });
  CAT_ECHIPE_ID = catE.id;

  // ── Posteaza regulament ──
  await postTemplate(chReg, () => ({
    embeds: [buildRegulament()]
  }), guild.client.user.id);

  // ── Posteaza template probe ──
  await postTemplate(chProbe, () => ({
    embeds: [buildTemplateProba()]
  }), guild.client.user.id);

  // ── Posteaza template persoane ──
  await postTemplate(chPers, () => ({
    embeds: [buildTemplatePersoana()]
  }), guild.client.user.id);

  // ── Posteaza template vehicule ──
  await postTemplate(chVeh, () => ({
    embeds: [buildTemplateVehicul()]
  }), guild.client.user.id);

  // ── Posteaza template raport ──
  await postTemplate(chRaport, () => ({
    embeds: [buildTemplateRaport()]
  }), guild.client.user.id);

  // ── Posteaza template briefing ──
  await postTemplate(chBriefing, () => ({
    embeds: [buildTemplateBriefing()]
  }), guild.client.user.id);

  console.log('✓ Canale si template-uri gata');
}

// ── REGULAMENT ───────────────────────────────────────────
function buildRegulament() {
  return new EmbedBuilder()
    .setColor(RED)
    .setAuthor({ name: 'REGORDER — Server Oficial', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png', url: 'https://regorder.live' })
    .setThumbnail('https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png')
    .setTitle('📜 REGULAMENTUL SERVERULUI')
    .setDescription([
      '> Bine ai venit pe serverul **REGORDER**.',
      '> Citirea și respectarea acestui regulament este **obligatorie** pentru toți membrii.',
      '',
      '**§1 — COMPORTAMENT GENERAL**',
      '`1.` Respectul reciproc este obligatoriu. Insultele, hărțuirea sau discriminarea duc la ban imediat.',
      '`2.` Fără spam, flood sau conținut irelevant în canale.',
      '`3.` Limbajul vulgar excesiv este interzis în canalele oficiale.',
      '`4.` Fără promovare de servere externe fără acordul adminilor.',
      '`5.` Avatarul și nickname-ul trebuie să fie adecvate.',
      '',
      '**§2 — CONFIDENȚIALITATE ȘI SECURITATE**',
      '`6.` Informațiile din investigații sunt **strict confidențiale**. Nu le distribui în afara serverului.',
      '`7.` Identitatea surselor nu se divulgă **niciodată**, nici intern.',
      '`8.` Doxxingul (publicarea datelor personale) este interzis și duce la ban permanent.',
      '`9.` Nu încerca să accesezi canale la care nu ai permisiune.',
      '',
      '**§3 — ACTIVITATE ÎN TEREN**',
      '`10.` Folosește `/teren-on` înainte de orice misiune și `/teren-off` după.',
      '`11.` Siguranța personală primează întotdeauna față de orice investigație.',
      '`12.` Probele, declarațiile și documentele nu se falsifică niciodată.',
      '`13.` Folosește `/sos` doar în urgențe reale. Abuzul duce la sancțiuni.',
      '',
      '**§4 — UTILIZAREA CANALELOR**',
      '`14.` Postează doar conținut relevant în canalul respectiv.',
      '`15.` Canalul `📣・anunțuri` este read-only. Reacțiile și discuțiile merg în `💬・general`.',
      '`16.` Conținutul din canalele private de echipă nu se distribuie fără acordul liderului.',
      '',
      '**§5 — GRADE ȘI ROLURI**',
      '`17.` Gradele se câștigă prin contribuție activă, nu se cer.',
      '`18.` Respectă ierarhia — deciziile editoriale aparțin Fondatorului și Șefului de Redacție.',
      '`19.` Aplicanții au acces limitat până la acceptarea aplicației. Nu ocoli restricțiile.',
      '',
      '**§6 — SANCȚIUNI**',
      '`⚠️` Avertisment — prima abatere minoră',
      '`🔇` Mute temporar — abateri repetate',
      '`👢` Kick — abatere gravă',
      '`🔨` Ban permanent — abatere foarte gravă sau doxxing',
      '',
      '> Prin rămânerea pe server confirmi că ai citit și ești de acord cu regulamentul.',
      '> Regulamentul poate fi actualizat — modificările vor fi anunțate în `📣・anunțuri`.',
    ].join('\n'))
    .setFooter({ text: 'REGORDER · Investigații Independente · regorder.live', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
    .setTimestamp();
}

// ── TEMPLATE PROBĂ ────────────────────────────────────────
function buildTemplateProba() {
  return new EmbedBuilder()
    .setColor(YELLOW)
    .setAuthor({ name: 'REGORDER — Probe Media', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
    .setTitle('📋 TEMPLATE — CUM SE POSTEAZĂ O PROBĂ')
    .setDescription([
      '> Folosește acest format când postezi o probă media în thread-urile de echipă.',
      '> Fiecare probă trebuie documentată corect pentru a fi folosită în investigație.',
      '',
      '```',
      '📂 PROBĂ MEDIA — REGORDER',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '📌 Dosar:        #NR — Titlu dosar',
      '🔢 Nr. probă:    P-001',
      '📦 Tip:          VIDEO / FOTO / DOCUMENT / AUDIO',
      '📅 Data:         ZZ/LL/AAAA — HH:MM',
      '📍 Locație:      Unde a fost colectată',
      '👤 Reporter:     Numele tău',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '📝 Descriere:',
      'Ce surprinde această probă. Cât mai detaliat.',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '🔗 Link fișier:  (Google Drive / link direct)',
      '✅ Status:       Neconfirmată / Confirmată',
      '```',
    ].join('\n'))
    .addFields(
      { name: '💡 Tipuri acceptate', value: 'VIDEO · FOTO · DOCUMENT · AUDIO · OBSERVAȚIE · MARTOR', inline: false },
      { name: '⚠️ Important', value: 'Nu posta probe fără descriere. Probele fără context nu pot fi folosite în investigație.', inline: false },
    )
    .setFooter({ text: 'REGORDER · Template Probe · regorder.live', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' });
}

// ── TEMPLATE PERSOANĂ ─────────────────────────────────────
function buildTemplatePersoana() {
  return new EmbedBuilder()
    .setColor(BLUE)
    .setAuthor({ name: 'REGORDER — Persoane Identificate', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
    .setTitle('📋 TEMPLATE — CUM SE RAPORTEAZĂ O PERSOANĂ')
    .setDescription([
      '> Folosește acest format când identifici o persoană relevantă pentru o investigație.',
      '> Informațiile sunt confidențiale și rămân pe server.',
      '',
      '```',
      '🧑 PERSOANĂ IDENTIFICATĂ — REGORDER',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📌 Dosar:        #NR — Titlu dosar',
      '👤 Nume:         Nume / Alias / Necunoscut',
      '🎭 Rol:          Suspect / Complice / Martor / Informator',
      '📅 Data:         ZZ/LL/AAAA — prima observație',
      '📍 Locație:      Unde a fost observată',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📝 Descriere fizică:',
      'Înălțime, constituție, îmbrăcăminte, trăsături distincte.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🔗 Conexiuni:    Alte persoane / organizații asociate',
      '📸 Probe:        Link foto/video dacă există',
      '⚠️ Nivel risc:  Scăzut / Mediu / Ridicat',
      '```',
    ].join('\n'))
    .addFields(
      { name: '🔒 Confidențialitate', value: 'Datele din acest canal nu se distribuie în afara serverului fără aprobarea editorului șef.', inline: false },
    )
    .setFooter({ text: 'REGORDER · Template Persoane · regorder.live', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' });
}

// ── TEMPLATE VEHICUL ──────────────────────────────────────
function buildTemplateVehicul() {
  return new EmbedBuilder()
    .setColor(RED)
    .setAuthor({ name: 'REGORDER — Vehicule Identificate', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
    .setTitle('📋 TEMPLATE — CUM SE RAPORTEAZĂ UN VEHICUL')
    .setDescription([
      '> Folosește acest format când identifici un vehicul suspect sau relevant.',
      '',
      '```',
      '🚗 VEHICUL IDENTIFICAT — REGORDER',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📌 Dosar:          #NR — Titlu dosar',
      '🔢 Nr. înmatr.:    AB-12-CDE / Necunoscut',
      '🚘 Marcă / Model:  Ex: Dacia Logan / ARO',
      '🎨 Culoare:        Ex: Alb murdar, Negru mat',
      '🏗️  Tip:            Autoturism / Camion / Dubă / ATV',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📅 Data:           ZZ/LL/AAAA — HH:MM',
      '📍 Locație:        Unde a fost observat',
      '👤 Ocupanți:       Nr. persoane / descriere dacă e posibil',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📝 Activitate observată:',
      'Ce făcea vehiculul, ce transporta, comportament suspect.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📸 Probe:          Link foto/video placuță / vehicul',
      '🔁 Frecvență:      Prima apariție / Repetat / Regulat',
      '```',
    ].join('\n'))
    .setFooter({ text: 'REGORDER · Template Vehicule · regorder.live', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' });
}

// ── TEMPLATE RAPORT ───────────────────────────────────────
function buildTemplateRaport() {
  return new EmbedBuilder()
    .setColor(GREEN)
    .setAuthor({ name: 'REGORDER — Rapoarte', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
    .setTitle('📋 TEMPLATE — RAPORT DE MISIUNE')
    .setDescription([
      '> Completează acest raport după fiecare misiune de teren sau sesiune de investigație.',
      '',
      '```',
      '📊 RAPORT MISIUNE — REGORDER',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📌 Dosar:         #NR — Titlu dosar',
      '👤 Reporter:      Numele tău',
      '📅 Data misiunii: ZZ/LL/AAAA',
      '⏱️  Durată:        HH:MM — HH:MM (start — stop)',
      '📍 Zonă acoperită: Locații vizitate',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '✅ Ce s-a realizat:',
      'Descrie pe scurt ce ai făcut, ce ai observat.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🔍 Probe colectate:',
      'P-001: descriere scurtă',
      'P-002: descriere scurtă',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🧑 Persoane identificate:',
      'Dacă există, menționează alias/rol.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '⚠️  Incidente / Riscuri:',
      'Orice situație neașteptată sau pericol întâlnit.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📌 Pași următori:',
      'Ce trebuie făcut în continuare pe acest dosar.',
      '```',
    ].join('\n'))
    .setFooter({ text: 'REGORDER · Template Rapoarte · regorder.live', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' });
}

// ── TEMPLATE BRIEFING ─────────────────────────────────────
function buildTemplateBriefing() {
  return new EmbedBuilder()
    .setColor(PURPLE)
    .setAuthor({ name: 'REGORDER — Briefing', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
    .setTitle('📋 TEMPLATE — BRIEFING ÎNAINTE DE MISIUNE')
    .setDescription([
      '> Editorul șef sau liderul de echipă completează acest briefing înainte de orice misiune.',
      '> Toți membrii echipei trebuie să confirme că l-au citit.',
      '',
      '```',
      '📋 BRIEFING MISIUNE — REGORDER',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📌 Dosar:          #NR — Titlu dosar',
      '🎯 Obiectiv:       Ce vrem să obținem din această misiune',
      '📅 Data / Ora:     ZZ/LL/AAAA — HH:MM',
      '📍 Locație:        Adresă / zonă exactă',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '👥 Echipă:',
      '  🔴 Lider:        @Nume',
      '  📹 Cameraman:    @Nume',
      '  🎙️  Reporter:    @Nume',
      '  🚗 Urmărire:     @Nume (dacă e cazul)',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '⚠️  Riscuri cunoscute:',
      'Ce pericole pot apărea. Cum le evităm.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🔧 Echipament necesar:',
      'Camera, microfon, baterii, legitimație etc.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '📡 Protocol comunicare:',
      '  • Check-in la sosire: /teren-on',
      '  • Urgențe: /sos',
      '  • Check-out: /teren-off + raport',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🎯 Probe prioritare:',
      '1. Ce trebuie filmat/fotografiat obligatoriu',
      '2. Alte probe dorite dacă e posibil',
      '```',
    ].join('\n'))
    .addFields(
      { name: '✅ Confirmare', value: 'Toți membrii echipei reacționează cu ✅ la acest mesaj pentru a confirma că l-au citit.', inline: false },
    )
    .setFooter({ text: 'REGORDER · Template Briefing · regorder.live', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' });
}

// ── SETUP ROLURI ─────────────────────────────────────────
async function setupRoluri(guild) {
  const ROLURI = [
    { name:'👁️ Fondator Regorder',    color:0xC0181A, hoist:true,  mentionable:true  },
    { name:'🔱 Director General',     color:0xC0181A, hoist:true,  mentionable:true  },
    { name:'⚡ Director Editorial',   color:0xC0181A, hoist:true,  mentionable:true  },
    { name:'🔐 Administrator',        color:0xff4444, hoist:true,  mentionable:true  },
    { name:'🎙️ Șef Redacție',         color:0xfb923c, hoist:true,  mentionable:true  },
    { name:'⚖️ Editor Șef',           color:0xfb923c, hoist:true,  mentionable:true  },
    { name:'📹 Reporter Activ',       color:0xf59e0b, hoist:true,  mentionable:true  },
    { name:'🔍 Investigator',         color:0x60a5fa, hoist:true,  mentionable:true  },
    { name:'✍️ Editor',               color:0xf59e0b, hoist:false, mentionable:true  },
    { name:'📸 Fotograf',             color:0x60a5fa, hoist:false, mentionable:true  },
    { name:'🎬 Cameraman',            color:0x60a5fa, hoist:false, mentionable:true  },
    { name:'🎙️ Narator',              color:0xa78bfa, hoist:false, mentionable:true  },
    { name:'🖊️ Scenarist',            color:0xa78bfa, hoist:false, mentionable:true  },
    { name:'📡 Operator Drone',       color:0x38bdf8, hoist:false, mentionable:true  },
    { name:'🚗 Urmărire',             color:0xfbbf24, hoist:false, mentionable:true  },
    { name:'💼 Financiar',            color:0xfbbf24, hoist:false, mentionable:true  },
    { name:'👮 Investigator Poliție', color:0x3b82f6, hoist:false, mentionable:true  },
    { name:'🔴 Investigator Mafie',   color:0xC0181A, hoist:false, mentionable:true  },
    { name:'🌿 Mediu & Resurse',      color:0x4ade80, hoist:false, mentionable:true  },
    { name:'🕵️ Infiltrat',            color:0x8b5cf6, hoist:false, mentionable:true  },
    { name:'📡 Analist Intel',        color:0x06b6d4, hoist:false, mentionable:true  },
    { name:'⚖️ Juridic',              color:0xe2e8f0, hoist:false, mentionable:true  },
    { name:'💻 Tehnic',               color:0x10b981, hoist:false, mentionable:true  },
    { name:'🗺️ Cartograf',            color:0x84cc16, hoist:false, mentionable:true  },
    { name:'🔊 PR & Comunicare',      color:0xf472b6, hoist:false, mentionable:true  },
    { name:'🧠 Strateg',              color:0xc084fc, hoist:false, mentionable:true  },
    { name:'🚁 Teren Periculos',      color:0xef4444, hoist:false, mentionable:true  },
    { name:'🟢 Activ',                color:0x4ade80, hoist:false, mentionable:false },
    { name:'🔴 Acoperire',            color:0xC0181A, hoist:false, mentionable:false },
    { name:'🟡 Standby',              color:0xf59e0b, hoist:false, mentionable:false },
    { name:'⬛ Inactiv',              color:0x374151, hoist:false, mentionable:false },
    { name:'🏥 Recuperare',           color:0x6b7280, hoist:false, mentionable:false },
    { name:'🚫 Compromis',            color:0x991b1b, hoist:false, mentionable:false },
    { name:'👁️ Observator',           color:0x4b5563, hoist:false, mentionable:false },
    { name:'🆕 Nou Recrut',           color:0x6b7280, hoist:false, mentionable:false },
    { name:'🤝 Colaborator',          color:0x9ca3af, hoist:false, mentionable:false },
    { name:'📰 Sursă',                color:0x78716c, hoist:false, mentionable:false },
    { name:'🔇 Suspendat',            color:0x1f2937, hoist:false, mentionable:false },
    { name:'🏆 Documentar Finalizat', color:0xffd700, hoist:false, mentionable:false },
    { name:'⭐ Investigator Elit',    color:0xffd700, hoist:false, mentionable:false },
    { name:'🎖️ Veteran',              color:0xcd7f32, hoist:false, mentionable:false },
    { name:'💥 Prima Misiune',        color:0x84cc16, hoist:false, mentionable:false },
    { name:'🔥 10 Probe Colectate',   color:0xf97316, hoist:false, mentionable:false },
    { name:'💎 Dosar Închis',         color:0x67e8f9, hoist:false, mentionable:false },
  ];

  let creat = 0;
  for (const r of ROLURI) {
    if (!guild.roles.cache.find(x => x.name === r.name)) {
      try {
        await guild.roles.create({ name:r.name, colors:r.color, hoist:r.hoist, mentionable:r.mentionable, reason:'REGORDER setup' });
        creat++;
        await new Promise(res => setTimeout(res, 350));
      } catch(e) { console.error('Rol eroare:', r.name, e.message); }
    }
  }

  // Seteaza pozitiile - grade mari sus
  try {
    await guild.roles.fetch();
    const pozitii = [];
    const gradeOrdine = [
      '👁️ Fondator Regorder', '🔱 Director General', '⚡ Director Editorial',
      '🔐 Administrator', '🎙️ Șef Redacție', '⚖️ Editor Șef',
      '📹 Reporter Activ', '🔍 Investigator'
    ];
    // Gasim rolul bot ca referinta maxima
    const botMember = guild.members.cache.get(guild.client.user.id);
    const botRolPos = botMember?.roles?.highest?.position || 10;
    let pos = botRolPos - 1;
    for (const name of gradeOrdine) {
      const rol = guild.roles.cache.find(r => r.name === name);
      if (rol && pos > 0) {
        pozitii.push({ role: rol.id, position: pos });
        pos--;
      }
    }
    if (pozitii.length) await guild.roles.setPositions(pozitii).catch(e => console.error('Pozitii error:', e.message));
  } catch(e) { console.error('Setare pozitii error:', e.message); }

  console.log(`✓ Roluri: ${creat} create`);
}

// ── REGISTER COMMANDS ────────────────────────────────────
async function registerCommands(guild) {
  const cmds = [
    new SlashCommandBuilder().setName('alert').setDescription('Trimite alertă urgentă echipei')
      .addStringOption(o => o.setName('mesaj').setDescription('Mesajul').setRequired(true))
      .addStringOption(o => o.setName('locatie').setDescription('Locația').setRequired(false)),

    new SlashCommandBuilder().setName('stats').setDescription('Statistici Regorder live'),

    new SlashCommandBuilder().setName('top').setDescription('Clasament reporteri după probe'),

    new SlashCommandBuilder().setName('vehicul-alert').setDescription('Alertă vehicul suspect')
      .addStringOption(o => o.setName('numar').setDescription('Nr. înmatriculare').setRequired(true))
      .addStringOption(o => o.setName('locatie').setDescription('Locație observat').setRequired(false))
      .addStringOption(o => o.setName('detalii').setDescription('Detalii suplimentare').setRequired(false)),

    new SlashCommandBuilder().setName('persoana-alert').setDescription('Alertă persoană de interes')
      .addStringOption(o => o.setName('nume').setDescription('Numele persoanei').setRequired(true))
      .addStringOption(o => o.setName('locatie').setDescription('Locație observată').setRequired(false))
      .addStringOption(o => o.setName('detalii').setDescription('Detalii suplimentare').setRequired(false)),

    new SlashCommandBuilder().setName('sos').setDescription('🆘 URGENȚĂ — alertă imediată pentru Admin și Șef Redacție')
      .addStringOption(o => o.setName('mesaj').setDescription('Situația de urgență').setRequired(true)),

    new SlashCommandBuilder().setName('teren-on').setDescription('Anunță că ești pe teren')
      .addStringOption(o => o.setName('locatie').setDescription('Locația ta').setRequired(true))
      .addStringOption(o => o.setName('misiune').setDescription('Ce faci acolo').setRequired(false)),

    new SlashCommandBuilder().setName('teren-off').setDescription('Anunță că ai terminat misiunea de teren')
      .addStringOption(o => o.setName('raport').setDescription('Scurt raport — ce ai găsit').setRequired(false)),

    new SlashCommandBuilder().setName('teren-status').setDescription('Vezi cine e activ pe teren acum'),

    new SlashCommandBuilder().setName('clasament').setDescription('Clasament săptămânal ore teren — 1h = 1 punct'),
    new SlashCommandBuilder().setName('puncte').setDescription('Vezi punctele tale de teren'),

    new SlashCommandBuilder().setName('creaza-echipa').setDescription('Creează o echipă de investigație')
      .addStringOption(o => o.setName('nume').setDescription('Numele echipei').setRequired(true))
      .addStringOption(o => o.setName('misiune').setDescription('Misiunea / obiectivul').setRequired(true))
      .addStringOption(o => o.setName('locatie').setDescription('Locația investigației').setRequired(true))
      .addUserOption(o => o.setName('membru1').setDescription('Membru 1').setRequired(true))
      .addUserOption(o => o.setName('membru2').setDescription('Membru 2').setRequired(false))
      .addUserOption(o => o.setName('membru3').setDescription('Membru 3').setRequired(false))
      .addUserOption(o => o.setName('membru4').setDescription('Membru 4').setRequired(false)),
  ];


    new SlashCommandBuilder().setName('accept').setDescription('Acceptă un aplicant în echipă')
      .addUserOption(o => o.setName('user').setDescription('Utilizatorul de acceptat').setRequired(true))
      .addStringOption(o => o.setName('pozitie').setDescription('Poziția acordată').setRequired(true)
        .addChoices(
          { name: '📹 Reporter', value: '📹 Reporter' },
          { name: '🔍 Investigator', value: '🔍 Investigator' },
          { name: '📷 Fotograf', value: '📸 Fotograf' },
          { name: '🎬 Cameraman', value: '🎬 Cameraman' },
          { name: '✍️ Editor', value: '✍️ Editor' },
          { name: '🔊 PR & Comunicare', value: '🔊 PR & Comunicare' },
          { name: '🤝 Colaborator', value: '🤝 Colaborator' },
        ))
      .addStringOption(o => o.setName('mesaj').setDescription('Mesaj opțional pentru candidat').setRequired(false)),

    new SlashCommandBuilder().setName('respinge').setDescription('Respinge un aplicant')
      .addUserOption(o => o.setName('user').setDescription('Utilizatorul de respins').setRequired(true))
      .addStringOption(o => o.setName('motiv').setDescription('Motivul respingerii').setRequired(false)),

    new SlashCommandBuilder().setName('aplicatii').setDescription('Vezi aplicațiile în așteptare (doar admin)'),

    new SlashCommandBuilder().setName('whois').setDescription('Informații despre un membru')
      .addUserOption(o => o.setName('user').setDescription('Utilizatorul').setRequired(true)),

    new SlashCommandBuilder().setName('statistici').setDescription('Statistici complete server + Supabase'),

  await guild.commands.set(cmds);
  console.log('✓ Comenzi slash înregistrate');
}

// ── ROLURI REALIZARI AUTO ────────────────────────────────
async function checkRealizari(guild, reporterName) {
  if (!reporterName) return;

  // Cauta membrul dupa displayName sau username
  const member = guild.members.cache.find(m =>
    m.displayName === reporterName || m.user.username === reporterName
  );
  if (!member) return;

  // Numara probele din Supabase
  const { count: nrProbe } = await sb.from('probe').select('id', { count:'exact' }).eq('reporter', reporterName);
  const { count: nrArticole } = await sb.from('articole').select('id', { count:'exact' }).eq('reporter', reporterName).eq('publicat', true);

  // 10 probe
  if (nrProbe >= 10) {
    const rol = guild.roles.cache.find(r => r.name === '🔥 10 Probe Colectate');
    if (rol && !member.roles.cache.has(rol.id)) {
      await member.roles.add(rol);
      const ch = guild.channels.cache.get(CH_GENERAL);
      if (ch) ch.send({ embeds: [new EmbedBuilder().setColor(0xf97316).setDescription(`🔥 **${member.displayName}** a colectat **10 probe**! Felicitări!`)] });
    }
  }

  // Prima misiune (1 articol publicat)
  if (nrArticole >= 1) {
    const rol = guild.roles.cache.find(r => r.name === '💥 Prima Misiune');
    if (rol && !member.roles.cache.has(rol.id)) {
      await member.roles.add(rol);
      const ch = guild.channels.cache.get(CH_GENERAL);
      if (ch) ch.send({ embeds: [new EmbedBuilder().setColor(0x84cc16).setDescription(`💥 **${member.displayName}** și-a finalizat **prima misiune**! Bine ai venit în echipă!`)] });
    }
  }

  // Investigator Elit (5+ articole)
  if (nrArticole >= 5) {
    const rol = guild.roles.cache.find(r => r.name === '⭐ Investigator Elit');
    if (rol && !member.roles.cache.has(rol.id)) {
      await member.roles.add(rol);
      const ch = guild.channels.cache.get(CH_GENERAL);
      if (ch) ch.send({ embeds: [new EmbedBuilder().setColor(0xffd700).setDescription(`⭐ **${member.displayName}** a devenit **Investigator Elit**!`)] });
    }
  }
}

// ── RAPORT ZILNIC ────────────────────────────────────────
async function trimitRaportZilnic(guild) {
  const ch = guild.channels.cache.get(CH_GENERAL);
  if (!ch) return;

  const azi = new Date();
  azi.setHours(0,0,0,0);
  const aziISO = azi.toISOString();

  const [r1, r2, r3, r4, r5] = await Promise.all([
    sb.from('dosare').select('id', { count:'exact' }).eq('status','activ'),
    sb.from('probe').select('id,reporter', { count:'exact' }).gte('created_at', aziISO),
    sb.from('articole').select('id', { count:'exact' }).eq('publicat', true).gte('created_at', aziISO),
    sb.from('dosare').select('id', { count:'exact' }),
    sb.from('probe').select('reporter').gte('created_at', aziISO),
  ]);

  // Reporter cel mai activ azi
  const reporteriAzi = {};
  (r5.data || []).forEach(p => { reporteriAzi[p.reporter] = (reporteriAzi[p.reporter]||0) + 1; });
  const topReporter = Object.entries(reporteriAzi).sort((a,b)=>b[1]-a[1])[0];

  const embed = new EmbedBuilder()
    .setColor(RED)
    .setTitle('📊 RAPORT ZILNIC REGORDER')
    .setDescription(`**${azi.toLocaleDateString('ro-RO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}**`)
    .addFields(
      { name: '📂 Dosare active', value: String(r1.count || 0), inline: true },
      { name: '📂 Dosare totale', value: String(r4.count || 0), inline: true },
      { name: '⠀', value: '⠀', inline: true },
      { name: '🔍 Probe adăugate azi', value: String(r2.count || 0), inline: true },
      { name: '📰 Articole publicate azi', value: String(r3.count || 0), inline: true },
      { name: '⠀', value: '⠀', inline: true },
      { name: '🏆 Cel mai activ azi', value: topReporter ? `**${topReporter[0]}** — ${topReporter[1]} probe` : '—', inline: false },
      { name: '🗺️ Misiuni în roadmap', value: String(MISIUNI.length), inline: true },
    )
    .setFooter({ text: 'REGORDER · Raport automat zilnic' })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
  console.log('✓ Raport zilnic trimis');
}

// ── SISTEM ECHIPE ────────────────────────────────────────
let echipeTimere = {}; // { forumId: setTimeout }

async function creeazaEchipa(interaction, guild) {
  const nume    = interaction.options.getString('nume');
  const misiune = interaction.options.getString('misiune');
  const locatie = interaction.options.getString('locatie');
  const m1 = interaction.options.getUser('membru1');
  const m2 = interaction.options.getUser('membru2');
  const m3 = interaction.options.getUser('membru3');
  const m4 = interaction.options.getUser('membru4');

  const membri = [m1, m2, m3, m4].filter(Boolean);
  const lider  = interaction.user;

  // Numar echipe existente pentru ID unic
  const catEchipe = guild.channels.cache.get(CAT_ECHIPE_ID);
  const nrEchipe  = guild.channels.cache.filter(c => c.parentId === CAT_ECHIPE_ID).size;
  const echipaId  = String(nrEchipe + 1).padStart(3, '0');
  const slugNume  = `echipa-${echipaId}-${nume.toLowerCase().replace(/[^a-z0-9]/gi,'-').slice(0,20)}`;

  // Permisiuni — doar membrii echipei + Admin + Fondator
  const permisiuni = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // nimeni altcineva
    { id: lider.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ...membri.map(m => ({ id: m.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }))
  ];

  // Adauga Admin si Fondator
  const roleAdmin   = guild.roles.cache.find(r => r.name === '🔐 Admin');
  const roleFondator = guild.roles.cache.find(r => r.name === '👑 Fondator');
  const roleSef     = guild.roles.cache.find(r => r.name === '🎙️ Șef Redacție');
  if (roleAdmin)    permisiuni.push({ id: roleAdmin.id,    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  if (roleFondator) permisiuni.push({ id: roleFondator.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  if (roleSef)      permisiuni.push({ id: roleSef.id,      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });

  // Canal privat echipă
  const canalEchipa = await guild.channels.create({
    name: `🔴・${slugNume}`,
    type: ChannelType.GuildText,
    parent: CAT_ECHIPE_ID,
    permissionOverwrites: permisiuni,
    topic: `Echipa #${echipaId} — ${misiune} — ${locatie}`
  });

  // Forum probe echipă (vizibil pentru toți)
  const forum = await guild.channels.create({
    name: `📋・probe-${echipaId}`,
    type: ChannelType.GuildForum,
    parent: CAT_ECHIPE_ID,
    topic: `Probe echipa #${echipaId} — ${misiune}`,
    availableTags: [
      { name: 'Video', moderated: false },
      { name: 'Foto', moderated: false },
      { name: 'Document', moderated: false },
      { name: 'Sursă', moderated: false },
      { name: 'Observație', moderated: false },
    ]
  });

  // Mesaj de briefing în canalul echipei
  const membriMentions = [lider, ...membri].map(m => `<@${m.id}>`).join(' ');
  const embedBriefing = new EmbedBuilder()
    .setColor(RED)
    .setTitle(`🔴 ECHIPA #${echipaId} — ${nume.toUpperCase()}`)
    .addFields(
      { name: '🎯 Misiune', value: misiune, inline: false },
      { name: '📍 Locație', value: locatie, inline: true },
      { name: '👤 Lider', value: `<@${lider.id}>`, inline: true },
      { name: '👥 Membri', value: membri.length > 0 ? membri.map(m=>`<@${m.id}>`).join('\n') : '—', inline: false },
      { name: '📋 Forum probe', value: `<#${forum.id}>`, inline: true },
      { name: '⏰ Termen', value: '48 ore — postați probele în forum!', inline: true },
    )
    .setFooter({ text: `REGORDER · Echipa #${echipaId} · Forum se șterge dacă e gol în 48h` })
    .setTimestamp();

  await canalEchipa.send({ content: membriMentions, embeds: [embedBriefing] });

  // Post inițial în forum
  const forumPost = await forum.threads.create({
    name: `📋 BRIEFING — Echipa #${echipaId} — ${nume}`,
    message: {
      embeds: [new EmbedBuilder()
        .setColor(RED)
        .setTitle(`📋 FORUM PROBE — ECHIPA #${echipaId}`)
        .setDescription(`**Misiune:** ${misiune}\n**Locație:** ${locatie}\n**Lider:** <@${lider.id}>\n\n Postați toate probele colectate în acest forum.\n⏰ **Forumul se șterge automat dacă rămâne gol 48 de ore.**`)
        .setFooter({ text: 'REGORDER · Forum probe echipă' })
      ]
    }
  });

  // Timer 48h — verifică dacă forumul e gol
  const timerId = setTimeout(async () => {
    try {
      const forumChannel = guild.channels.cache.get(forum.id);
      if (!forumChannel) return;

      // Numara thread-urile din forum (altele decat briefing-ul)
      const threads = await forumChannel.threads.fetchActive();
      const threadsArchived = await forumChannel.threads.fetchArchived();
      const total = (threads.threads?.size || 0) + (threadsArchived.threads?.size || 0);

      // Daca nu sunt probe reale (doar thread-ul de briefing = 1)
      if (total <= 1) {
        await canalEchipa.delete('Forum gol 48h — echipă ștearsă automat').catch(()=>{});
        await forum.delete('Forum gol 48h — șters automat').catch(()=>{});

        // Notifica in general
        const ch = guild.channels.cache.get(CH_GENERAL);
        if (ch) await ch.send({ embeds: [new EmbedBuilder()
          .setColor(0x374151)
          .setDescription(`⬛ **Echipa #${echipaId} — ${nume}** a fost ștearsă automat — nicio probă postată în 48 ore.`)
        ]});

        console.log(`✓ Echipa #${echipaId} ștearsă (forum gol 48h)`);
      } else {
        console.log(`✓ Echipa #${echipaId} păstrată (${total} thread-uri în forum)`);
      }
    } catch(e) { console.error('Eroare timer echipa:', e.message); }
    delete echipeTimere[forum.id];
  }, 48 * 60 * 60 * 1000); // 48 ore

  echipeTimere[forum.id] = timerId;

  // Raspuns comanda (folosim editReply deoarece s-a facut deferReply inainte)
  await interaction.editReply({ embeds: [new EmbedBuilder()
    .setColor(GREEN)
    .setTitle(`✓ ECHIPA #${echipaId} CREATĂ`)
    .setDescription(`Canal: <#${canalEchipa.id}>\nForum probe: <#${forum.id}>\nMembri: ${[lider,...membri].map(m=>`<@${m.id}>`).join(' ')}`)
    .setFooter({ text: 'Forum se șterge automat dacă e gol în 48h' })
  ] });
}

// ── INTERACTION HANDLER ──────────────────────────────────
client.on('interactionCreate', async interaction => {
  try {
  const { guild } = interaction;
  const commandName = interaction.isChatInputCommand() ? interaction.commandName : null;

  // /alert
  if (commandName === 'alert') {
    const mesaj   = interaction.options.getString('mesaj');
    const locatie = interaction.options.getString('locatie');
    const embed = new EmbedBuilder().setColor(RED).setTitle('🚨 ALERTĂ REGORDER')
      .setDescription(`**${mesaj}**`)
      .addFields(
        { name:'👤 Reporter', value: interaction.user.displayName||interaction.user.username, inline:true },
        { name:'📍 Locație', value: locatie||'—', inline:true },
        { name:'⏰ Ora', value: new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'}), inline:true }
      ).setFooter({ text:'REGORDER · INVESTIGAȚIE ACTIVĂ' }).setTimestamp();
    const ch = guild.channels.cache.get(CH_ALERTE);
    if (ch) await ch.send({ content:'@everyone', embeds:[embed] });
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ Alertă trimisă!')], flags: 64 });
  }


  // ── BUTON APLICĂ ────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === 'btn_aplica') {
    const modal = new ModalBuilder()
      .setCustomId('modal_aplicare')
      .setTitle('📩 Aplicare Echipa Regorder');

    const numeInput = new TextInputBuilder()
      .setCustomId('apl_nume').setLabel('Numele tău complet')
      .setStyle(TextInputStyle.Short).setPlaceholder('Ex: Ion Popescu').setRequired(true);

    const pozitieInput = new TextInputBuilder()
      .setCustomId('apl_pozitie').setLabel('Poziția dorită')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Reporter, Cameraman, Editor, Researcher etc.')
      .setRequired(true);

    const experientaInput = new TextInputBuilder()
      .setCustomId('apl_experienta').setLabel('Experiența ta relevantă')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descrie pe scurt experiența ta în jurnalism, video, cercetare etc.')
      .setMinLength(20).setRequired(true);

    const motivatieInput = new TextInputBuilder()
      .setCustomId('apl_motivatie').setLabel('De ce vrei să te alături Regorder?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ce te motivează să faci parte din această echipă?')
      .setMinLength(20).setRequired(true);

    const contactInput = new TextInputBuilder()
      .setCustomId('apl_contact').setLabel('Contact (telefon / email opțional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Opțional — pentru a te putea contacta mai ușor')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(numeInput),
      new ActionRowBuilder().addComponents(pozitieInput),
      new ActionRowBuilder().addComponents(experientaInput),
      new ActionRowBuilder().addComponents(motivatieInput),
      new ActionRowBuilder().addComponents(contactInput),
    );
    return interaction.showModal(modal);
  }

  // ── MODAL SUBMIT APLICARE ────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === 'modal_aplicare') {
    const nume       = interaction.fields.getTextInputValue('apl_nume');
    const pozitie    = interaction.fields.getTextInputValue('apl_pozitie');
    const experienta = interaction.fields.getTextInputValue('apl_experienta');
    const motivatie  = interaction.fields.getTextInputValue('apl_motivatie');
    const contact    = interaction.fields.getTextInputValue('apl_contact') || '—';

    // Salveaza in Supabase
    try {
      await sb.from('aplicatii').insert({
        nume, pozitie, experienta,
        scrisoare: motivatie,
        telefon: contact,
        status: 'nou',
        created_at: new Date().toISOString()
      });
    } catch(e) { console.error('Supabase aplicare:', e.message); }

    // Embed pentru canal admin
    const embedAdmin = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle('📥 APLICAȚIE NOUĂ')
      .setDescription(`De la <@${interaction.user.id}> — **${interaction.user.tag}**`)
      .addFields(
        { name: '👤 Nume', value: nume, inline: true },
        { name: '🎯 Poziție dorită', value: pozitie, inline: true },
        { name: '📞 Contact', value: contact, inline: true },
        { name: '💼 Experiență', value: experienta.slice(0, 500), inline: false },
        { name: '💬 Motivație', value: motivatie.slice(0, 500), inline: false },
      )
      .setFooter({ text: `ID: ${interaction.user.id} · ${new Date().toLocaleDateString('ro-RO')}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`apl_accept_${interaction.user.id}_${pozitie}`).setLabel('✓ ACCEPTĂ').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`apl_respinge_${interaction.user.id}`).setLabel('✗ RESPINGE').setStyle(ButtonStyle.Danger),
    );

    const chAdmin = guild.channels.cache.get(CH_APL_ADMIN);
    if (chAdmin) await chAdmin.send({ embeds: [embedAdmin], components: [row] });

    // Pinguri admini
    const roleAdmin = guild.roles.cache.find(r => r.name === '🔐 Admin');
    const roleSef   = guild.roles.cache.find(r => r.name === '🎙️ Șef Redacție');
    if (chAdmin && (roleAdmin || roleSef)) {
      await chAdmin.send(`📥 Aplicație nouă de la **${nume}** pentru **${pozitie}**! ${roleAdmin?`<@&${roleAdmin.id}>`:''}${roleSef?` <@&${roleSef.id}>`:''}`)
        .then(m => setTimeout(() => m.delete().catch(()=>{}), 5000));
    }

    return interaction.reply({ embeds: [new EmbedBuilder()
      .setColor(GREEN)
      .setTitle('✓ APLICAȚIE TRIMISĂ!')
      .setDescription([
        `Mulțumim, **${nume}**! Aplicația ta a fost primită.`,
        '',
        `**Poziția aplicată:** ${pozitie}`,
        '',
        'Echipa va analiza aplicația și te va contacta în cel mai scurt timp.',
        'Poți urmări statusul în canalul 🔔・status-aplicație.'
      ].join('\n'))
      .setFooter({ text: 'REGORDER · Îți mulțumim pentru interes!' })
    ], flags: 64 });
  }

  // ── BUTOANE ACCEPT/RESPINGE DIN CANAL ADMIN ──────────────
  if (interaction.isButton() && interaction.customId.startsWith('apl_accept_')) {
    const canAccept = guild.members.cache.get(interaction.user.id)?.roles.cache.some(r => GRADE_RECRUTARE.includes(r.name));
    if (!canAccept) return interaction.reply({ content: '❌ Nu ai permisiunea să accepți aplicații.', flags: 64 });

    const parts   = interaction.customId.split('_');
    const userId  = parts[2];
    const pozitie = parts.slice(3).join('_').replace(/_/g,' ');

    const member = guild.members.cache.get(userId);
    if (!member) return interaction.reply({ content: '❌ Utilizatorul nu mai e pe server.', flags: 64 });

    // Da rol pozitie
    const rolPoz = guild.roles.cache.find(r => r.name === pozitie);
    const rolAplicant = guild.roles.cache.find(r => r.name === '📥 Aplicant');
    if (rolPoz) await member.roles.add(rolPoz).catch(()=>{});
    if (rolAplicant) await member.roles.remove(rolAplicant).catch(()=>{});

    // DM la candidat
    try {
      await member.send({ embeds: [new EmbedBuilder()
        .setColor(GREEN)
        .setTitle('🎉 APLICAȚIA TA A FOST ACCEPTATĂ!')
        .setDescription([
          `Felicitări! Ai fost acceptat în echipa **REGORDER** ca **${pozitie}**!`,
          '',
          'Acum ai acces complet la server. Bun venit în echipă!',
          '',
          '*— Echipa Regorder*'
        ].join('\n'))
        .setFooter({ text: 'REGORDER · Bun venit în echipă!' })
      ]});
    } catch(e) {}

    // Anunt in general
    const chGeneral = guild.channels.cache.get(CH_GENERAL);
    if (chGeneral) await chGeneral.send({ embeds: [new EmbedBuilder()
      .setColor(GREEN)
      .setDescription(`🎉 <@${userId}> s-a alăturat echipei ca **${pozitie}**! Bun venit! 👏`)
    ]});

    // Update mesaj admin
    await interaction.update({ components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('done').setLabel(`✓ Acceptat de ${interaction.user.username}`).setStyle(ButtonStyle.Success).setDisabled(true)
    )]});

    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith('apl_respinge_')) {
    const canReject = guild.members.cache.get(interaction.user.id)?.roles.cache.some(r => GRADE_RECRUTARE.includes(r.name));
    if (!canReject) return interaction.reply({ content: '❌ Nu ai permisiunea să respecți aplicații.', flags: 64 });

    const userId = interaction.customId.split('_')[2];
    const member = guild.members.cache.get(userId);

    if (member) {
      try {
        await member.send({ embeds: [new EmbedBuilder()
          .setColor(RED)
          .setTitle('📋 STATUS APLICAȚIE REGORDER')
          .setDescription([
            'Îți mulțumim pentru interesul față de echipa **REGORDER**.',
            '',
            'Din păcate, în urma analizei, nu am putut accepta aplicația ta în acest moment.',
            '',
            'Te încurajăm să aplici din nou în viitor dacă situația se schimbă.',
            '',
            '*— Echipa Regorder*'
          ].join('\n'))
          .setFooter({ text: 'REGORDER · Mulțumim pentru interes' })
        ]});
      } catch(e) {}
    }

    await interaction.update({ components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('done').setLabel(`✗ Respins de ${interaction.user.username}`).setStyle(ButtonStyle.Danger).setDisabled(true)
    )]});
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // /accept (slash command)
  if (commandName === 'accept') {
    const canAccept = guild.members.cache.get(interaction.user.id)?.roles.cache.some(r => GRADE_RECRUTARE.includes(r.name));
    if (!canAccept) return interaction.reply({ content: '❌ Doar ' + GRADE_RECRUTARE.join(', ') + ' pot accepta membri.', flags: 64 });

    const target  = interaction.options.getUser('user');
    const pozitie = interaction.options.getString('pozitie');
    const mesaj   = interaction.options.getString('mesaj') || '';
    const member  = guild.members.cache.get(target.id);
    if (!member) return interaction.reply({ content: '❌ Utilizatorul nu e pe server.', flags: 64 });

    const rolPoz      = guild.roles.cache.find(r => r.name === pozitie);
    const rolAplicant = guild.roles.cache.find(r => r.name === '📥 Aplicant');
    if (rolPoz) await member.roles.add(rolPoz).catch(()=>{});
    if (rolAplicant) await member.roles.remove(rolAplicant).catch(()=>{});

    try {
      await member.send({ embeds: [new EmbedBuilder()
        .setColor(GREEN)
        .setTitle('🎉 APLICAȚIA TA A FOST ACCEPTATĂ!')
        .setDescription([
          `Felicitări! Ai fost acceptat în echipa **REGORDER** ca **${pozitie}**!`,
          mesaj ? `
**Mesaj de la echipă:** ${mesaj}` : '',
          '',
          'Acum ai acces complet la server. Bun venit în echipă!',
        ].filter(Boolean).join('\n'))
      ]});
    } catch(e) {}

    const chGeneral = guild.channels.cache.get(CH_GENERAL);
    if (chGeneral) await chGeneral.send({ embeds: [new EmbedBuilder()
      .setColor(GREEN)
      .setDescription(`🎉 <@${target.id}> s-a alăturat echipei ca **${pozitie}**! Bun venit! 👏`)
    ]});

    return interaction.reply({ embeds: [new EmbedBuilder()
      .setColor(GREEN).setDescription(`✓ <@${target.id}> a fost acceptat ca **${pozitie}**.`)
    ], flags: 64 });
  }

  // /respinge (slash command)
  if (commandName === 'respinge') {
    const canReject = guild.members.cache.get(interaction.user.id)?.roles.cache.some(r => GRADE_RECRUTARE.includes(r.name));
    if (!canReject) return interaction.reply({ content: '❌ Doar ' + GRADE_RECRUTARE.join(', ') + ' pot respinge aplicanți.', flags: 64 });

    const target = interaction.options.getUser('user');
    const motiv  = interaction.options.getString('motiv') || 'Niciun motiv specificat.';
    const member = guild.members.cache.get(target.id);

    if (member) {
      try {
        await member.send({ embeds: [new EmbedBuilder()
          .setColor(RED)
          .setTitle('📋 STATUS APLICAȚIE REGORDER')
          .setDescription([
            'Îți mulțumim pentru interesul față de echipa **REGORDER**.',
            '',
            'Din păcate, nu am putut accepta aplicația ta în acest moment.',
            motiv !== 'Niciun motiv specificat.' ? `
**Motiv:** ${motiv}` : '',
            '',
            'Te încurajăm să aplici din nou în viitor.',
            '*— Echipa Regorder*'
          ].filter(Boolean).join('\n'))
        ]});
      } catch(e) {}
    }

    return interaction.reply({ embeds: [new EmbedBuilder()
      .setColor(RED).setDescription(`✓ <@${target.id}> a fost respins. Motiv: ${motiv}`)
    ], flags: 64 });
  }

  // /aplicatii
  if (commandName === 'aplicatii') {
    const canView = guild.members.cache.get(interaction.user.id)?.roles.cache.some(r => GRADE_RECRUTARE.includes(r.name));
    if (!canView) return interaction.reply({ content: '❌ Acces restricționat.', flags: 64 });

    const { data } = await sb.from('aplicatii').select('*').eq('status','nou').order('created_at',{ascending:false}).limit(10);
    if (!data?.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(GREEN).setDescription('✓ Nu există aplicații noi.')], flags: 64 });

    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle(`📥 APLICAȚII ÎN AȘTEPTARE — ${data.length}`)
      .setDescription(data.map((a,i) => [
        `**${i+1}. ${a.nume}** — ${a.pozitie}`,
        `📅 ${new Date(a.created_at).toLocaleDateString('ro-RO')}`,
      ].join(' · ')).join('\n'))
      .setFooter({ text: `Mergi în ${CH_APL_ADMIN ? '#aplicații-primite' : 'canalul admin'} pentru detalii` });

    return interaction.reply({ embeds: [embed], flags: 64 });
  }

  // /whois
  if (commandName === 'whois') {
    const target = interaction.options.getUser('user');
    const member = guild.members.cache.get(target.id);
    if (!member) return interaction.reply({ content: '❌ Utilizatorul nu e pe server.', flags: 64 });

    const roluri = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'Niciun rol';
    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(`👤 ${member.displayName}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '🏷️ Username', value: target.tag, inline: true },
        { name: '📅 Pe server din', value: member.joinedAt?.toLocaleDateString('ro-RO') || '—', inline: true },
        { name: '🎂 Cont creat', value: target.createdAt.toLocaleDateString('ro-RO'), inline: true },
        { name: '🎭 Roluri', value: roluri.slice(0, 500), inline: false },
      )
      .setFooter({ text: `ID: ${target.id}` });

    return interaction.reply({ embeds: [embed], flags: 64 });
  }

  // /statistici
  if (commandName === 'statistici') {
    const [r1, r2, r3, r4, r5] = await Promise.all([
      sb.from('dosare').select('id',{count:'exact'}).eq('status','activ'),
      sb.from('probe').select('id',{count:'exact'}),
      sb.from('articole').select('id',{count:'exact'}).eq('publicat',true),
      sb.from('documentare').select('id',{count:'exact'}).eq('publicat',true),
      sb.from('aplicatii').select('id',{count:'exact'}).eq('status','nou'),
    ]);
    const totalMembri = guild.memberCount;
    const membriOnline = guild.members.cache.filter(m => m.presence?.status === 'online').size;

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle('📊 STATISTICI REGORDER')
      .addFields(
        { name: '👥 Membri server', value: String(totalMembri), inline: true },
        { name: '🟢 Online acum', value: String(membriOnline), inline: true },
        { name: '📥 Aplicații noi', value: String(r5.count||0), inline: true },
        { name: '📂 Dosare active', value: String(r1.count||0), inline: true },
        { name: '🔍 Probe totale', value: String(r2.count||0), inline: true },
        { name: '📰 Articole publicate', value: String(r3.count||0), inline: true },
        { name: '🎬 Documentare', value: String(r4.count||0), inline: true },
        { name: '🗺️ Misiuni roadmap', value: String(MISIUNI.length), inline: true },
      )
      .setFooter({ text: 'REGORDER · Date live din Supabase' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // /misiuni
  if (commandName === 'misiuni') {
    const cats = [...new Set(MISIUNI.map(m=>m.cat))].sort();
    const embeds = cats.map(cat => {
      const items = MISIUNI.filter(m=>m.cat===cat);
      return new EmbedBuilder().setColor(CAT_COLORS[cat]||RED)
        .setTitle(`${CAT_EMOJI[cat]}  CAT. ${cat} — ${items[0].catLabel.toUpperCase()}`)
        .setDescription(items.map((m,i) => `\`${String(i+1).padStart(2,'0')}\` **${m.titlu}**\n　${m.tags.map(t=>`\`${t}\``).join(' ')} · ${m.status}`).join('\n\n'))
        .setFooter({ text:`${items.length} misiuni` });
    });
    await interaction.reply({ embeds: embeds.slice(0,10) });
  }

  // /misiune
  if (commandName === 'misiune') {
    const query = interaction.options.getString('nume').toLowerCase();
    const found = MISIUNI.find(m => m.titlu.toLowerCase().includes(query));
    if (!found) {
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(RED).setDescription(`✗ Nicio misiune găsită pentru **"${query}"**`)], flags: 64 });
      return;
    }
    const embed = new EmbedBuilder().setColor(CAT_COLORS[found.cat]||RED)
      .setTitle(`${CAT_EMOJI[found.cat]}  ${found.titlu.toUpperCase()}`)
      .setDescription(`*Categoria ${found.cat} — ${found.catLabel}*`)
      .addFields(
        { name:'📌 Status', value:found.status, inline:true },
        { name:'🏷️ Taguri', value:found.tags.map(t=>`\`${t}\``).join(' '), inline:true },
        { name:'📋 Pași investigativi', value:found.pasi.map((p,i)=>`\`${String(i+1).padStart(2,'0')}\` ${p}`).join('\n') }
      ).setFooter({ text:'REGORDER · ROADMAP INVESTIGATIV' });
    await interaction.reply({ embeds:[embed] });
  }

  // /stats
  if (commandName === 'stats') {
    await interaction.deferReply();
    const [r1,r2,r3,r4] = await Promise.all([
      sb.from('dosare').select('id',{count:'exact'}),
      sb.from('dosare').select('id',{count:'exact'}).eq('status','activ'),
      sb.from('probe').select('id',{count:'exact'}),
      sb.from('articole').select('id',{count:'exact'}).eq('publicat',true),
    ]);
    const embed = new EmbedBuilder().setColor(RED).setTitle('📊 STATISTICI REGORDER')
      .addFields(
        { name:'📂 Dosare totale', value:String(r1.count||0), inline:true },
        { name:'🔴 Dosare active', value:String(r2.count||0), inline:true },
        { name:'🔍 Probe colectate', value:String(r3.count||0), inline:true },
        { name:'📰 Articole publicate', value:String(r4.count||0), inline:true },
        { name:'🗺️ Misiuni roadmap', value:String(MISIUNI.length), inline:true },
      ).setFooter({ text:'REGORDER · Date live din Supabase' }).setTimestamp();
    await interaction.editReply({ embeds:[embed] });
  }

  // /top
  if (commandName === 'top') {
    await interaction.deferReply();
    const { data } = await sb.from('probe').select('reporter');
    if (!data?.length) { await interaction.editReply({ embeds:[new EmbedBuilder().setColor(RED).setDescription('Nicio probă înregistrată încă.')] }); return; }
    const counts = {};
    data.forEach(p => { if(p.reporter) counts[p.reporter] = (counts[p.reporter]||0)+1; });
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const embed = new EmbedBuilder().setColor(YELLOW).setTitle('🏆 CLASAMENT REPORTERI')
      .setDescription(sorted.map((r,i) => `${medals[i]} **${r[0]}** — ${r[1]} probe`).join('\n'))
      .setFooter({ text:'REGORDER · Clasament după probe colectate' }).setTimestamp();
    await interaction.editReply({ embeds:[embed] });
  }

  // /vehicul-alert
  if (commandName === 'vehicul-alert') {
    const numar   = interaction.options.getString('numar');
    const locatie = interaction.options.getString('locatie');
    const detalii = interaction.options.getString('detalii');

    // Cauta in Supabase
    const { data } = await sb.from('vehicule').select('*').ilike('nr_inmatriculare', `%${numar}%`).limit(1);
    const veh = data?.[0];

    const embed = new EmbedBuilder().setColor(YELLOW).setTitle(`🚗 ALERTĂ VEHICUL — ${numar.toUpperCase()}`)
      .addFields(
        { name:'🔢 Nr. înmatriculare', value:numar.toUpperCase(), inline:true },
        { name:'📍 Observat la', value:locatie||'—', inline:true },
        { name:'👤 Raportat de', value:interaction.user.displayName||interaction.user.username, inline:true },
      );
    if (veh) {
      embed.addFields(
        { name:'🚘 Marcă / Tip', value:`${veh.marca||'—'} ${veh.tip||''}`.trim(), inline:true },
        { name:'🎨 Culoare', value:veh.culoare||'—', inline:true },
        { name:'📂 Dosar', value:veh.dosar_id ? `Dosar înregistrat` : '—', inline:true },
      );
      if (veh.detalii) embed.addFields({ name:'📋 Detalii cunoscute', value:veh.detalii, inline:false });
    } else {
      embed.addFields({ name:'⚠️ Status', value:'Vehicul **necunoscut** în baza de date', inline:false });
    }
    if (detalii) embed.addFields({ name:'📝 Observații reporter', value:detalii, inline:false });
    embed.setFooter({ text:'REGORDER · Alertă vehicul' }).setTimestamp();

    const ch = guild.channels.cache.get(CH_ALERTE);
    if (ch) await ch.send({ content:'@here', embeds:[embed] });
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ Alertă vehicul trimisă!')], flags: 64 });
  }

  // /persoana-alert
  if (commandName === 'persoana-alert') {
    const nume    = interaction.options.getString('nume');
    const locatie = interaction.options.getString('locatie');
    const detalii = interaction.options.getString('detalii');

    const { data } = await sb.from('persoane').select('*').ilike('nume', `%${nume}%`).limit(1);
    const pers = data?.[0];

    const embed = new EmbedBuilder().setColor(RED).setTitle(`👤 ALERTĂ PERSOANĂ — ${nume.toUpperCase()}`)
      .addFields(
        { name:'👤 Nume', value:nume, inline:true },
        { name:'📍 Observat la', value:locatie||'—', inline:true },
        { name:'🕵️ Raportat de', value:interaction.user.displayName||interaction.user.username, inline:true },
      );
    if (pers) {
      embed.addFields(
        { name:'🎭 Rol cunoscut', value:pers.rol||'—', inline:true },
        { name:'📌 Status', value:pers.status||'—', inline:true },
      );
      if (pers.detalii) embed.addFields({ name:'📋 Detalii cunoscute', value:pers.detalii, inline:false });
    } else {
      embed.addFields({ name:'⚠️ Status', value:'Persoană **necunoscută** în baza de date', inline:false });
    }
    if (detalii) embed.addFields({ name:'📝 Observații reporter', value:detalii, inline:false });
    embed.setFooter({ text:'REGORDER · Alertă persoană de interes' }).setTimestamp();

    const ch = guild.channels.cache.get(CH_ALERTE);
    if (ch) await ch.send({ content:'@here', embeds:[embed] });
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ Alertă persoană trimisă!')], flags: 64 });
  }

  // /sos
  if (commandName === 'sos') {
    const mesaj = interaction.options.getString('mesaj');
    const roleAdmin   = guild.roles.cache.find(r => r.name === '🔐 Admin');
    const roleSef     = guild.roles.cache.find(r => r.name === '🎙️ Șef Redacție');
    const roleFondator = guild.roles.cache.find(r => r.name === '👑 Fondator');

    const pinguri = [roleAdmin, roleSef, roleFondator].filter(Boolean).map(r=>`<@&${r.id}>`).join(' ');

    const embed = new EmbedBuilder().setColor(RED)
      .setTitle('🆘 SOS — URGENȚĂ IMEDIATĂ')
      .setDescription(`**${mesaj}**`)
      .addFields(
        { name:'👤 Reporter', value:`<@${interaction.user.id}>`, inline:true },
        { name:'📍 Canal', value:`<#${interaction.channelId}>`, inline:true },
        { name:'⏰ Ora', value:new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'}), inline:true },
      ).setFooter({ text:'REGORDER · URGENȚĂ — Răspundeți imediat!' }).setTimestamp();

    const ch = guild.channels.cache.get(CH_ALERTE);
    if (ch) await ch.send({ content:`🆘 ${pinguri} 🆘`, embeds:[embed] });
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ SOS trimis! Superiorii au fost alertați.')], flags: 64 });
  }

  // /teren-on
  if (commandName === 'teren-on') {
    const locatie = interaction.options.getString('locatie');
    const misiune = interaction.options.getString('misiune');
    const user    = interaction.user;
    const member  = await guild.members.fetch(user.id);
    const nume    = member.displayName || user.username;

    peTerenAcum[user.id] = { nume, locatie, misiune, startTime: Date.now() };

    // Rol Activ
    const rolActiv = guild.roles.cache.find(r => r.name === '🟢 Activ');
    if (rolActiv && !member.roles.cache.has(rolActiv.id)) await member.roles.add(rolActiv).catch(()=>{});

    // Anunt in teren-live
    const ch = guild.channels.cache.get(CH_TEREN);
    if (ch) {
      await ch.send({ embeds: [new EmbedBuilder()
        .setColor(GREEN)
        .setAuthor({ name: 'REGORDER · CHECK-IN TEREN', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
        .setTitle('🟢 REPORTER ACTIV')
        .addFields(
          { name: '👤 Reporter', value: `**${nume}**`, inline: true },
          { name: '📍 Locație', value: `**${locatie}**`, inline: true },
          { name: '⏰ Check-in', value: `**${new Date().toLocaleTimeString('ro-RO', {hour:'2-digit',minute:'2-digit'})}**`, inline: true },
          misiune ? { name: '🎯 Misiune', value: misiune, inline: false } : { name: '​', value: '​', inline: false }
        )
        .setDescription('> Reporterul a intrat pe teren. Echipa a fost notificată.')
        .setFooter({ text: 'REGORDER · 1 oră activă = 1 punct · regorder.live' })
        .setTimestamp()
      ]});
    }

    await updateTerenMesaj(guild);
    await interaction.reply({ embeds:[new EmbedBuilder()
      .setColor(GREEN)
      .setTitle('✓ CHECK-IN CONFIRMAT')
      .setDescription(`Ești acum **pe teren** la **${locatie}**.\n\nEchipa a fost notificată. La finalul misiunii folosește \`/teren-off\`.\n\n> ⭐ Fiecare oră pe teren = **1 punct** în clasament.`)
      .setFooter({ text: 'REGORDER · Teren Live' })
    ], flags: 64 });
  }

  // /teren-off
  if (commandName === 'teren-off') {
    const raport  = interaction.options.getString('raport');
    const user    = interaction.user;
    const member  = await guild.members.fetch(user.id);
    const nume    = member.displayName || user.username;
    const info    = peTerenAcum[user.id];

    if (!info) {
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(RED).setDescription('✗ Nu ești înregistrat pe teren. Folosește `/teren-on` mai întâi.')], flags: 64 });
      return;
    }

    const elapsed = Math.floor((Date.now() - info.startTime) / 60000);
    const ore = Math.floor(elapsed / 60);
    const min = elapsed % 60;
    const timp = ore > 0 ? `${ore}h ${min}min` : `${min} min`;

    delete peTerenAcum[user.id];

    // Scoate rol Activ
    const rolActiv = guild.roles.cache.find(r => r.name === '🟢 Activ');
    if (rolActiv && member.roles.cache.has(rolActiv.id)) await member.roles.remove(rolActiv).catch(()=>{});

    // Salveaza puncte
    await adaugaPuncte(user.id, nume, elapsed);
    const puncteCastigate = Math.floor(elapsed / 60);

    const ch = guild.channels.cache.get(CH_TEREN);
    if (ch) {
      await ch.send({ embeds: [new EmbedBuilder()
        .setColor(0x374151)
        .setAuthor({ name: 'REGORDER · CHECK-OUT TEREN', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
        .setTitle('⬛ REPORTER REVENIT')
        .addFields(
          { name: '👤 Reporter', value: `**${nume}**`, inline: true },
          { name: '📍 Locație', value: `**${info.locatie}**`, inline: true },
          { name: '⏱️ Timp activ', value: `**${timp}**`, inline: true },
          { name: '⭐ Puncte câștigate', value: `**${puncteCastigate}p**`, inline: true },
          raport ? { name: '📋 Raport', value: raport, inline: false } : { name: '​', value: '​', inline: false }
        )
        .setDescription('> Misiunea s-a încheiat. Punctele au fost adăugate în clasament.')
        .setFooter({ text: 'REGORDER · regorder.live' })
        .setTimestamp()
      ]});
    }

    await updateTerenMesaj(guild);
    await interaction.reply({ embeds:[new EmbedBuilder()
      .setColor(GREEN)
      .setTitle('✓ MISIUNE ÎNCHEIATĂ')
      .setDescription(`**Timp pe teren:** ${timp}\n**Puncte câștigate:** ${puncteCastigate}p\n\n> Folosește \`/clasament\` pentru a vedea clasamentul săptămânii.`)
      .setFooter({ text: 'REGORDER · Teren Live' })
    ], flags: 64 });
  }

  // /teren-status
  if (commandName === 'teren-status') {
    const activi = Object.values(peTerenAcum);
    if (!activi.length) {
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(0x374151).setDescription('*Niciun reporter pe teren în acest moment.*')], flags: 64 });
      return;
    }
    const embed = new EmbedBuilder().setColor(RED).setTitle('📡 TEREN STATUS')
      .setDescription(activi.map(r => {
        const elapsed = Math.floor((Date.now() - r.startTime) / 60000);
        const ore = Math.floor(elapsed / 60);
        const min = elapsed % 60;
        const timp = ore > 0 ? `${ore}h ${min}min` : `${min} min`;
        return `🔴 **${r.nume}** — 📍 ${r.locatie} · ⏱️ ${timp}${r.misiune ? `\n🎯 ${r.misiune}` : ''}`;
      }).join('\n\n'))
      .setFooter({ text: `${activi.length} reporter${activi.length>1?'i':''} activ${activi.length>1?'i':''}` });
    await interaction.reply({ embeds:[embed] });
  }

  // /clasament
  if (commandName === 'clasament') {
    const sapt = getWeekKey();
    const { data } = await sb.from('puncte_teren').select('*')
      .eq('saptamana', sapt).order('puncte', { ascending: false }).limit(15);

    if (!data?.length) {
      await interaction.reply({ embeds:[new EmbedBuilder()
        .setColor(RED)
        .setTitle('📊 CLASAMENT SĂPTĂMÂNAL')
        .setDescription('*Niciun punct înregistrat săptămâna aceasta.*\n\nFolosește `/teren-on` și `/teren-off` pentru a acumula puncte!')
        .setFooter({ text: `Săptămâna: ${sapt} · 1h teren = 1 punct` })
      ], flags: 64 });
      return;
    }

    const medals = ['🥇','🥈','🥉'];
    const rows = data.map((r, i) => {
      const medal = medals[i] || `**${i+1}.**`;
      const ore = Math.floor(r.minute / 60);
      const min = r.minute % 60;
      return `${medal} **${r.username}** — ${r.puncte}p *(${ore}h ${min}min)*`;
    }).join('\n');

    await interaction.reply({ embeds:[new EmbedBuilder()
      .setColor(RED)
      .setAuthor({ name: 'REGORDER · CLASAMENT', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
      .setTitle('📊 CLASAMENT SĂPTĂMÂNAL — TEREN')
      .setDescription(rows)
      .addFields({ name: '━━━━━━━━━━━━━━━━━━━━━━', value: '> ⭐ 1 oră activă pe teren = **1 punct**\n> Clasamentul se resetează în fiecare **luni dimineață**.', inline: false })
      .setFooter({ text: `Săptămâna: ${sapt}` })
      .setTimestamp()
    ]});
    return;
  }

  // /puncte
  if (commandName === 'puncte') {
    const sapt = getWeekKey();
    const userId = interaction.user.id;
    const { data } = await sb.from('puncte_teren').select('*')
      .eq('user_id', userId).eq('saptamana', sapt).single().catch(() => ({ data: null }));

    const { data: allTime } = await sb.from('puncte_teren').select('puncte, minute')
      .eq('user_id', userId);
    const totalPuncte = (allTime||[]).reduce((s,r) => s + (r.puncte||0), 0);
    const totalMinute = (allTime||[]).reduce((s,r) => s + (r.minute||0), 0);

    const saptPuncte = data?.puncte || 0;
    const saptMinute = data?.minute || 0;
    const oreS = Math.floor(saptMinute / 60);
    const minS = saptMinute % 60;
    const oreT = Math.floor(totalMinute / 60);
    const minT = totalMinute % 60;

    await interaction.reply({ embeds:[new EmbedBuilder()
      .setColor(RED)
      .setAuthor({ name: 'REGORDER · PUNCTELE TALE', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
      .setTitle(`⭐ ${interaction.user.username}`)
      .addFields(
        { name: '📅 Săptămâna aceasta', value: `**${saptPuncte}p** (${oreS}h ${minS}min)`, inline: true },
        { name: '🏆 Total all-time', value: `**${totalPuncte}p** (${oreT}h ${minT}min)`, inline: true },
      )
      .setDescription('> Folosește `/clasament` pentru a vedea top-ul săptămânii.')
      .setFooter({ text: `Săptămâna: ${sapt} · 1h = 1 punct` })
      .setTimestamp()
    ], flags: 64 });
    return;
  }

  // /creaza-echipa
  if (commandName === 'creaza-echipa') {
    const member = await guild.members.fetch(interaction.user.id);
    const areGrad = member.roles.cache.some(r => GRADE_SUPERIOARE.includes(r.name));
    if (!areGrad) {
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(RED).setDescription('✗ Nu ai permisiunea să creezi echipe. Necesită grad de Reporter sau mai mare.')], flags: 64 });
      return;
    }
    await interaction.deferReply({ ephemeral:true });
    await creeazaEchipa(interaction, guild);
  }
  } catch(e) {
    console.error('Interaction error:', e.message);
    try {
      const errEmbed = new EmbedBuilder().setColor(RED).setDescription('❌ A apărut o eroare. Încearcă din nou.');
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errEmbed] }).catch(()=>{});
      } else if (interaction.isRepliable()) {
        await interaction.reply({ embeds: [errEmbed], flags: 64 }).catch(()=>{});
      }
    } catch(_) {}
  }
});

// ── NOU MEMBRU → ROL AUTOMAT ──────────────────────────────
client.on('guildMemberAdd', async member => {
  const rol = member.guild.roles.cache.find(r => r.name === '🆕 Nou Recrut');
  if (rol) await member.roles.add(rol).catch(()=>{});
  const ch = member.guild.channels.cache.get(CH_GENERAL);
  if (ch) await ch.send({ embeds:[new EmbedBuilder()
    .setColor(RED)
    .setTitle('🆕 RECRUT NOU')
    .setDescription(`Bun venit pe serverul **REGORDER**, <@${member.id}>!\nAi primit rolul \`🆕 Nou Recrut\`. Un superior îți va asigna rolul definitiv în curând.\n\n*"Adevărul nu se ascunde — se filmează."*`)
    .setFooter({ text:'REGORDER · Investigații Live' })
  ]});
});

// ── POLLING PUBLICATII ───────────────────────────────────
// Tracks: { id, updated_at } for each table so we catch both new rows AND edits.
// articole  → only when publicat=true
// documentare → only when publicat=true
// dosare    → every new dosar
// probe     → every new probă
// persoane  → every new persoană identificată
// vehicule  → every new vehicul

const lastSeen = {
  articol:     { id: null, updated_at: null },
  documentar:  { id: null, updated_at: null },
  dosar:       { id: null, updated_at: null },
  proba:       { id: null, updated_at: null },
  persoana:    { id: null, updated_at: null },
  vehicul:     { id: null, updated_at: null },
};

async function checkPublicatii(guild) {
  const ch = guild.channels.cache.get(CH_PUBLICATII);
  if (!ch) return;

  // ── 1. ARTICOLE (doar publicate) ─────────────────────
  try {
    const { data: articole } = await sb.from('articole')
      .select('*').eq('publicat', true)
      .order('updated_at', { ascending: false }).limit(1);

    if (articole?.length) {
      const art = articole[0];
      const prev = lastSeen.articol;
      const isNew    = prev.id && art.id !== prev.id;
      const isEdited = prev.id && art.id === prev.id && art.updated_at !== prev.updated_at;

      if (isNew || isEdited) {
        const embed = new EmbedBuilder()
          .setColor(isNew ? RED : BLUE)
          .setTitle(isNew
            ? `📰 ARTICOL NOU — ${art.titlu.toUpperCase()}`
            : `✏️ ARTICOL EDITAT — ${art.titlu.toUpperCase()}`)
          .setDescription(art.rezumat || (art.continut || '').slice(0, 200) + '...' || '—')
          .addFields(
            { name: '✍️ Reporter', value: art.reporter || '—', inline: true },
            { name: '📍 Locație',  value: art.locatie  || '—', inline: true },
            { name: '📌 Status',   value: art.status   || '—', inline: true },
          )
          .setFooter({ text: isNew ? 'REGORDER · Articol publicat' : 'REGORDER · Articol actualizat' })
          .setTimestamp(new Date(art.updated_at || art.created_at));
        if (art.tags?.length) embed.addFields({ name: '🏷️ Taguri', value: art.tags.map(t => `\`${t}\``).join(' ') });
        await ch.send({ embeds: [embed] });
        if (isNew) await checkRealizari(guild, art.reporter);
      }

      lastSeen.articol = { id: art.id, updated_at: art.updated_at };
    }
  } catch(e) { console.error('Polling articole:', e.message); }

  // ── 2. DOCUMENTARE (doar publicate) ──────────────────
  try {
    const { data: docs } = await sb.from('documentare')
      .select('*').eq('publicat', true)
      .order('updated_at', { ascending: false }).limit(1);

    if (docs?.length) {
      const doc = docs[0];
      const prev = lastSeen.documentar;
      const isNew    = prev.id && doc.id !== prev.id;
      const isEdited = prev.id && doc.id === prev.id && doc.updated_at !== prev.updated_at;

      if (isNew || isEdited) {
        const embed = new EmbedBuilder()
          .setColor(isNew ? PURPLE : BLUE)
          .setTitle(isNew
            ? `🎬 DOCUMENTAR NOU — ${doc.titlu.toUpperCase()}`
            : `✏️ DOCUMENTAR EDITAT — ${doc.titlu.toUpperCase()}`)
          .setDescription(doc.descriere || '—')
          .addFields(
            { name: '🎬 Regizor',  value: doc.regizor  || '—', inline: true },
            { name: '📅 An',       value: doc.an       || '—', inline: true },
            { name: '⏱️ Durată',   value: doc.durata   || '—', inline: true },
            { name: '🎭 Gen',      value: doc.gen      || '—', inline: true },
            { name: '📍 Locație',  value: doc.locatie  || '—', inline: true },
            { name: '📌 Status',   value: doc.status   || '—', inline: true },
          )
          .setFooter({ text: isNew ? 'REGORDER · Documentar publicat' : 'REGORDER · Documentar actualizat' })
          .setTimestamp(new Date(doc.updated_at || doc.created_at));
        if (doc.tags?.length) embed.addFields({ name: '🏷️ Taguri', value: doc.tags.map(t => `\`${t}\``).join(' ') });
        if (doc.link_video) embed.addFields({ name: '🔗 Video', value: doc.link_video });
        await ch.send({ embeds: [embed] });
      }

      lastSeen.documentar = { id: doc.id, updated_at: doc.updated_at };
    }
  } catch(e) { console.error('Polling documentare:', e.message); }

  // ── 3. DOSARE (orice dosar nou) ──────────────────────
  try {
    const { data: dosare } = await sb.from('dosare')
      .select('*').order('created_at', { ascending: false }).limit(1);

    if (dosare?.length) {
      const dos = dosare[0];
      const prev = lastSeen.dosar;

      if (prev.id && dos.id !== prev.id) {
        await ch.send({ embeds: [new EmbedBuilder().setColor(YELLOW)
          .setTitle(`📂 DOSAR NOU — #${dos.numar} · ${dos.titlu.toUpperCase()}`)
          .addFields(
            { name: '📍 Locație',  value: dos.locatie            || '—', inline: true },
            { name: '👤 Reporter', value: dos.reporter_principal || '—', inline: true },
            { name: '📌 Status',   value: dos.status             || '—', inline: true },
          )
          .setFooter({ text: 'REGORDER · Dosar deschis' })
          .setTimestamp(new Date(dos.created_at))
        ]});
      }

      lastSeen.dosar = { id: dos.id, updated_at: null };
    }
  } catch(e) { console.error('Polling dosare:', e.message); }

  // ── 4. PROBE (orice probă nouă) ──────────────────────
  try {
    const { data: probe } = await sb.from('probe')
      .select('*').order('created_at', { ascending: false }).limit(1);

    if (probe?.length) {
      const proba = probe[0];
      const prev  = lastSeen.proba;

      if (prev.id && proba.id !== prev.id) {
        await ch.send({ embeds: [new EmbedBuilder().setColor(GREEN)
          .setTitle(`🔍 PROBĂ NOUĂ — ${(proba.numar ? `#${proba.numar} · ` : '') + proba.descriere.slice(0, 60).toUpperCase()}`)
          .addFields(
            { name: '✍️ Reporter', value: proba.reporter   || '—', inline: true },
            { name: '📦 Tip',      value: proba.tip        || '—', inline: true },
            { name: '📌 Status',   value: proba.status     || '—', inline: true },
          )
          .setFooter({ text: 'REGORDER · Probă înregistrată' })
          .setTimestamp(new Date(proba.created_at))
        ]});
        await checkRealizari(guild, proba.reporter);
      }

      lastSeen.proba = { id: proba.id, updated_at: null };
    }
  } catch(e) { console.error('Polling probe:', e.message); }

  // ── 5. PERSOANE (orice persoană nouă identificată) ───
  try {
    const { data: persoane } = await sb.from('persoane')
      .select('*').order('created_at', { ascending: false }).limit(1);

    if (persoane?.length) {
      const per  = persoane[0];
      const prev = lastSeen.persoana;

      if (prev.id && per.id !== prev.id) {
        await ch.send({ embeds: [new EmbedBuilder().setColor(YELLOW)
          .setTitle(`🧑 PERSOANĂ NOUĂ — ${per.nume.toUpperCase()}`)
          .addFields(
            { name: '🎭 Rol',     value: per.rol    || '—', inline: true },
            { name: '📌 Status',  value: per.status || '—', inline: true },
            { name: '📝 Detalii', value: (per.detalii || '—').slice(0, 200), inline: false },
          )
          .setFooter({ text: 'REGORDER · Persoană identificată' })
          .setTimestamp(new Date(per.created_at))
        ]});
      }

      lastSeen.persoana = { id: per.id, updated_at: null };
    }
  } catch(e) { console.error('Polling persoane:', e.message); }

  // ── 6. VEHICULE (orice vehicul nou) ──────────────────
  try {
    const { data: vehicule } = await sb.from('vehicule')
      .select('*').order('created_at', { ascending: false }).limit(1);

    if (vehicule?.length) {
      const veh  = vehicule[0];
      const prev = lastSeen.vehicul;

      if (prev.id && veh.id !== prev.id) {
        await ch.send({ embeds: [new EmbedBuilder().setColor(RED)
          .setTitle(`🚗 VEHICUL NOU — ${veh.nr_inmatriculare.toUpperCase()}`)
          .addFields(
            { name: '🚘 Marcă',   value: veh.marca  || '—', inline: true },
            { name: '🎨 Culoare', value: veh.culoare || '—', inline: true },
            { name: '📦 Tip',     value: veh.tip     || '—', inline: true },
            { name: '📝 Detalii', value: (veh.detalii || '—').slice(0, 200), inline: false },
          )
          .setFooter({ text: 'REGORDER · Vehicul înregistrat' })
          .setTimestamp(new Date(veh.created_at))
        ]});
      }

      lastSeen.vehicul = { id: veh.id, updated_at: null };
    }
  } catch(e) { console.error('Polling vehicule:', e.message); }
}

// ── SCHEDULER (verifică ora pentru raport zilnic) ────────
function startScheduler(guild) {
  setInterval(async () => {
    const acum = new Date();
    // Raport zilnic la 20:00
    if (acum.getHours() === 20 && acum.getMinutes() === 0) {
      await trimitRaportZilnic(guild);
    }
    // Update mesaj teren live
    await updateTerenMesaj(guild);
    // Polling publicatii
    await checkPublicatii(guild);
  }, 60_000);
}

// ── BOT READY ────────────────────────────────────────────
client.once('clientReady', async () => {
  console.log(`✓ Bot pornit ca ${client.user.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) { console.error('✗ Server negăsit!'); return; }

  await guild.members.fetch();
  await setupCanale(guild);
  await setupRoluri(guild);
  await setupAplicare(guild);
  await registerCommands(guild);

  // Seed lastSeen so the first poll doesn't re-announce everything
  const [sa, sdoc, sd, sp, sper, sv] = await Promise.all([
    sb.from('articole').select('id, updated_at').eq('publicat',true).order('updated_at',{ascending:false}).limit(1),
    sb.from('documentare').select('id, updated_at').eq('publicat',true).order('updated_at',{ascending:false}).limit(1),
    sb.from('dosare').select('id').order('created_at',{ascending:false}).limit(1),
    sb.from('probe').select('id').order('created_at',{ascending:false}).limit(1),
    sb.from('persoane').select('id').order('created_at',{ascending:false}).limit(1),
    sb.from('vehicule').select('id').order('created_at',{ascending:false}).limit(1),
  ]);
  if (sa?.data?.length)   lastSeen.articol    = { id: sa.data[0].id,   updated_at: sa.data[0].updated_at };
  if (sdoc?.data?.length) lastSeen.documentar = { id: sdoc.data[0].id, updated_at: sdoc.data[0].updated_at };
  if (sd?.data?.length)   lastSeen.dosar      = { id: sd.data[0].id,   updated_at: null };
  if (sp?.data?.length)   lastSeen.proba      = { id: sp.data[0].id,   updated_at: null };
  if (sper?.data?.length) lastSeen.persoana   = { id: sper.data[0].id, updated_at: null };
  if (sv?.data?.length)   lastSeen.vehicul    = { id: sv.data[0].id,   updated_at: null };

  startScheduler(guild);
  console.log('✓ REGORDER Bot complet și gata!');

  // Porneste polling dupa ce botul e gata
  pollAplicatii(); // primul poll imediat
  setInterval(pollAplicatii, 30000); // apoi la fiecare 30s
});


// ── WELCOME AUTOMAT ──────────────────────────────────────
client.on('guildMemberAdd', async member => {
  try { await welcomeMembru(member); } catch(e) { console.error('Welcome error:', e.message); }
});


// ── POLLING SUPABASE — Aplicații site + Donații ──────────
async function pollAplicatii() {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) { console.log('Poll: guild null'); return; }

    // Check aplicatii nenotificate
    const { data: aplicatii, error: aplErr } = await sb.from('aplicatii')
      .select('*').eq('notificat_discord', false)
      .order('created_at', { ascending: true }).limit(5);
    console.log('Poll aplicatii:', aplicatii?.length || 0, 'nenotificate', aplErr ? 'ERR:'+aplErr.message : '');

    if (aplicatii?.length) {
      lastAplicatieCheck = aplicatii[aplicatii.length-1].created_at;
      let chAdmin = guild.channels.cache.get(CH_APL_ADMIN);
      if (!chAdmin) chAdmin = guild.channels.cache.find(c => c.name === '🔏・aplicații-primite');
      if (!chAdmin) { console.error('Canal aplicatii-primite negasit'); return; }

      for (const a of aplicatii) {
        const embed = new EmbedBuilder()
          .setColor(0xf59e0b)
          .setAuthor({ name: 'REGORDER · APLICAȚIE NOUĂ DE PE SITE', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
          .setTitle('📥 CANDIDATURĂ PRIMITĂ')
          .addFields(
            { name: '👤 Nume', value: a.nume || '—', inline: true },
            { name: '🎯 Poziție', value: a.pozitie || '—', inline: true },
            { name: '📞 Contact', value: a.telefon || '—', inline: true },
            { name: '💼 Experiență', value: (a.experienta || '—').slice(0,400), inline: false },
            { name: '💬 Scrisoare', value: (a.scrisoare || '—').slice(0,400), inline: false },
          )
          .setDescription('> Aplicație trimisă prin **regorder.live/cariere**')
          .setFooter({ text: `${new Date(a.created_at).toLocaleDateString('ro-RO', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}` })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('apl_accept_' + a.id + '_' + (a.pozitie||'Colaborator')).setLabel('✓ ACCEPTĂ').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('apl_respinge_' + a.id).setLabel('✗ RESPINGE').setStyle(ButtonStyle.Danger),
        );

        // Ping roluri
        const roleAdmin = guild.roles.cache.find(r => r.name === '🔐 Administrator');
        const roleSef   = guild.roles.cache.find(r => r.name === '🎙️ Șef Redacție');
        const pingStr   = [roleAdmin, roleSef].filter(Boolean).map(r => `<@&${r.id}>`).join(' ');

        await chAdmin.send({ content: pingStr ? pingStr + ' — Aplicație nouă!' : null, embeds: [embed], components: [row] });
        // Mark as notified
        await sb.from('aplicatii').update({ notificat_discord: true }).eq('id', a.id);
      }
    }

    // Check mesaje donatie noi
    const { data: mesaje } = await sb.from('mesaje_contact')
      .select('*').eq('notificat_discord', false)
      .order('created_at', { ascending: true }).limit(5);

    if (mesaje?.length) {
      // Post in aplicatii-primite or a general admin channel
      let chAdmin2 = guild.channels.cache.get(CH_APL_ADMIN);
      if (!chAdmin2) chAdmin2 = guild.channels.cache.find(c => c.name === '🔏・aplicații-primite');
      if (!chAdmin2) { console.error('Canal mesaje negasit'); return; }
      const chAdmin = chAdmin2;

      for (const m of mesaje) {
        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setAuthor({ name: 'REGORDER · CERERE DONAȚIE', iconURL: 'https://wrjvymujwjsjytigzdua.supabase.co/storage/v1/object/public/regorder/logo/regorder-lockup-transparent.png' })
          .setTitle('💰 CERERE DE DONAȚIE')
          .addFields(
            { name: '👤 Nume', value: m.nume || '—', inline: true },
            { name: '📧 Contact', value: m.email || '—', inline: true },
            { name: '💬 Mesaj', value: (m.mesaj || '—').slice(0,500), inline: false },
          )
          .setDescription('> Mesaj trimis prin **regorder.live/sustinatori**')
          .setFooter({ text: new Date(m.created_at).toLocaleDateString('ro-RO', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) })
          .setTimestamp();

        const roleDir = guild.roles.cache.find(r => r.name === '🔱 Director General');
        const roleFond = guild.roles.cache.find(r => r.name === '👁️ Fondator Regorder');
        const pingStr = [roleFond, roleDir].filter(Boolean).map(r => `<@&${r.id}>`).join(' ');

        await chAdmin.send({ content: pingStr ? pingStr + ' — Cerere donație nouă!' : null, embeds: [embed] });
        await sb.from('mesaje_contact').update({ notificat_discord: true }).eq('id', m.id);
      }
    }
  } catch(e) { console.error('Poll error:', e.message); }
}

client.login(TOKEN);
