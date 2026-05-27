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
const GRADE_SUPERIOARE = ['👑 Fondator','🎙️ Șef Redacție','🔐 Admin','⚖️ Editor Șef','📹 Reporter','🔍 Investigator'];

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

async function updateTerenMesaj(guild) {
  const ch = guild.channels.cache.get(CH_TEREN);
  if (!ch) return;

  const activi = Object.values(peTerenAcum);

  const embed = new EmbedBuilder()
    .setColor(activi.length > 0 ? RED : 0x374151)
    .setTitle('📡 REPORTERI ACTIVI PE TEREN')
    .setTimestamp();

  if (activi.length === 0) {
    embed.setDescription('*Niciun reporter pe teren în acest moment.*');
  } else {
    embed.setDescription(
      activi.map(r => {
        const elapsed = Math.floor((Date.now() - r.startTime) / 60000);
        const ore = Math.floor(elapsed / 60);
        const min = elapsed % 60;
        const timp = ore > 0 ? `${ore}h ${min}min` : `${min} min`;
        return `🔴 **${r.nume}**
📍 ${r.locatie}${r.misiune ? `
🎯 ${r.misiune}` : ''}
⏱️ Pe teren de **${timp}**`;
      }).join('

')
    );
    embed.setFooter({ text: `${activi.length} reporter${activi.length > 1 ? 'i' : ''} activ${activi.length > 1 ? 'i' : ''} · Actualizat` });
  }

  try {
    if (terenMesajId) {
      const msg = await ch.messages.fetch(terenMesajId).catch(() => null);
      if (msg) { await msg.edit({ embeds: [embed] }); return; }
    }
    // Daca nu exista mesajul, creeaza unul nou
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

// ── SETUP CANALE ─────────────────────────────────────────
async function setupCanale(guild) {
  let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'REGORDER');
  if (!cat) { cat = await guild.channels.create({ name:'REGORDER', type:ChannelType.GuildCategory }); }

  const ensure = async (name, topic) => {
    let ch = guild.channels.cache.find(c => c.name === name);
    if (!ch) ch = await guild.channels.create({ name, type:ChannelType.GuildText, parent:cat.id, topic });
    return ch;
  };

  const a = await ensure('🚨・alerte',     'Alerte live din teren — /alert');
  const p = await ensure('📰・publicații', 'Articole și dosare publicate');
  const m = await ensure('🤖・comenzi',    'Comenzi bot — /misiuni /misiune /alert /top /sos');
  const g = await ensure('💬・general',    'Discuții generale echipă');

  const t = await ensure('📡・teren-live',  'Reporteri activi pe teren — /teren-on /teren-off');
  CH_ALERTE = a.id; CH_PUBLICATII = p.id; CH_MISIUNI = m.id; CH_GENERAL = g.id;
  CH_TEREN = t.id;

  // Categorie echipe
  let catE = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '🔴 ECHIPE ACTIVE');
  if (!catE) catE = await guild.channels.create({ name:'🔴 ECHIPE ACTIVE', type:ChannelType.GuildCategory });
  CAT_ECHIPE_ID = catE.id;

  console.log('✓ Canale gata');
}

// ── SETUP ROLURI ─────────────────────────────────────────
async function setupRoluri(guild) {
  const ROLURI = [
    { name:'👑 Fondator',             color:0xC0181A, hoist:true,  mentionable:true  },
    { name:'🎙️ Șef Redacție',         color:0xC0181A, hoist:true,  mentionable:true  },
    { name:'🔐 Admin',                color:0xff4444, hoist:true,  mentionable:true  },
    { name:'⚖️ Editor Șef',           color:0xfb923c, hoist:true,  mentionable:true  },
    { name:'📹 Reporter',             color:0xf59e0b, hoist:true,  mentionable:true  },
    { name:'✍️ Editor',               color:0xf59e0b, hoist:false, mentionable:true  },
    { name:'🔍 Investigator',         color:0x60a5fa, hoist:true,  mentionable:true  },
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
        await guild.roles.create({ name:r.name, color:r.color, hoist:r.hoist, mentionable:r.mentionable, reason:'REGORDER setup' });
        creat++;
        await new Promise(r => setTimeout(r, 350));
      } catch(e) { console.error('Rol eroare:', r.name, e.message); }
    }
  }
  console.log(`✓ Roluri: ${creat} create`);
}

// ── REGISTER COMMANDS ────────────────────────────────────
async function registerCommands(guild) {
  const cmds = [
    new SlashCommandBuilder().setName('alert').setDescription('Trimite alertă urgentă echipei')
      .addStringOption(o => o.setName('mesaj').setDescription('Mesajul').setRequired(true))
      .addStringOption(o => o.setName('locatie').setDescription('Locația').setRequired(false)),

    new SlashCommandBuilder().setName('misiuni').setDescription('Afișează roadmap-ul complet'),

    new SlashCommandBuilder().setName('misiune').setDescription('Detalii despre o misiune')
      .addStringOption(o => o.setName('nume').setDescription('Numele misiunii').setRequired(true)),

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

    new SlashCommandBuilder().setName('creaza-echipa').setDescription('Creează o echipă de investigație')
      .addStringOption(o => o.setName('nume').setDescription('Numele echipei').setRequired(true))
      .addStringOption(o => o.setName('misiune').setDescription('Misiunea / obiectivul').setRequired(true))
      .addStringOption(o => o.setName('locatie').setDescription('Locația investigației').setRequired(true))
      .addUserOption(o => o.setName('membru1').setDescription('Membru 1').setRequired(true))
      .addUserOption(o => o.setName('membru2').setDescription('Membru 2').setRequired(false))
      .addUserOption(o => o.setName('membru3').setDescription('Membru 3').setRequired(false))
      .addUserOption(o => o.setName('membru4').setDescription('Membru 4').setRequired(false)),
  ];

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

  // Raspuns comanda
  await interaction.reply({ embeds: [new EmbedBuilder()
    .setColor(GREEN)
    .setTitle(`✓ ECHIPA #${echipaId} CREATĂ`)
    .setDescription(`Canal: <#${canalEchipa.id}>\nForum probe: <#${forum.id}>\nMembri: ${[lider,...membri].map(m=>`<@${m.id}>`).join(' ')}`)
    .setFooter({ text: 'Forum se șterge automat dacă e gol în 48h' })
  ], ephemeral: true });
}

// ── INTERACTION HANDLER ──────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guild } = interaction;

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
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ Alertă trimisă!')], ephemeral:true });
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
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(RED).setDescription(`✗ Nicio misiune găsită pentru **"${query}"**`)], ephemeral:true });
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
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ Alertă vehicul trimisă!')], ephemeral:true });
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
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ Alertă persoană trimisă!')], ephemeral:true });
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
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription('✓ SOS trimis! Superiorii au fost alertați.')], ephemeral:true });
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
        .setDescription(`🟢 **${nume}** a intrat pe teren
📍 **${locatie}**${misiune ? `
🎯 ${misiune}` : ''}
⏰ ${new Date().toLocaleTimeString('ro-RO', {hour:'2-digit',minute:'2-digit'})}`)
        .setFooter({ text: 'REGORDER · Teren Live' })
        .setTimestamp()
      ]});
    }

    await updateTerenMesaj(guild);
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription(`✓ Ești acum **pe teren** la ${locatie}. Echipa a fost notificată.`)], ephemeral:true });
  }

  // /teren-off
  if (commandName === 'teren-off') {
    const raport  = interaction.options.getString('raport');
    const user    = interaction.user;
    const member  = await guild.members.fetch(user.id);
    const nume    = member.displayName || user.username;
    const info    = peTerenAcum[user.id];

    if (!info) {
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(RED).setDescription('✗ Nu ești înregistrat pe teren. Folosește `/teren-on` mai întâi.')], ephemeral:true });
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

    const ch = guild.channels.cache.get(CH_TEREN);
    if (ch) {
      await ch.send({ embeds: [new EmbedBuilder()
        .setColor(0x374151)
        .setDescription(`⬛ **${nume}** a revenit din teren
📍 **${info.locatie}** · ⏱️ **${timp}**${raport ? `
📋 *${raport}*` : ''}`)
        .setFooter({ text: 'REGORDER · Teren Live' })
        .setTimestamp()
      ]});
    }

    await updateTerenMesaj(guild);
    await interaction.reply({ embeds:[new EmbedBuilder().setColor(GREEN).setDescription(`✓ Misiune încheiată. Timp pe teren: **${timp}**`)], ephemeral:true });
  }

  // /teren-status
  if (commandName === 'teren-status') {
    const activi = Object.values(peTerenAcum);
    if (!activi.length) {
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(0x374151).setDescription('*Niciun reporter pe teren în acest moment.*')], ephemeral:true });
      return;
    }
    const embed = new EmbedBuilder().setColor(RED).setTitle('📡 TEREN STATUS')
      .setDescription(activi.map(r => {
        const elapsed = Math.floor((Date.now() - r.startTime) / 60000);
        const ore = Math.floor(elapsed / 60);
        const min = elapsed % 60;
        const timp = ore > 0 ? `${ore}h ${min}min` : `${min} min`;
        return `🔴 **${r.nume}** — 📍 ${r.locatie} · ⏱️ ${timp}${r.misiune ? `
　🎯 ${r.misiune}` : ''}`;
      }).join('

'))
      .setFooter({ text: `${activi.length} reporter${activi.length>1?'i':''} activ${activi.length>1?'i':''}` });
    await interaction.reply({ embeds:[embed] });
  }

  // /creaza-echipa
  if (commandName === 'creaza-echipa') {
    // Verifică grade
    const member = await guild.members.fetch(interaction.user.id);
    const areGrad = member.roles.cache.some(r => GRADE_SUPERIOARE.includes(r.name));
    if (!areGrad) {
      await interaction.reply({ embeds:[new EmbedBuilder().setColor(RED).setDescription('✗ Nu ai permisiunea să creezi echipe. Necesită grad de Reporter sau mai mare.')], ephemeral:true });
      return;
    }
    await interaction.deferReply({ ephemeral:true });
    await creeazaEchipa(interaction, guild);
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
let lastArticolId = null;
let lastDosarId   = null;

async function checkPublicatii(guild) {
  const ch = guild.channels.cache.get(CH_PUBLICATII);
  if (!ch) return;

  const { data: articole } = await sb.from('articole').select('*').eq('publicat',true).order('created_at',{ascending:false}).limit(1);
  if (articole?.length) {
    const art = articole[0];
    if (lastArticolId && art.id !== lastArticolId) {
      const embed = new EmbedBuilder().setColor(RED)
        .setTitle(`📰 ARTICOL NOU — ${art.titlu.toUpperCase()}`)
        .setDescription(art.rezumat || (art.continut||'').slice(0,200)+'...' || '—')
        .addFields(
          { name:'✍️ Reporter', value:art.reporter||'—', inline:true },
          { name:'📍 Locație', value:art.locatie||'—', inline:true },
          { name:'📌 Status', value:art.status||'—', inline:true },
        ).setFooter({ text:'REGORDER · Publicat pe site' }).setTimestamp(new Date(art.created_at));
      if (art.tags?.length) embed.addFields({ name:'🏷️ Taguri', value:art.tags.map(t=>`\`${t}\``).join(' ') });
      await ch.send({ embeds:[embed] });
      await checkRealizari(guild, art.reporter);
    }
    lastArticolId = art.id;
  }

  const { data: dosare } = await sb.from('dosare').select('*').order('created_at',{ascending:false}).limit(1);
  if (dosare?.length) {
    const dos = dosare[0];
    if (lastDosarId && dos.id !== lastDosarId) {
      await ch.send({ embeds:[new EmbedBuilder().setColor(YELLOW)
        .setTitle(`📂 DOSAR NOU — #${dos.numar} · ${dos.titlu.toUpperCase()}`)
        .addFields(
          { name:'📍 Locație', value:dos.locatie||'—', inline:true },
          { name:'👤 Reporter', value:dos.reporter_principal||'—', inline:true },
          { name:'📌 Status', value:dos.status||'—', inline:true },
        ).setFooter({ text:'REGORDER · Dosar deschis' }).setTimestamp(new Date(dos.created_at))
      ]});
    }
    lastDosarId = dos.id;
  }
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
  await registerCommands(guild);

  const { data:a } = await sb.from('articole').select('id').eq('publicat',true).order('created_at',{ascending:false}).limit(1);
  const { data:d } = await sb.from('dosare').select('id').order('created_at',{ascending:false}).limit(1);
  if (a?.length) lastArticolId = a[0].id;
  if (d?.length) lastDosarId   = d[0].id;

  startScheduler(guild);
  console.log('✓ REGORDER Bot complet și gata!');
});

client.login(TOKEN);
