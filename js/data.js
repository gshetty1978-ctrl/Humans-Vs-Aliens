window.HVA = window.HVA || {};
window.HVA.asset = p => (window.HVA_ASSETS && window.HVA_ASSETS[p]) || p;
(function (H) {
  H.HUMANS = [
    { id: 'ryan', name: 'ROOKIE RYAN', icon: '🧑‍🚀', role: 'Basic Soldier', cost: 50, hp: 100, dmg: 15, cd: 1.5, range: 4, rangeLabel: 'Medium', ability: 'Cheap, reliable frontline fire.', desc: 'An ordinary soldier with extraordinary courage.', price: 0, proj: 'blue', scale: 2 },
    { id: 'lucy', name: 'LASER LUCY', icon: '🔫', role: 'Ranged Attacker', cost: 100, hp: 80, dmg: 30, cd: 1.2, range: 7, rangeLabel: 'Long', ability: 'Fast, bright laser bolts.', desc: 'She never misses twice.', price: 0, proj: 'laser', scale: 2 },
    { id: 'tom', name: 'TITAN TOM', icon: '🛡️', role: 'Tank', cost: 150, hp: 350, dmg: 20, cd: 2.0, range: 1.3, rangeLabel: 'Short', ability: 'Huge HP. Shield flashes when hit.', desc: 'Big armor. Bigger attitude.', price: 250, proj: 'melee', scale: 1.7 },
    { id: 'maya', name: 'MEDIC MAYA', icon: '❤️', role: 'Healer / Support', cost: 125, hp: 100, dmg: 5, cd: 2.0, range: 4, rangeLabel: 'Medium', ability: 'Heals nearby humans for 25 HP every 4s.', desc: 'Keeping the team alive, one pulse at a time.', price: 350, proj: 'pulse', scale: 2 },
    { id: 'sam', name: 'SNIPER SAM', icon: '🎯', role: 'Long-range Damage', cost: 175, hp: 90, dmg: 100, cd: 3.0, range: 12, rangeLabel: 'Very Long', ability: '25% chance of a double-damage critical.', desc: 'One shot. One alien less.', price: 500, proj: 'sniper', scale: 2 },
    { id: 'eli', name: 'ENGINEER ELI', icon: '🤖', role: 'Engineer / Support', cost: 200, hp: 150, dmg: 15, cd: 1.5, range: 4, rangeLabel: 'Medium', ability: 'Builds a drone (75 HP, 10 dmg, fast fire) every 12s.', desc: 'If it can be built, Eli can weaponize it.', price: 650, proj: 'blue', scale: 2 },
    { id: 'priya', name: 'PLASMA PRIYA', icon: '🟣', role: 'Area Damage', cost: 250, hp: 130, dmg: 60, cd: 2.0, range: 7, rangeLabel: 'Long', ability: 'Plasma orbs explode, hitting nearby aliens.', desc: 'Why shoot one alien when you can hit five?', price: 800, proj: 'plasma', scale: 2 },
    { id: 'max', name: 'COMMANDER MAX', icon: '👑', role: 'Ultimate Defender', cost: 400, hp: 500, dmg: 120, cd: 2.0, range: 9, rangeLabel: 'Long', ability: 'Ultimate missile hits every alien in the lane (20s cooldown).', desc: 'The last line of defense.', price: 1200, proj: 'missile', scale: 2 },
    { id: 'chronos', name: 'CHRONOS', icon: '🔰', role: 'Heavy-Armored Support', cost: 300, hp: 450, dmg: 25, cd: 2.2, range: 1.3, rangeLabel: 'Short', ability: 'Periodically shields itself and nearby humans, reducing damage taken.', desc: 'A wall of purple steel and borrowed time.', price: 1500, proj: 'melee', scale: 1.7 }
  ];

  H.REACTOR = { id: 'reactor', price: 0, name: 'NUCLEAR REACTOR', icon: '☢️', role: 'Energy Generator', cost: 75, hp: 120, dmg: 0, cd: 1, range: 0, rangeLabel: 'None', ability: 'Drops a 25 ⚡ energy cell every 9s.', desc: 'Definitely safe. Probably.' };
  H.REACTOR.tip = '⚡ +25 / 9s';
  H.FIREWALL = { id: 'firewall', price: 150, name: 'FIREWALL', icon: '🔥', role: 'Code Wall', cost: 75, hp: 700, dmg: 0, cd: 1, range: 0, rangeLabel: 'None', ability: 'A wall of burning code. Blocks aliens and scorches anything that hits it.', desc: 'Access denied.', tip: '🔥 burns attackers' };
  H.DYNAMITE = { id: 'dynamite', price: 250, name: 'DYNAMITE', icon: '🧨', role: 'Instant Blast', cost: 125, hp: 60, dmg: 0, cd: 1, range: 0, rangeLabel: 'None', ability: 'Explodes 1.5s after placing: 350 damage to every alien in a 3x3 area.', desc: 'Light the fuse and run.', tip: '💥 350 area dmg' };
  H.ITEMS = [H.REACTOR, H.FIREWALL, H.DYNAMITE];
  H.ITEM_KEYS = { reactor: 'R', firewall: 'F', dynamite: 'D' };
  H.isItem = id => H.ITEMS.some(i => i.id === id);
  H.defOf = id => H.HUMANS.find(h => h.id === id) || H.ITEMS.find(i => i.id === id);
  H.ownedItems = () => H.ITEMS.filter(i => i.id === 'reactor' || H.Save.data.unlocked.includes(i.id)).map(i => i.id);

  H.ALIENS = {
    slime: { id: 'slime', name: 'SLIME SCOUT', hp: 80, speed: 0.7, dmg: 10, size: 1, ability: 'Small and fast.' },
    grunt: { id: 'grunt', name: 'GRUNT ALIEN', hp: 150, speed: 0.5, dmg: 20, size: 1.1, ability: 'Standard invader.' },
    brute: { id: 'brute', name: 'BRUTE ALIEN', hp: 400, armor: 4, speed: 0.3, dmg: 40, size: 1.5, ability: 'Slow, huge and heavy-hitting.' },
    zapper: { id: 'zapper', name: 'ZAPPER ALIEN', hp: 180, speed: 0.5, dmg: 30, size: 1.1, ability: 'Zaps disable a human for 4s.' },
    jet: { id: 'jet', name: 'JET ALIEN', hp: 120, speed: 1.0, dmg: 15, size: 1, ability: 'Flies over the first human it meets.' },
    shield: { id: 'shield', name: 'SHIELDMASTER', bossAb: ['quake'], hp: 300, armor: 3, shield: 250, speed: 0.3, dmg: 30, size: 1.4, ability: 'Shield must break before HP takes damage.' },
    commander: { id: 'commander', name: 'ALIEN COMMANDER', hp: 800, armor: 6, bossAb: ['summon'], minions: ['grunt', 'trooper'], speed: 0.28, dmg: 60, size: 1.6, ability: 'Boosts nearby aliens (+damage, +speed).' },
    prime: { id: 'prime', name: 'COMMANDER PRIME', bossAb: ['summon', 'quake'], minions: ['grunt', 'zapper', 'jet'], hp: 1500, armor: 8, speed: 0.28, dmg: 80, size: 1.8, ability: 'A stronger Commander. Boosts allies.' },
    trooper: { id: 'trooper', name: 'IRON TROOPER', hp: 200, armor: 6, speed: 0.5, dmg: 25, size: 1.1, ability: 'Steel plating (armor 6): weak shots barely scratch it.' },
    spiker: { id: 'spiker', name: 'SPIKE CRAB', hp: 220, armor: 10, speed: 0.42, dmg: 25, size: 1.3, ability: 'Heavy shell (armor 10). Only big hits get through.' },
    spitter: { id: 'spitter', name: 'ACID SPITTER', hp: 130, armor: 0, speed: 0.45, dmg: 18, size: 1, ranged: true, ability: 'Spits acid from 3 tiles away, hitting the first human in its lane.' },
    bomber: { id: 'bomber', name: 'BLAST BUG', hp: 90, armor: 0, speed: 0.85, dmg: 70, size: 0.9, ability: 'Explodes on contact, hurting every human nearby.' },
    medic: { id: 'medic', name: 'SPORE HEALER', hp: 160, armor: 0, speed: 0.35, dmg: 10, size: 1.1, ability: 'Heals nearby aliens for 25 HP every 3s. Kill it first!' },
    juggernaut: { id: 'juggernaut', name: 'JUGGERNAUT', hp: 700, armor: 14, speed: 0.25, dmg: 60, size: 1.7, ability: 'Walking fortress (armor 14). Bring Sam, Priya or Max.' },
    scorpion: { id: 'scorpion', name: 'SAND SCORPION', hp: 160, armor: 3, speed: 0.55, dmg: 20, size: 1.3, poison: { dps: 6, dur: 4 }, ability: 'Poison sting: 6 damage per second for 4s on top of the hit.' },
    burrower: { id: 'burrower', name: 'SAND BURROWER', hp: 140, armor: 0, speed: 0.6, dmg: 25, size: 1, burrow: true, ability: 'Digs under your first defender (untargetable) and pops up behind it.' },
    cactus: { id: 'cactus', name: 'CACTUS BRUTE', hp: 420, armor: 5, speed: 0.3, dmg: 40, size: 1.5, thorns: 6, ability: 'Thorny hide: melee attackers like Titan Tom take 6 damage per hit.' },
    hopper: { id: 'hopper', name: 'MOON HOPPER', hp: 120, armor: 0, speed: 0.28, dmg: 20, size: 0.95, hop: true, ability: 'Low gravity leaps: crosses the field in big jumps.' },
    astronaut: { id: 'astronaut', name: 'ALIEN ASTRONAUT', hp: 220, armor: 4, speed: 0.4, dmg: 25, size: 1.1, deathBlast: { dmg: 60 }, ability: 'Oxygen tank explodes when it dies, hurting nearby humans.' },
    shade: { id: 'shade', name: 'LUNAR SHADE', hp: 150, armor: 0, speed: 0.55, dmg: 30, size: 1, cloak: { every: 6, dur: 2.5 }, ability: 'Cloaks in the dark: humans cannot target it while it is invisible.' },
    golem: { id: 'golem', name: 'CRYSTAL GOLEM', hp: 380, armor: 12, speed: 0.3, dmg: 45, size: 1.5, shatter: 2, ability: 'Crystal armor (12). Shatters into 2 fast shards when destroyed.' },
    shard: { id: 'shard', name: 'CRYSTAL SHARD', hp: 70, armor: 0, speed: 0.75, dmg: 12, size: 0.7, ability: 'Sharp little fragment of a shattered Golem.' },
    brood: { id: 'brood', name: 'BROOD MOTHER', hp: 300, armor: 2, speed: 0.28, dmg: 25, size: 1.35, brood: { every: 7, type: 'larva' }, ability: 'Lays a fast larva every 7s (up to 3 alive). Kill her first!' },
    larva: { id: 'larva', name: 'BROOD LARVA', hp: 50, armor: 0, speed: 0.85, dmg: 8, size: 0.6, ability: 'Tiny, fast, and endless if the Mother lives.' },
    mindsquid: { id: 'mindsquid', name: 'MIND SQUID', hp: 170, armor: 0, speed: 0.4, dmg: 15, size: 1.1, psy: { every: 6, dur: 3, range: 5 }, ability: 'Psychic blast from 5 tiles away stuns the nearest human for 3s.' },
    frostling: { id: 'frostling', name: 'FROSTLING', hp: 140, armor: 0, speed: 0.55, dmg: 20, size: 1, freeze: 1.8, burst: ['#9fe8ff', '#e8fbff', '#5ab8e8'], ability: 'Icy touch freezes a human solid for 1.8s on every hit.' },
    icebat: { id: 'icebat', name: 'ICE BAT', hp: 110, armor: 0, speed: 0.95, dmg: 15, size: 1, fly: true, burst: ['#b8e8ff', '#ffffff', '#6a8ad0'], ability: 'Glides over the first human it meets.' },
    snowmage: { id: 'snowmage', name: 'BLIZZARD MAGE', hp: 190, armor: 0, speed: 0.38, dmg: 15, size: 1.1, psy: { every: 7, dur: 2.5, range: 4.5, label: 'BLIZZARD!' }, burst: ['#e8fbff', '#7ab8ff', '#a08af5'], ability: 'Summons a blizzard from 4 tiles away that freezes the nearest human.' },
    yeti: { id: 'yeti', name: 'YETI BRUTE', hp: 520, armor: 6, speed: 0.3, dmg: 50, size: 1.6, freeze: 1.2, burst: ['#f0f6ff', '#b8c8e8', '#6a8ad0'], ability: 'Huge and armored (6). Its punches briefly freeze humans.' },
    frosttitan: { id: 'frosttitan', name: 'FROST TITAN', hp: 900, armor: 10, speed: 0.25, dmg: 90, size: 2.1, freeze: 2, boss: true, bossAb: ['freeze', 'summon', 'quake'], minions: ['frostling', 'icebat', 'frostling'], burst: ['#9fe8ff', '#ffffff', '#3a6ad0'], ability: 'BOSS. Flash-freezes whole lanes, calls frost minions, slams the ground.' },
    emberhound: { id: 'emberhound', name: 'EMBER HOUND', hp: 100, armor: 0, speed: 0.95, dmg: 25, size: 1, burst: ['#ff8a2a', '#ffe14a', '#c23a1a'], ability: 'Blazing fast lava runner.' },
    magmaling: { id: 'magmaling', name: 'MAGMALING', hp: 200, armor: 2, speed: 0.4, dmg: 25, size: 1.1, deathBlast: { dmg: 55 }, burst: ['#ff5a1a', '#ffb02a', '#3a2020'], ability: 'Bursts into molten fire when it dies, scorching nearby humans.' },
    lavaslug: { id: 'lavaslug', name: 'LAVA SLUG', hp: 240, armor: 0, speed: 0.3, dmg: 20, size: 1.2, poison: { dps: 9, dur: 3, label: 'BURNING' }, burst: ['#ff7a1a', '#ffe14a', '#8a2a1a'], ability: 'Molten slime sets humans on fire: 9 damage per second for 3s.' },
    obsidian: { id: 'obsidian', name: 'OBSIDIAN KNIGHT', hp: 450, armor: 16, speed: 0.28, dmg: 55, size: 1.6, burst: ['#2a2a3a', '#ff5a1a', '#6a6a8a'], ability: 'Volcanic glass armor (16). Bring Sam, Priya or Max.' },
    magmawyrm: { id: 'magmawyrm', name: 'MAGMA WYRM', hp: 1200, armor: 8, speed: 0.25, dmg: 100, size: 2.2, poison: { dps: 12, dur: 3, label: 'BURNING' }, boss: true, bossAb: ['quake', 'summon', 'quake'], minions: ['emberhound', 'magmaling', 'emberhound'], burst: ['#ff5a1a', '#ffe14a', '#3a1a1a'], ability: 'BOSS. Erupting quakes hurt whole lanes and it spews fire hounds.' },
    piranha: { id: 'piranha', name: 'PIRANHA SWARMER', hp: 70, armor: 0, speed: 1.05, dmg: 14, size: 0.8, burst: ['#3ac2a0', '#ff5a5a', '#e8fff0'], ability: 'Tiny, very fast and hungry.' },
    jelly: { id: 'jelly', name: 'SHOCK JELLY', hp: 150, armor: 0, speed: 0.4, dmg: 20, size: 1.1, psy: { every: 5, dur: 2, range: 3.2, label: 'SHOCKED!' }, burst: ['#ff8ae0', '#ffd0f4', '#7a5ad0'], ability: 'Electric tendrils shock the nearest human within 3 tiles for 2s.' },
    angler: { id: 'angler', name: 'ANGLER SNIPER', hp: 170, armor: 0, speed: 0.35, dmg: 22, size: 1.2, ranged: true, burst: ['#3a5ad0', '#ffe14a', '#1a2a6a'], ability: 'Fires glowing bolts from its lure at range.' },
    shellback: { id: 'shellback', name: 'SHELLBACK CRAB', hp: 260, armor: 12, speed: 0.3, dmg: 35, size: 1.4, thorns: 4, burst: ['#e8643a', '#f0a070', '#8a3a2a'], ability: 'Heavy shell (armor 12) with spiky claws that hurt melee attackers.' },
    kraken: { id: 'kraken', name: 'THE KRAKEN', hp: 1300, armor: 6, speed: 0.22, dmg: 100, size: 2.2, boss: true, bossAb: ['grab', 'summon', 'quake'], minions: ['piranha', 'jelly', 'piranha', 'piranha'], burst: ['#7a3ab8', '#c98af0', '#3a1a5a'], ability: 'BOSS. Tentacle grabs pin whole lanes; it summons piranha swarms.' },
    voidling: { id: 'voidling', name: 'VOIDLING', hp: 160, armor: 0, speed: 0.6, dmg: 30, size: 1, cloak: { every: 5, dur: 2.5 }, burst: ['#1a0a3a', '#a04aff', '#5a2aa0'], ability: 'Phases in and out of reality: cannot be targeted while phased.' },
    gravitron: { id: 'gravitron', name: 'GRAVITRON', hp: 240, armor: 4, speed: 0.38, dmg: 25, size: 1.2, psy: { every: 6, dur: 3, range: 5, label: 'CRUSHED!' }, burst: ['#7a5aff', '#ffffff', '#3a2a8a'], ability: 'Crushing gravity pins the nearest human in place for 3s from 5 tiles.' },
    eclipse: { id: 'eclipse', name: 'ECLIPSE ORB', hp: 300, armor: 5, speed: 0.4, dmg: 30, size: 1.2, deathBlast: { dmg: 80 }, burst: ['#ffcf3a', '#ff5ad8', '#2a1a4a'], ability: 'Collapses in a huge energy blast when destroyed.' },
    starwyrm: { id: 'starwyrm', name: 'STAR WYRM', hp: 280, armor: 3, speed: 0.7, dmg: 35, size: 1.3, fly: true, burst: ['#5cf7ff', '#ffffff', '#3a5aff'], ability: 'Cosmic serpent that flies over your first defender.' },
    voidtitan: { id: 'voidtitan', name: 'VOID TITAN', hp: 1500, armor: 10, speed: 0.22, dmg: 120, size: 2.4, boss: true, bossAb: ['quake', 'freeze', 'summon', 'heal'], minions: ['voidling', 'starwyrm', 'eclipse', 'voidling'], burst: ['#a04aff', '#ff5ad8', '#0a0620'], ability: 'BOSS. Quakes, gravity freezes, summons and heals itself.' },
    vinelasher: { id: 'vinelasher', name: 'VINE LASHER', hp: 170, armor: 0, speed: 0.5, dmg: 20, size: 1.1, freeze: 1.5, freezeText: 'ENTANGLED!', burst: ['#3a9a3a', '#7ad06a', '#2a5a1a'], ability: 'Thorny vines entangle a human for 1.5s on every hit.' },
    sporecap: { id: 'sporecap', name: 'SPORE CAP', hp: 210, armor: 2, speed: 0.35, dmg: 20, size: 1.2, deathBlast: { dmg: 50 }, burst: ['#c23a5a', '#ffd0e0', '#7a2a8a'], ability: 'Bursts into a cloud of spores when destroyed.' },
    swamptoad: { id: 'swamptoad', name: 'SWAMP TOAD', hp: 130, armor: 0, speed: 0.3, dmg: 18, size: 1, hop: true, poison: { dps: 7, dur: 3, label: 'TOXIC' }, burst: ['#6aa02a', '#c8e86a', '#3a5a1a'], ability: 'Leaps in big hops and its bite is toxic: 7 damage per second for 3s.' },
    mossgolem: { id: 'mossgolem', name: 'MOSS GOLEM', hp: 560, armor: 8, speed: 0.28, dmg: 50, size: 1.6, regen: 8, burst: ['#5a7a3a', '#8ad06a', '#3a3a2a'], ability: 'Mossy stone (armor 8) that regrows 8 HP every second.' },
    swamphydra: { id: 'swamphydra', name: 'SWAMP HYDRA', hp: 1400, armor: 8, speed: 0.22, dmg: 110, size: 2.3, regen: 6, boss: true, bossAb: ['grab', 'summon', 'quake'], abLabel: { grab: 'HEAD BUTT GRAB!' }, minions: ['swamptoad', 'vinelasher', 'sporecap', 'swamptoad'], burst: ['#3a9a3a', '#c8e86a', '#1a3a1a'], ability: 'BOSS. Regrows health, grabs whole lanes and calls swamp creatures.' },
    stormsprite: { id: 'stormsprite', name: 'STORM SPRITE', hp: 150, armor: 0, speed: 0.45, dmg: 15, size: 1, psy: { every: 5, dur: 2, range: 3.5, label: 'ZAPPED!' }, burst: ['#7ab8ff', '#ffe14a', '#ffffff'], ability: 'Calls down lightning on the nearest human within 3 tiles to stun it.' },
    thunderbird: { id: 'thunderbird', name: 'THUNDERBIRD', hp: 170, armor: 0, speed: 0.85, dmg: 30, size: 1.3, fly: true, burst: ['#ffe14a', '#7ab8ff', '#ffffff'], ability: 'Soars over the first human it meets.' },
    rocktroll: { id: 'rocktroll', name: 'ROCK TROLL', hp: 480, armor: 9, speed: 0.3, dmg: 55, size: 1.6, thorns: 3, burst: ['#7a7a8a', '#b0b0c0', '#4a4a5a'], ability: 'Rocky hide (armor 9) with spikes that hurt melee attackers.' },
    voltbeetle: { id: 'voltbeetle', name: 'VOLT BEETLE', hp: 200, armor: 10, speed: 0.5, dmg: 25, size: 1.1, freeze: 1, freezeText: 'SHOCKED!', burst: ['#3a4a9a', '#ffe14a', '#8a9ae8'], ability: 'Armored shell (armor 10). Its shocks stun humans for 1s.' },
    stormcolossus: { id: 'stormcolossus', name: 'STORM COLOSSUS', hp: 1500, armor: 10, speed: 0.22, dmg: 120, size: 2.4, boss: true, bossAb: ['freeze', 'quake', 'summon'], abLabel: { freeze: 'THUNDERCLAP!' }, minions: ['stormsprite', 'thunderbird', 'voltbeetle', 'stormsprite'], burst: ['#7ab8ff', '#ffffff', '#ffe14a'], ability: 'BOSS. Thunderclaps stun whole lanes, quakes and storm minions.' },
    mummy: { id: 'mummy', name: 'TOMB MUMMY', hp: 260, armor: 2, speed: 0.32, dmg: 30, size: 1.2, poison: { dps: 8, dur: 4, label: 'CURSED' }, burst: ['#e8d8a0', '#a89860', '#6a5a2a'], ability: 'Its curse drains 8 HP per second for 4s.' },
    scarab: { id: 'scarab', name: 'SCARAB SWARMER', hp: 60, armor: 0, speed: 1.1, dmg: 12, size: 0.7, burst: ['#2a7a6a', '#ffcf3a', '#0a3a3a'], ability: 'Tiny, extremely fast tomb beetle.' },
    anubis: { id: 'anubis', name: 'ANUBIS GUARD', hp: 300, armor: 4, speed: 0.38, dmg: 28, size: 1.3, psy: { every: 6, dur: 3, range: 5, label: 'JUDGED!' }, burst: ['#1a1a2a', '#ffcf3a', '#5a4a2a'], ability: 'Passes judgment from 5 tiles, freezing the nearest human for 3s.' },
    sarcophagus: { id: 'sarcophagus', name: 'SARCOPHAGUS', hp: 620, armor: 14, speed: 0.25, dmg: 45, size: 1.5, burst: ['#d8b040', '#8a6a1a', '#2a7a8a'], ability: 'Golden coffin with armor 14. Bring Sam, Priya or Max.' },
    pharaoh: { id: 'pharaoh', name: 'PHARAOH KING', hp: 1600, armor: 10, speed: 0.22, dmg: 120, size: 2.3, boss: true, bossAb: ['freeze', 'summon', 'heal', 'quake'], abLabel: { freeze: 'ROYAL CURSE!' }, minions: ['mummy', 'scarab', 'scarab', 'anubis'], burst: ['#ffcf3a', '#2a7aaa', '#ffffff'], ability: 'BOSS. Curses lanes, heals himself and raises the dead.' },
    nanoswarm: { id: 'nanoswarm', name: 'NANO SWARM', hp: 80, armor: 0, speed: 1.0, dmg: 14, size: 0.8, burst: ['#7ffcff', '#ffffff', '#3a8aaa'], ability: 'A cloud of tiny machines. Fast and numerous.' },
    turretbot: { id: 'turretbot', name: 'TURRET BOT', hp: 220, armor: 6, speed: 0.32, dmg: 26, size: 1.2, ranged: true, burst: ['#8a8fa8', '#ff5a3a', '#4a4f68'], ability: 'Armor 6. Fires energy bolts at range.' },
    hackerbot: { id: 'hackerbot', name: 'HACKER BOT', hp: 250, armor: 3, speed: 0.4, dmg: 22, size: 1.2, psy: { every: 5.5, dur: 3, range: 5, label: 'HACKED!' }, burst: ['#3aff8a', '#0a2a1a', '#ffffff'], ability: 'Hacks the nearest human within 5 tiles, disabling it for 3s.' },
    tankbot: { id: 'tankbot', name: 'TANK BOT', hp: 700, armor: 18, speed: 0.24, dmg: 65, size: 1.7, burst: ['#6a7a8a', '#ff9a3a', '#2a3a4a'], ability: 'Armor 18! Only Max\'s ultimate and Sam really hurt it.' },
    omegaprime: { id: 'omegaprime', name: 'OMEGA PRIME', hp: 1800, armor: 12, speed: 0.22, dmg: 140, size: 2.5, boss: true, bossAb: ['quake', 'freeze', 'summon', 'heal'], abLabel: { freeze: 'SYSTEM HACK!' }, minions: ['nanoswarm', 'turretbot', 'hackerbot', 'nanoswarm', 'tankbot'], burst: ['#7ffcff', '#ff3a5a', '#ffffff'], ability: 'FINAL BOSS. Hacks lanes, quakes, repairs itself and deploys robot minions.' },
    mothership: { id: 'mothership', name: 'THE MOTHERSHIP', hp: 5000, speed: 0, dmg: 0, size: 3, ability: 'Plasma blast, summons, lane shutdown, energy-stealing zones.' }
  };

  H.WORLDS = [
    { id: 1, name: 'CITY OUTSKIRTS', theme: 'city', pool: ['slime', 'grunt', 'brute', 'bomber', 'trooper'], boss: 'commander', blurb: 'A futuristic human city under siege.' },
    { id: 2, name: 'DESERT BASE', theme: 'desert', pool: ['grunt', 'scorpion', 'burrower', 'cactus', 'bomber', 'spitter', 'zapper', 'jet'], boss: 'shield', blurb: 'A military base surrounded by burning sand.' },
    { id: 3, name: 'MOON COLONY', theme: 'moon', pool: ['hopper', 'astronaut', 'shade', 'zapper', 'shield', 'medic', 'juggernaut'], boss: 'prime', blurb: 'Low gravity, dark sky, no way back.' },
    { id: 4, name: 'ALIEN PLANET', theme: 'alien', pool: ['grunt', 'golem', 'brood', 'mindsquid', 'spitter', 'bomber', 'jet', 'shield', 'medic', 'juggernaut', 'commander'], boss: 'mothership', blurb: 'Take the fight to the alien homeworld.' },
    { id: 5, name: 'FROZEN TUNDRA', theme: 'ice', pool: ['frostling', 'icebat', 'snowmage', 'yeti', 'grunt', 'spitter', 'medic', 'zapper'], boss: 'frosttitan', blurb: 'Blizzards, ice caves and things that freeze.' },
    { id: 6, name: 'VOLCANO CORE', theme: 'lava', pool: ['emberhound', 'magmaling', 'lavaslug', 'obsidian', 'bomber', 'spitter', 'juggernaut', 'medic'], boss: 'magmawyrm', blurb: 'Rivers of lava and an army forged in fire.' },
    { id: 7, name: 'DEEP OCEAN', theme: 'ocean', pool: ['piranha', 'jelly', 'angler', 'shellback', 'brood', 'jet', 'medic', 'shield'], boss: 'kraken', blurb: 'The alien fleet hides in the crushing deep.' },
    { id: 8, name: 'DARK NEBULA', theme: 'void', pool: ['voidling', 'gravitron', 'eclipse', 'starwyrm', 'golem', 'mindsquid', 'shield', 'juggernaut', 'commander', 'medic'], boss: 'voidtitan', blurb: 'The edge of the galaxy. The final stand.' },
    { id: 9, name: 'TOXIC SWAMP', theme: 'jungle', pool: ['vinelasher', 'sporecap', 'swamptoad', 'mossgolem', 'spitter', 'medic', 'brood', 'bomber'], boss: 'swamphydra', blurb: 'Glowing bogs and things that grow.' },
    { id: 10, name: 'STORM PEAKS', theme: 'storm', pool: ['stormsprite', 'thunderbird', 'rocktroll', 'voltbeetle', 'zapper', 'shield', 'medic', 'juggernaut'], boss: 'stormcolossus', blurb: 'Lightning strikes the mountain fortress.' },
    { id: 11, name: 'GOLDEN RUINS', theme: 'ruins', pool: ['scarab', 'mummy', 'anubis', 'sarcophagus', 'burrower', 'scorpion', 'medic', 'commander'], boss: 'pharaoh', blurb: 'An ancient tomb awakened by the invaders.' },
    { id: 12, name: 'THE MAINFRAME', theme: 'tech', pool: ['nanoswarm', 'turretbot', 'hackerbot', 'tankbot', 'shield', 'medic', 'juggernaut', 'commander'], boss: 'omegaprime', blurb: 'The alien war machine. Shut it down.' }
  ];

  H.introAt = { bomber: [1, 2], trooper: [1, 3], scorpion: [2, 1], burrower: [2, 2], cactus: [2, 3], spitter: [2, 2], spiker: [2, 3], zapper: [2, 1], jet: [2, 2], hopper: [3, 1], astronaut: [3, 1], shade: [3, 2], shield: [3, 2], medic: [3, 3], juggernaut: [3, 4], golem: [4, 1], mindsquid: [4, 1], brood: [4, 2], commander: [4, 1], frostling: [5, 1], icebat: [5, 1], snowmage: [5, 2], yeti: [5, 3], spitter: [2, 2], emberhound: [6, 1], magmaling: [6, 1], lavaslug: [6, 2], obsidian: [6, 3], piranha: [7, 1], jelly: [7, 1], angler: [7, 2], shellback: [7, 3], voidling: [8, 1], gravitron: [8, 2], eclipse: [8, 2], starwyrm: [8, 3], vinelasher: [9, 1], sporecap: [9, 1], swamptoad: [9, 2], mossgolem: [9, 3], stormsprite: [10, 1], thunderbird: [10, 1], rocktroll: [10, 2], voltbeetle: [10, 3], scarab: [11, 1], mummy: [11, 1], anubis: [11, 2], sarcophagus: [11, 3], nanoswarm: [12, 1], turretbot: [12, 1], hackerbot: [12, 2], tankbot: [12, 3] };

  H.introW = { 5: { medic: 3, zapper: 2, spitter: 1 }, 6: { medic: 3, juggernaut: 4, spitter: 2, bomber: 1 }, 7: { jet: 2, brood: 3, medic: 3, shield: 4 }, 9: { spitter: 1, bomber: 1, medic: 3, brood: 4, mossgolem: 3 }, 10: { zapper: 1, shield: 3, medic: 3, juggernaut: 4 }, 11: { burrower: 1, scorpion: 1, medic: 3, commander: 5, sarcophagus: 3 }, 12: { shield: 2, medic: 3, juggernaut: 4, commander: 5, tankbot: 3 }, 8: { gravitron: 2, golem: 3, mindsquid: 3, shield: 3, medic: 3, juggernaut: 4, commander: 5 } };
  function lv(world, level) {
    const idx = (world - 1) * 5 + level;
    const w = H.WORLDS[world - 1];
    const isBoss = level === 5;
    const waves = isBoss ? 6 + Math.min(4, world) : 5 + Math.min(5, Math.floor(idx / 2) + 1);
    const pool = w.pool.filter(k => {
      const ov = (H.introW[world] || {})[k];
      if (ov != null) return level >= ov;
      const at = H.introAt[k];
      if (!at) return true;
      return world > at[0] || (world === at[0] && level >= at[1]);
    });
    return { world, level, idx, waves: Math.min(10, waves), pool, boss: isBoss ? w.boss : null, name: w.name + ' ' + world + '-' + level };
  }
  H.levelOf = lv;
  H.LEVELS = [];
  for (let w = 1; w <= H.WORLDS.length; w++) for (let l = 1; l <= 5; l++) H.LEVELS.push(lv(w, l));

  H.ACHIEVEMENTS = [
    { id: 'first', name: 'FIRST CONTACT', desc: 'Complete your first level.', icon: '👽' },
    { id: 'buster', name: 'ALIEN BUSTER', desc: 'Defeat 100 aliens.', icon: '💥' },
    { id: 'squad', name: 'FULL SQUAD', desc: 'Own 5 humans (buy them in the Shop).', icon: '🧑‍🚀' },
    { id: 'hoarder', name: 'ENERGY HOARDER', desc: 'Collect 1,000 Energy.', icon: '⚡' },
    { id: 'boss', name: 'BOSS DOWN', desc: 'Defeat your first boss.', icon: '👑' },
    { id: 'saved', name: 'HUMANITY SAVED', desc: 'Complete World 1.', icon: '🌎' }
  ];

  H.UPG = {
    dmg: { name: 'DAMAGE', icon: '⚔️', mult: [1, 1.25, 1.55, 1.95, 2.5] },
    hp: { name: 'HEALTH', icon: '❤️', mult: [1, 1.2, 1.45, 1.75, 2.1] },
    spd: { name: 'ATTACK SPEED', icon: '⏱️', mult: [1, 1.1, 1.22, 1.36, 1.55] },
    rng: { name: 'RANGE', icon: '🎯', add: [0, 0.4, 0.8, 1.2, 1.6] },
    spc: { name: 'SPECIAL', icon: '✨', mult: [1, 1.2, 1.4, 1.65, 2] }
  };
  H.upgCost = lvl => 2 + lvl * 2;

  H.LUCY_DMG = [30, 40, 55, 75, 100];

  H.stat = function (h, up, key) {
    up = up || {};
    const l = up[key === 'cd' ? 'spd' : key === 'range' ? 'rng' : key] || 0;
    switch (key) {
      case 'dmg':
        if (h.id === 'lucy') return H.LUCY_DMG[l];
        return Math.round(h.dmg * H.UPG.dmg.mult[l]);
      case 'hp': return Math.round(h.hp * H.UPG.hp.mult[l]);
      case 'cd': return h.cd / H.UPG.spd.mult[l];
      case 'range': return h.range + H.UPG.rng.add[l];
      case 'spc': return H.UPG.spc.mult[l];
    }
  };

  H.specialText = {
    ryan: 'SPECIAL: chance to fire a second shot',
    lucy: 'SPECIAL: lasers pierce extra aliens',
    tom: 'SPECIAL: takes 8% less damage per level',
    maya: 'SPECIAL: heals 20% more per level',
    sam: 'SPECIAL: +5% critical chance per level',
    eli: 'SPECIAL: stronger, tougher drones',
    priya: 'SPECIAL: bigger plasma blast radius',
    max: 'SPECIAL: ultimate recharges 2s faster per level',
    chronos: 'SPECIAL: shield reduces more damage, recharges faster per level'
  };
})(window.HVA);
