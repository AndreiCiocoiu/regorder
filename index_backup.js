const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// ── CONFIG ──────────────────────────────────────────────
const TOKEN      = process.env.DISCORD_TOKEN;
const GUILD_ID   = process.env.GUILD_ID || '1509279596074373271';
const SUPA_URL   = process.env.SUPABASE_URL || 'https://wrjvymujwjsjytigzdua.supabase.co';
const SUPA_KEY   = process.env.SUPABASE_KEY;

// ID-uri canale — se setează automat la primul start
let CH_ALERTE      = process.env.CH_ALERTE || null;
let CH_PUBLICATII  = process.env.CH_PUBLICATII || null;
let CH_MISIUNI     = process.env.CH_MISIUNI || null;

// ── CLIENTS ─────────────────────────────────────────────
const sb = createClient(SUPA_URL, SUPA_KEY);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ── CULORI EMBED ────────────────────────────────────────
const RED    = 0xC0181A;
const GREEN  = 0x4ade80;
const YELLOW = 0xf59e0b;
const PURPLE = 0xa78bfa;
const BLUE   = 0x60a5fa;

// ── SETUP CANALE LA PRIMUL START ────────────────────────
async function setupCanale(guild) {
  // Cauta categoria REGORDER sau creeaza una
  let categorie = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'REGORDER');
  if (!categorie) {
    categorie = await guild.channels.create({
      name: 'REGORDER',
      type: ChannelType.GuildCategory
    });
    console.log('✓ Categorie REGORDER creată');
  }

  // Canal ALERTE
  let chAlerte = guild.channels.cache.find(c => c.name === '🚨・alerte');
  if (!chAlerte) {
    chAlerte = await guild.channels.create({
      name: '🚨・alerte',
      type: ChannelType.GuildText,
      parent: categorie.id,
      topic: 'Alerte live din teren — folosește /alert pentru a trimite o alertă'
    });
    console.log('✓ Canal alerte creat');
  }
  CH_ALERTE = chAlerte.id;

  // Canal PUBLICATII
  let chPublicatii = guild.channels.cache.find(c => c.name === '📰・publicații');
  if (!chPublicatii) {
    chPublicatii = await guild.channels.create({
      name: '📰・publicații',
      type: ChannelType.GuildText,
      parent: categorie.id,
      topic: 'Articole și dosare publicate pe regorder.ro'
    });
    console.log('✓ Canal publicații creat');
  }
  CH_PUBLICATII = chPublicatii.id;

  // Canal MISIUNI
  let chMisiuni = guild.channels.cache.find(c => c.name === '🗺️・misiuni');
  if (!chMisiuni) {
    chMisiuni = await guild.channels.create({
      name: '🗺️・misiuni',
      type: ChannelType.GuildText,
      parent: categorie.id,
      topic: 'Roadmap investigativ — folosește /misiuni sau /misiune [nume]'
    });
    console.log('✓ Canal misiuni creat');
  }
  CH_MISIUNI = chMisiuni.id;

  console.log('✓ Toate canalele sunt gata');
  return { chAlerte, chPublicatii, chMisiuni };
}

// ── REGISTER SLASH COMMANDS ─────────────────────────────
// ── SETUP ROLURI LA PRIMUL START ────────────────────────
async function setupRoluri(guild) {
  const ROLURI = [
    // ── CONDUCERE ──
    { name: '👑 Fondator',             color: 0xC0181A, hoist: true,  mentionable: true  },
    { name: '🎙️ Șef Redacție',         color: 0xC0181A, hoist: true,  mentionable: true  },
    { name: '🔐 Admin',                color: 0xff4444, hoist: true,  mentionable: true  },
    { name: '⚖️ Editor Șef',           color: 0xfb923c, hoist: true,  mentionable: true  },
    // ── ECHIPA ACTIVA ──
    { name: '📹 Reporter',             color: 0xf59e0b, hoist: true,  mentionable: true  },
    { name: '✍️ Editor',               color: 0xf59e0b, hoist: false, mentionable: true  },
    { name: '🔍 Investigator',         color: 0x60a5fa, hoist: true,  mentionable: true  },
    { name: '📸 Fotograf',             color: 0x60a5fa, hoist: false, mentionable: true  },
    { name: '🎬 Cameraman',            color: 0x60a5fa, hoist: false, mentionable: true  },
    { name: '🎙️ Narator',              color: 0xa78bfa, hoist: false, mentionable: true  },
    { name: '🖊️ Scenarist',            color: 0xa78bfa, hoist: false, mentionable: true  },
    { name: '📡 Operator Drone',       color: 0x38bdf8, hoist: false, mentionable: true  },
    // ── SPECIALIZARI ──
    { name: '🚗 Urmărire',             color: 0xfbbf24, hoist: false, mentionable: true  },
    { name: '💼 Financiar',            color: 0xfbbf24, hoist: false, mentionable: true  },
    { name: '👮 Investigator Poliție', color: 0x3b82f6, hoist: false, mentionable: true  },
    { name: '🔴 Investigator Mafie',   color: 0xC0181A, hoist: false, mentionable: true  },
    { name: '🌿 Mediu & Resurse',      color: 0x4ade80, hoist: false, mentionable: true  },
    { name: '🕵️ Infiltrat',            color: 0x8b5cf6, hoist: false, mentionable: true  },
    { name: '📡 Analist Intel',        color: 0x06b6d4, hoist: false, mentionable: true  },
    { name: '⚖️ Juridic',              color: 0xe2e8f0, hoist: false, mentionable: true  },
    { name: '💻 Tehnic',               color: 0x10b981, hoist: false, mentionable: true  },
    { name: '🗺️ Cartograf',            color: 0x84cc16, hoist: false, mentionable: true  },
    { name: '🔊 PR & Comunicare',      color: 0xf472b6, hoist: false, mentionable: true  },
    { name: '🧠 Strateg',              color: 0xc084fc, hoist: false, mentionable: true  },
    { name: '🚁 Teren Periculos',      color: 0xef4444, hoist: false, mentionable: true  },
    // ── STATUT MISIUNE ──
    { name: '🟢 Activ',                color: 0x4ade80, hoist: false, mentionable: false },
    { name: '🔴 Acoperire',            color: 0xC0181A, hoist: false, mentionable: false },
    { name: '🟡 Standby',              color: 0xf59e0b, hoist: false, mentionable: false },
    { name: '⬛ Inactiv',              color: 0x374151, hoist: false, mentionable: false },
    { name: '🏥 Recuperare',           color: 0x6b7280, hoist: false, mentionable: false },
    { name: '🚫 Compromis',            color: 0x991b1b, hoist: false, mentionable: false },
    // ── ACCES ──
    { name: '👁️ Observator',           color: 0x4b5563, hoist: false, mentionable: false },
    { name: '🆕 Nou Recrut',           color: 0x6b7280, hoist: false, mentionable: false },
    { name: '🤝 Colaborator',          color: 0x9ca3af, hoist: false, mentionable: false },
    { name: '📰 Sursă',                color: 0x78716c, hoist: false, mentionable: false },
    { name: '🔇 Suspendat',            color: 0x1f2937, hoist: false, mentionable: false },
    // ── REALIZARI ──
    { name: '🏆 Documentar Finalizat', color: 0xffd700, hoist: false, mentionable: false },
    { name: '⭐ Investigator Elit',    color: 0xffd700, hoist: false, mentionable: false },
    { name: '🎖️ Veteran',              color: 0xcd7f32, hoist: false, mentionable: false },
    { name: '💥 Prima Misiune',        color: 0x84cc16, hoist: false, mentionable: false },
    { name: '🔥 10 Probe Colectate',   color: 0xf97316, hoist: false, mentionable: false },
    { name: '💎 Dosar Închis',         color: 0x67e8f9, hoist: false, mentionable: false },
  ];

  let creat = 0;
  let sarit = 0;

  for (const rol of ROLURI) {
    const exists = guild.roles.cache.find(r => r.name === rol.name);
    if (!exists) {
      try {
        await guild.roles.create({
          name: rol.name,
          color: rol.color,
          hoist: rol.hoist,
          mentionable: rol.mentionable,
          reason: 'REGORDER Bot — setup automat roluri'
        });
        creat++;
        await new Promise(r => setTimeout(r, 350));
      } catch (e) {
        console.error(`✗ Eroare la rolul ${rol.name}:`, e.message);
      }
    } else {
      sarit++;
    }
  }
  console.log(`✓ Roluri: ${creat} create, ${sarit} existente`);
}


async function registerCommands(guild) {
  const commands = [
    new SlashCommandBuilder()
      .setName('alert')
      .setDescription('Trimite o alertă urgentă echipei')
      .addStringOption(opt =>
        opt.setName('mesaj').setDescription('Mesajul de alertă').setRequired(true))
      .addStringOption(opt =>
        opt.setName('locatie').setDescription('Locația (opțional)').setRequired(false)),

    new SlashCommandBuilder()
      .setName('misiuni')
      .setDescription('Afișează toate misiunile din roadmap'),

    new SlashCommandBuilder()
      .setName('misiune')
      .setDescription('Afișează detalii despre o misiune')
      .addStringOption(opt =>
        opt.setName('nume').setDescription('Numele misiunii (sau parte din el)').setRequired(true)),

    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('Statistici Regorder — dosare, probe, articole'),
  ];

  await guild.commands.set(commands);
  console.log('✓ Comenzi slash înregistrate');
}

// ── MISIUNI HARDCODATE ───────────────────────────────────
const MISIUNI = [
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Tăierea ilegală de lemne', tags:['Braconaj','Teren'], status:'Planificat',
    pasi:['Cercetare prealabilă — fără a ieși pe teren','Prima ieșire pe teren — observație','Colectarea probelor video/foto','Interviuri — surse și martori'] },
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Transportul (Tiristul)', tags:['Transport','Corupție'], status:'Planificat',
    pasi:['Identificarea vehiculelor și rutelor','Angajare sub acoperire ca șofer','Probe: marfă și documente'] },
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Braconajul & vânătoarea ilegală', tags:['Ilegal','Teren'], status:'Planificat',
    pasi:['Maparea zonelor de braconaj','Documentare activitate ilegală','Piața neagră și lanțul de vânzare'] },
  { cat:1, catLabel:'Joburi ilegale & resurse naturale', titlu:'Industria petrolieră — nereguli', tags:['Mediu','Corupție'], status:'Planificat',
    pasi:['Cercetarea industriei','Angajare și observație internă','Conexiuni politice și protecție'] },
  { cat:2, catLabel:'Evaziune fiscală & afaceri legale', titlu:'Bonuri false la afaceri legale', tags:['Evaziune','Financiar'], status:'Planificat',
    pasi:['Identificarea afacerilor suspecte','Angajare sub acoperire','Probe documentare'] },
  { cat:2, catLabel:'Evaziune fiscală & afaceri legale', titlu:'Bani nestampilați în cluburi de noapte', tags:['Spălare','Noapte'], status:'Planificat',
    pasi:['Cercetarea cluburilor active','Infiltrare ca angajat / client','Probe financiare'] },
  { cat:2, catLabel:'Evaziune fiscală & afaceri legale', titlu:'Infiltrare în mafie (SOA / CAYO)', tags:['Mafie','Pericol','Risc Înalt'], status:'Planificat',
    pasi:['Construirea identității de acoperire','Apropierea treptată','Colectarea probelor structurale','Ieșirea în siguranță'] },
  { cat:3, catLabel:'Corupția poliției', titlu:'Corupția polițiștilor', tags:['Corupție','Poliție'], status:'Planificat',
    pasi:['Identificarea tiparelor de corupție','Teste de integritate','Probe și martori'] },
  { cat:3, catLabel:'Corupția poliției', titlu:'Incompetența în forțele de ordine', tags:['Incompetență','Sistem'], status:'Planificat',
    pasi:['Colectarea cazurilor documentate','Testarea sistemului','Documentarul incompetenței'] },
  { cat:3, catLabel:'Corupția poliției', titlu:'Legătura poliție — mafie', tags:['Pericol','Corupție'], status:'Planificat',
    pasi:['Maparea relațiilor suspecte','Probe de colaborare directă'] },
  { cat:4, catLabel:'Mafii & crimă organizată', titlu:'Zone rău famate controlate', tags:['Teren','Risc'], status:'Planificat',
    pasi:['Cercetare și identificare zone','Documentare pe teren','Harta criminală a orașului'] },
  { cat:4, catLabel:'Mafii & crimă organizată', titlu:'Semnificația culorilor', tags:['Gang','Cercetare'], status:'Planificat',
    pasi:['Observație vizuală și cercetare','Interviuri și confirmare','Ghidul vizual pentru documentar'] },
  { cat:4, catLabel:'Mafii & crimă organizată', titlu:'Distribuția drogurilor în oraș', tags:['Droguri','Pericol'], status:'Planificat',
    pasi:['Maparea rețelei de distribuție','Documentare puncte de deal','Lanțul de aprovizionare'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Cine conduce orașul?', tags:['Putere','Cercetare'], status:'Planificat',
    pasi:['Identificarea liderilor vizibili','Investigarea conducerii din umbră','Probe și testimoniale'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Scopul Sindicatului în oraș', tags:['Strategie','Analiză'], status:'Planificat',
    pasi:['Analiza domeniilor de control','Strategia pe termen lung','Impactul asupra cetățenilor'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Conexiuni între Sindicat și celelalte grupări', tags:['Rețea','Complex'], status:'Planificat',
    pasi:['Maparea relațiilor cunoscute','Investigarea relațiilor ascunse','Graful puterii — sinteza finală'] },
  { cat:5, catLabel:'Sindicatul — puterea din umbră', titlu:'Documentarul final — sinteza', tags:['Producție','Final'], status:'Planificat',
    pasi:['Compilarea tuturor probelor','Scrierea narațiunii','Montaj și prezentare'] },
];

const CAT_COLORS = { 1: YELLOW, 2: YELLOW, 3: RED, 4: RED, 5: PURPLE };
const CAT_EMOJI  = { 1: '🪚', 2: '💼', 3: '👮', 4: '🔴', 5: '👁️' };

// ── HANDLER INTERACTII ───────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ── /alert ──────────────────────────────────────────
  if (commandName === 'alert') {
    const mesaj   = interaction.options.getString('mesaj');
    const locatie = interaction.options.getString('locatie');
    const user    = interaction.user;

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle('🚨 ALERTĂ REGORDER')
      .setDescription(`**${mesaj}**`)
      .addFields(
        { name: '👤 Reporter', value: user.displayName || user.username, inline: true },
        { name: '📍 Locație', value: locatie || '—', inline: true },
        { name: '⏰ Ora', value: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }), inline: true }
      )
      .setFooter({ text: 'REGORDER · INVESTIGAȚIE ACTIVĂ' })
      .setTimestamp();

    // Posteaza in canalul de alerte
    const chAlerte = interaction.guild.channels.cache.get(CH_ALERTE);
    if (chAlerte) {
      await chAlerte.send({
        content: '@everyone',
        embeds: [embed]
      });
    }

    // Raspuns la comanda
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(GREEN)
          .setDescription('✓ **Alertă trimisă în #🚨・alerte**')
      ],
      ephemeral: true
    });
  }

  // ── /misiuni ─────────────────────────────────────────
  if (commandName === 'misiuni') {
    const cats = [...new Set(MISIUNI.map(m => m.cat))].sort();

    const embeds = cats.map(cat => {
      const items = MISIUNI.filter(m => m.cat === cat);
      const label = items[0].catLabel;
      const color = CAT_COLORS[cat] || RED;
      const emoji = CAT_EMOJI[cat] || '•';

      return new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji}  CAT. ${cat} — ${label.toUpperCase()}`)
        .setDescription(
          items.map((m, i) =>
            `\`${String(i+1).padStart(2,'0')}\` **${m.titlu}**\n` +
            `　　${m.tags.map(t => `\`${t}\``).join(' ')} · ${m.status}`
          ).join('\n\n')
        )
        .setFooter({ text: `${items.length} misiuni în această categorie` });
    });

    // Discord permite max 10 embeds per mesaj
    await interaction.reply({ embeds: embeds.slice(0, 10) });

    // Posteaza si in canalul de misiuni
    const chMisiuni = interaction.guild.channels.cache.get(CH_MISIUNI);
    if (chMisiuni && chMisiuni.id !== interaction.channelId) {
      await chMisiuni.send({ embeds: embeds.slice(0, 10) });
    }
  }

  // ── /misiune [nume] ──────────────────────────────────
  if (commandName === 'misiune') {
    const query = interaction.options.getString('nume').toLowerCase();
    const found = MISIUNI.find(m => m.titlu.toLowerCase().includes(query));

    if (!found) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(RED)
            .setDescription(`✗ Nicio misiune găsită pentru **"${query}"**\nFolosește \`/misiuni\` pentru lista completă.`)
        ],
        ephemeral: true
      });
      return;
    }

    const color = CAT_COLORS[found.cat] || RED;
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${CAT_EMOJI[found.cat]}  ${found.titlu.toUpperCase()}`)
      .setDescription(`*Categoria ${found.cat} — ${found.catLabel}*`)
      .addFields(
        { name: '📌 Status', value: found.status, inline: true },
        { name: '🏷️ Taguri', value: found.tags.map(t => `\`${t}\``).join(' '), inline: true },
        { name: '📋 Pași investigativi', value: found.pasi.map((p, i) => `\`${String(i+1).padStart(2,'0')}\` ${p}`).join('\n') }
      )
      .setFooter({ text: 'REGORDER · ROADMAP INVESTIGATIV' });

    await interaction.reply({ embeds: [embed] });
  }

  // ── /stats ───────────────────────────────────────────
  if (commandName === 'stats') {
    await interaction.deferReply();

    const [r1, r2, r3, r4] = await Promise.all([
      sb.from('dosare').select('id', { count: 'exact' }),
      sb.from('dosare').select('id', { count: 'exact' }).eq('status', 'activ'),
      sb.from('probe').select('id', { count: 'exact' }),
      sb.from('articole').select('id', { count: 'exact' }).eq('publicat', true),
    ]);

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setTitle('📊 STATISTICI REGORDER')
      .addFields(
        { name: '📂 Dosare totale', value: String(r1.count || 0), inline: true },
        { name: '🔴 Dosare active', value: String(r2.count || 0), inline: true },
        { name: '🔍 Probe colectate', value: String(r3.count || 0), inline: true },
        { name: '📰 Articole publicate', value: String(r4.count || 0), inline: true },
        { name: '🗺️ Misiuni roadmap', value: String(MISIUNI.length), inline: true },
        { name: '👥 Echipă', value: '—', inline: true },
      )
      .setFooter({ text: 'REGORDER · Date live din Supabase' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
});

// ── POLLING PUBLICATII (checks every 60s) ────────────────
let lastArticolId  = null;
let lastDosarId    = null;

async function checkPublicatii(guild) {
  const chPublicatii = guild.channels.cache.get(CH_PUBLICATII);
  if (!chPublicatii) return;

  // Verifica articole noi
  const { data: articole } = await sb.from('articole')
    .select('*')
    .eq('publicat', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (articole?.length) {
    const art = articole[0];
    if (lastArticolId && art.id !== lastArticolId) {
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle(`📰 ARTICOL NOU — ${art.titlu.toUpperCase()}`)
        .setDescription(art.rezumat || art.continut?.slice(0, 200) + '...' || '—')
        .addFields(
          { name: '✍️ Reporter', value: art.reporter || '—', inline: true },
          { name: '📍 Locație', value: art.locatie || '—', inline: true },
          { name: '📌 Status', value: art.status || '—', inline: true }
        )
        .setFooter({ text: 'REGORDER · Publicat pe site' })
        .setTimestamp(new Date(art.created_at));

      if (art.tags?.length) {
        embed.addFields({ name: '🏷️ Taguri', value: art.tags.map(t => `\`${t}\``).join(' '), inline: false });
      }

      await chPublicatii.send({ embeds: [embed] });
    }
    lastArticolId = art.id;
  }

  // Verifica dosare noi
  const { data: dosare } = await sb.from('dosare')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (dosare?.length) {
    const dos = dosare[0];
    if (lastDosarId && dos.id !== lastDosarId) {
      const embed = new EmbedBuilder()
        .setColor(YELLOW)
        .setTitle(`📂 DOSAR NOU — #${dos.numar} · ${dos.titlu.toUpperCase()}`)
        .addFields(
          { name: '📍 Locație', value: dos.locatie || '—', inline: true },
          { name: '👤 Reporter', value: dos.reporter_principal || '—', inline: true },
          { name: '📌 Status', value: dos.status || '—', inline: true }
        )
        .setFooter({ text: 'REGORDER · Dosar deschis' })
        .setTimestamp(new Date(dos.created_at));

      await chPublicatii.send({ embeds: [embed] });
    }
    lastDosarId = dos.id;
  }
}

// ── BOT READY ────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✓ Bot pornit ca ${client.user.tag}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error('✗ Server negăsit! Verifică GUILD_ID.');
    return;
  }

  await setupCanale(guild);
  await setupRoluri(guild);
  await registerCommands(guild);

  // Initializeaza lastId-urile
  const { data: a } = await sb.from('articole').select('id').eq('publicat', true).order('created_at', { ascending: false }).limit(1);
  const { data: d } = await sb.from('dosare').select('id').order('created_at', { ascending: false }).limit(1);
  if (a?.length) lastArticolId = a[0].id;
  if (d?.length) lastDosarId = d[0].id;

  console.log('✓ Polling publicații pornit (interval: 60s)');
  setInterval(() => checkPublicatii(guild), 60_000);

  console.log('✓ REGORDER Bot este gata!');
});

client.login(TOKEN);
