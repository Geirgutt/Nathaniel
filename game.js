const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const levelEl = document.getElementById("level");
const bestEl = document.getElementById("best");
const overlayEl = document.getElementById("overlay");
const messageEl = document.getElementById("message");
const actionEl = document.getElementById("action");
const playerNameEl = document.getElementById("playerName");
const saveScoreEl = document.getElementById("saveScore");
const scoreEntryEl = document.getElementById("scoreEntry");
const scoreStatusEl = document.getElementById("scoreStatus");
const leaderboardEl = document.getElementById("leaderboard");
const leaderboardPanelEl = document.getElementById("leaderboardPanel");
const coinBankEl = document.getElementById("coinBank");
const selectedMapNameEl = document.getElementById("selectedMapName");
const selectedSkillNameEl = document.getElementById("selectedSkillName");
const skinsShopEl = document.getElementById("skinsShop");
const mapsShopEl = document.getElementById("mapsShop");
const skillsShopEl = document.getElementById("skillsShop");

const width = canvas.width;
const height = canvas.height;
const fixedStepMs = 1000 / 60;
const maxFrameDeltaMs = 100;
const maxUpdatesPerFrame = 4;
const moveSpeed = 2.8;
const baseJumpVelocity = -10.9;
const basePlatformWidth = 98;
const platformHeight = 14;
const basePlatformGap = 112;
const runnerTriggerScore = 2000;
const runnerBonusScore = 180;
const runnerCrashPenalty = 120;
const runnerGroundY = height - 118;
const bestScoreKey = "hopp-hoyest-best";
const playerNameKey = "hopp-hoyest-player-name";
const localLeaderboardKey = "hopp-hoyest-local-leaderboard";
const progressionKey = "hopp-hoyest-progression-v1";
const coinsPerLevel = 12;
const leaderboardLimit = 10;
const discoDurationMs = 8000;
const jetpackDurationMs = 900;
const runnerDashDurationMs = 380;
const supabaseConfig = window.SUPABASE_CONFIG || { url: "", publishableKey: "", table: "scores" };
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const lowFxMode = isCoarsePointer;

const skins = {
  starter: {
    id: "starter",
    name: "Sky Kid",
    description: "Klassisk helt med rød kappe.",
    cost: 0,
    colors: { body: "#1f3c88", cape: "#ff5f6d", visor: "#7dd3fc", accent: "#0f172a" }
  },
  robot: {
    id: "robot",
    name: "Turbo Bot",
    description: "Blank robot med neonblikk.",
    cost: 40,
    colors: { body: "#7c8aa5", cape: "#00d1ff", visor: "#caf0f8", accent: "#102235" }
  },
  melon: {
    id: "melon",
    name: "Melon Mage",
    description: "En hoppende vannmelon med attitude.",
    cost: 70,
    colors: { body: "#39a845", cape: "#ff4d6d", visor: "#ffe066", accent: "#1b4332" }
  },
  toast: {
    id: "toast",
    name: "Toast Rocket",
    description: "Frokost med fartstriper.",
    cost: 95,
    colors: { body: "#c08457", cape: "#ff9f1c", visor: "#fff0c2", accent: "#6b3e26" }
  }
};

const maps = {
  sky: {
    id: "sky",
    name: "Sky Park",
    description: "Luftig daghimmel og lett synth.",
    cost: 0,
    theme: {
      bodyBackground: "radial-gradient(circle at top, rgba(255, 245, 180, 0.75), transparent 30%), linear-gradient(180deg, #87ceeb 0%, #dff5ff 48%, #f7f7ef 100%)",
      top: "#8ad8ff",
      mid: "#dbf4ff",
      bottom: "#fff2c2",
      cloud: "rgba(255,255,255,0.68)",
      runnerTop: "#0f172a",
      runnerMid: "#1d3557",
      runnerBottom: "#2d6a4f"
    },
    musicSequence: [
      { bass: 110.0, lead: 659.25, pulse: true },
      { bass: 146.83, lead: 783.99, pulse: false },
      { bass: 123.47, lead: 698.46, pulse: true },
      { bass: 164.81, lead: 880.0, pulse: true }
    ]
  },
  sunset: {
    id: "sunset",
    name: "Sunset Strip",
    description: "Oransje skyline og mer driv i beaten.",
    cost: 80,
    theme: {
      bodyBackground: "radial-gradient(circle at top, rgba(255, 207, 123, 0.78), transparent 30%), linear-gradient(180deg, #ff9a5a 0%, #ffcf99 45%, #5e4b8b 100%)",
      top: "#ff955c",
      mid: "#ffd1a6",
      bottom: "#6f5aa7",
      cloud: "rgba(255,236,209,0.44)",
      runnerTop: "#2b124c",
      runnerMid: "#522258",
      runnerBottom: "#c4483d"
    },
    musicSequence: [
      { bass: 98.0, lead: 587.33, pulse: true },
      { bass: 130.81, lead: 659.25, pulse: true },
      { bass: 146.83, lead: 783.99, pulse: false },
      { bass: 174.61, lead: 880.0, pulse: true }
    ]
  },
  frost: {
    id: "frost",
    name: "Frost Byte",
    description: "Kald neon-is og skarpere toner.",
    cost: 130,
    theme: {
      bodyBackground: "radial-gradient(circle at top, rgba(170, 240, 255, 0.6), transparent 32%), linear-gradient(180deg, #8ed8ff 0%, #d9e6ff 46%, #cfe8ff 100%)",
      top: "#7ed7ff",
      mid: "#dce8ff",
      bottom: "#b9d2ff",
      cloud: "rgba(238,249,255,0.55)",
      runnerTop: "#081c3a",
      runnerMid: "#1d4e89",
      runnerBottom: "#4da8da"
    },
    musicSequence: [
      { bass: 123.47, lead: 698.46, pulse: false },
      { bass: 146.83, lead: 880.0, pulse: true },
      { bass: 164.81, lead: 987.77, pulse: true },
      { bass: 196.0, lead: 1174.66, pulse: false }
    ]
  }
};

const skills = {
  none: {
    id: "none",
    name: "Ingen",
    description: "Spill rent og enkelt.",
    cost: 0
  },
  extra_life: {
    id: "extra_life",
    name: "Ekstraliv",
    description: "Redder deg fra ett stygt fall.",
    cost: 60
  },
  frog_hop: {
    id: "frog_hop",
    name: "Froskehopp",
    description: "Hopp ekstra hardt i starten av runden.",
    cost: 85
  },
  superspeed: {
    id: "superspeed",
    name: "Superspeed",
    description: "Kvassere styring og høyere toppfart en stund.",
    cost: 95
  },
  banana: {
    id: "banana",
    name: "Mystisk banan",
    description: "Ingen vet hva den egentlig gjør. Lases opp ved 5000 m.",
    cost: 0,
    unlockScore: 5000
  }
};

const music = {
  context: null,
  master: null,
  bassGain: null,
  leadGain: null,
  pulseGain: null,
  active: false,
  nextNoteTime: 0,
  step: 0,
  discoSequence: [
    { bass: 130.81, lead: 783.99, pulse: true },
    { bass: 164.81, lead: 1046.5, pulse: true },
    { bass: 146.83, lead: 987.77, pulse: false },
    { bass: 196.0, lead: 1174.66, pulse: true }
  ],
  runnerSequence: [
    { bass: 98.0, lead: 523.25, pulse: true },
    { bass: 123.47, lead: 659.25, pulse: false },
    { bass: 146.83, lead: 698.46, pulse: true },
    { bass: 164.81, lead: 783.99, pulse: true }
  ]
};

const defaultProgression = {
  bankCoins: 0,
  ownedSkins: ["starter"],
  selectedSkin: "starter",
  ownedMaps: ["sky"],
  selectedMap: "sky",
  ownedSkills: ["none"],
  selectedSkill: "none",
  unlockedBanana: false
};

const state = {
  running: false,
  mode: "jumper",
  cameraY: 0,
  heightScore: 0,
  bestScore: Number(localStorage.getItem(bestScoreKey)) || 0,
  coins: 0,
  level: 1,
  scoreSubmitted: false,
  leaderboard: [],
  progression: null,
  keys: { left: false, right: false },
  touch: { active: false, pointerId: null, startX: 0, lastX: 0, lastTime: 0 },
  player: null,
  platforms: [],
  collectibles: [],
  floatingTexts: [],
  lastFrameTime: 0,
  accumulator: 0,
  elapsedMs: 0,
  effects: {
    discoUntil: 0,
    jetpackUntil: 0,
    bananaUntil: 0
  },
  skillState: {
    selected: "none",
    extraLifeUsed: false,
    frogUntil: 0,
    speedUntil: 0,
    bananaTriggered: false,
    bananaPulseUntil: 0
  },
  shopCategory: "skins",
  runner: {
    triggered: false,
    completed: false,
    distance: 0,
    nextObstacleAt: 220,
    portalDistance: 980,
    obstacles: [],
    portal: null,
    dashUntil: 0,
    obstacleCooldownUntil: 0,
    speed: 6.2,
    backgroundOffset: 0,
    jumpQueued: false,
    dashQueued: false
  }
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeName(name) {
  return name.trim().replace(/\s+/g, " ").slice(0, 16);
}

function getPlayerName() {
  return sanitizeName(playerNameEl.value || "");
}

function hasSupabaseConfig() {
  return Boolean(supabaseConfig.url && supabaseConfig.publishableKey && supabaseConfig.table);
}

function setScoreStatus(message) {
  scoreStatusEl.textContent = message;
}

function cloneDefaultProgression() {
  return {
    bankCoins: defaultProgression.bankCoins,
    ownedSkins: [...defaultProgression.ownedSkins],
    selectedSkin: defaultProgression.selectedSkin,
    ownedMaps: [...defaultProgression.ownedMaps],
    selectedMap: defaultProgression.selectedMap,
    ownedSkills: [...defaultProgression.ownedSkills],
    selectedSkill: defaultProgression.selectedSkill,
    unlockedBanana: defaultProgression.unlockedBanana
  };
}

function uniqueList(items) {
  return [...new Set(items)];
}

function loadProgression() {
  let loaded = {};
  try {
    loaded = JSON.parse(localStorage.getItem(progressionKey)) || {};
  } catch {
    loaded = {};
  }

  const progression = {
    ...cloneDefaultProgression(),
    ...loaded,
    ownedSkins: uniqueList([...(loaded.ownedSkins || defaultProgression.ownedSkins)]).filter((id) => skins[id]),
    ownedMaps: uniqueList([...(loaded.ownedMaps || defaultProgression.ownedMaps)]).filter((id) => maps[id]),
    ownedSkills: uniqueList([...(loaded.ownedSkills || defaultProgression.ownedSkills)]).filter((id) => skills[id])
  };

  if (!progression.ownedSkins.includes("starter")) progression.ownedSkins.unshift("starter");
  if (!progression.ownedMaps.includes("sky")) progression.ownedMaps.unshift("sky");
  if (!progression.ownedSkills.includes("none")) progression.ownedSkills.unshift("none");
  if (!skins[progression.selectedSkin]) progression.selectedSkin = "starter";
  if (!maps[progression.selectedMap]) progression.selectedMap = "sky";
  if (!skills[progression.selectedSkill]) progression.selectedSkill = "none";
  if (!progression.ownedSkins.includes(progression.selectedSkin)) progression.selectedSkin = progression.ownedSkins[0];
  if (!progression.ownedMaps.includes(progression.selectedMap)) progression.selectedMap = progression.ownedMaps[0];
  if (!progression.ownedSkills.includes(progression.selectedSkill)) progression.selectedSkill = progression.ownedSkills[0];
  progression.bankCoins = Math.max(0, Number(progression.bankCoins) || 0);
  progression.unlockedBanana = Boolean(progression.unlockedBanana);
  return progression;
}

function saveProgression() {
  localStorage.setItem(progressionKey, JSON.stringify(state.progression));
}

function getSelectedSkin() {
  return skins[state.progression.selectedSkin] || skins.starter;
}

function getSelectedMap() {
  return maps[state.progression.selectedMap] || maps.sky;
}

function getSelectedSkill() {
  return skills[state.progression.selectedSkill] || skills.none;
}

function owns(kind, id) {
  const key = kind === "skin" ? "ownedSkins" : kind === "map" ? "ownedMaps" : "ownedSkills";
  return state.progression[key].includes(id);
}

function canAfford(cost) {
  return state.progression.bankCoins >= cost;
}

function updateProfileBar() {
  coinBankEl.textContent = `${state.progression.bankCoins}`;
  selectedMapNameEl.textContent = getSelectedMap().name;
  selectedSkillNameEl.textContent = getSelectedSkill().name;
}

function applyBodyTheme() {
  document.body.style.background = getSelectedMap().theme.bodyBackground;
}

function setShopCategory(category) {
  state.shopCategory = category;
  skinsSectionEl.classList.toggle("hidden", category !== "skins");
  mapsSectionEl.classList.toggle("hidden", category !== "maps");
  skillsSectionEl.classList.toggle("hidden", category !== "skills");

  for (const button of shopCategoryEls) {
    button.classList.toggle("active", button.dataset.category === category);
  }
}
function renderShopCards(container, items, kind) {
  container.innerHTML = Object.values(items).map((item) => {
    const ownedItem = owns(kind, item.id);
    const selected = (kind === "skin" && state.progression.selectedSkin === item.id) ||
      (kind === "map" && state.progression.selectedMap === item.id) ||
      (kind === "skill" && state.progression.selectedSkill === item.id);
    const lockedByScore = Boolean(item.unlockScore && state.bestScore < item.unlockScore && !ownedItem);

    let label = "Kjop";
    let extraClass = "";
    if (selected) {
      label = "Valgt";
      extraClass = "selected";
    } else if (ownedItem) {
      label = "Velg";
      extraClass = "owned";
    } else if (lockedByScore) {
      label = `${item.unlockScore} m`;
      extraClass = "locked";
    } else {
      label = item.cost > 0 ? `${item.cost} coins` : "Gratis";
    }

    return `
      <article class="shop-card">
        <div>
          <strong>${item.name}</strong>
          <p>${item.description}</p>
          <div class="shop-meta">
            <span>${ownedItem ? "Eid" : lockedByScore ? "Lases opp senere" : `Pris: ${item.cost}`}</span>
          </div>
        </div>
        <button
          class="shop-button ${extraClass}"
          type="button"
          data-kind="${kind}"
          data-id="${item.id}"
          ${selected ? "disabled" : ""}
          ${lockedByScore ? "disabled" : ""}
        >${label}</button>
      </article>`;
  }).join("");
}

function renderShop() {
  renderShopCards(skinsShopEl, skins, "skin");
  renderShopCards(mapsShopEl, maps, "map");
  renderShopCards(skillsShopEl, skills, "skill");
  updateProfileBar();
}

function spendCoins(cost) {
  state.progression.bankCoins = Math.max(0, state.progression.bankCoins - cost);
  saveProgression();
  updateProfileBar();
}

function selectOwned(kind, id) {
  if (kind === "skin") {
    state.progression.selectedSkin = id;
  } else if (kind === "map") {
    state.progression.selectedMap = id;
    applyBodyTheme();
  } else {
    state.progression.selectedSkill = id;
  }
  saveProgression();
  renderShop();
}

function purchase(kind, id) {
  const collection = kind === "skin" ? skins : kind === "map" ? maps : skills;
  const item = collection[id];
  if (!item) {
    return;
  }

  if (owns(kind, id)) {
    selectOwned(kind, id);
    return;
  }

  if (item.unlockScore && state.bestScore < item.unlockScore) {
    addFloatingText(`${item.unlockScore} m kreves`, width / 2, state.cameraY + 220, "#ff6b6b", 60);
    return;
  }

  if (!canAfford(item.cost)) {
    addFloatingText("Flere coins trengs", width / 2, state.cameraY + 220, "#ff6b6b", 60);
    return;
  }

  spendCoins(item.cost);
  const key = kind === "skin" ? "ownedSkins" : kind === "map" ? "ownedMaps" : "ownedSkills";
  state.progression[key].push(id);
  state.progression[key] = uniqueList(state.progression[key]);
  selectOwned(kind, id);
}

function unlockBananaIfNeeded(score) {
  if (state.progression.unlockedBanana || score < 5000) {
    return false;
  }

  state.progression.unlockedBanana = true;
  state.progression.ownedSkills.push("banana");
  state.progression.ownedSkills = uniqueList(state.progression.ownedSkills);
  saveProgression();
  renderShop();
  updateProfileBar();
  addFloatingText("MYSTISK BANAN LASES OPP!", width / 2, state.cameraY + 180, "#ffe066", 90);
  return true;
}

function renderLeaderboard(scores) {
  state.leaderboard = scores;

  if (!scores.length) {
    leaderboardEl.innerHTML = "<li>Ingen score enda.</li>";
    return;
  }

  leaderboardEl.innerHTML = scores
    .map((entry) => `<li><strong>${entry.name}</strong> - ${entry.score} m (level ${entry.level})</li>`)
    .join("");
}

function readLocalLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(localLeaderboardKey)) || [];
  } catch {
    return [];
  }
}

function writeLocalLeaderboard(scores) {
  localStorage.setItem(localLeaderboardKey, JSON.stringify(scores.slice(0, leaderboardLimit)));
}

function qualifiesForLeaderboard(score) {
  if (state.leaderboard.length < leaderboardLimit) {
    return score > 0;
  }

  const lastScore = state.leaderboard[state.leaderboard.length - 1]?.score ?? 0;
  return score >= lastScore;
}

async function parseErrorDetails(response) {
  try {
    const data = await response.json();
    return data.message || data.error_description || data.hint || JSON.stringify(data);
  } catch {
    return `HTTP ${response.status}`;
  }
}

async function fetchLeaderboard() {
  if (!hasSupabaseConfig()) {
    const scores = readLocalLeaderboard();
    renderLeaderboard(scores);
    setScoreStatus("Fyll inn Supabase i config.js for delt toppliste. Viser lokal liste forelopig.");
    return scores;
  }

  setScoreStatus("Henter toppliste...");

  try {
    const params = new URLSearchParams({
      select: "name,score,level,created_at",
      order: "score.desc,created_at.asc",
      limit: String(leaderboardLimit)
    });

    const response = await fetch(`${supabaseConfig.url}/rest/v1/${supabaseConfig.table}?${params.toString()}`, {
      headers: {
        apikey: supabaseConfig.publishableKey,
        Authorization: `Bearer ${supabaseConfig.publishableKey}`
      }
    });

    if (!response.ok) {
      const details = await parseErrorDetails(response);
      throw new Error(details);
    }

    const scores = await response.json();
    renderLeaderboard(scores);
    setScoreStatus("Toppliste.");
    return scores;
  } catch (error) {
    const scores = readLocalLeaderboard();
    renderLeaderboard(scores);
    setScoreStatus(`Kunne ikke hente Supabase-toppliste. Viser lokal liste. ${error.message || ""}`.trim());
    return scores;
  }
}

async function submitScore() {
  if (state.scoreSubmitted) {
    return;
  }

  const name = getPlayerName();
  if (!name) {
    setScoreStatus("Skriv inn kallenavn for a lagre score.");
    playerNameEl.focus();
    return;
  }

  localStorage.setItem(playerNameKey, name);
  playerNameEl.value = name;

  const entry = {
    name,
    score: Math.floor(state.heightScore),
    level: state.level
  };

  state.scoreSubmitted = true;
  saveScoreEl.disabled = true;

  if (!hasSupabaseConfig()) {
    const scores = [entry, ...readLocalLeaderboard()]
      .sort((a, b) => b.score - a.score)
      .slice(0, leaderboardLimit);
    writeLocalLeaderboard(scores);
    renderLeaderboard(scores);
    setScoreStatus("Score lagret lokalt.");
    scoreEntryEl.classList.add("hidden");
    renderShop();
    return;
  }

  setScoreStatus("Lagrer score...");

  try {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/${supabaseConfig.table}`, {
      method: "POST",
      headers: {
        apikey: supabaseConfig.publishableKey,
        Authorization: `Bearer ${supabaseConfig.publishableKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(entry)
    });

    if (!response.ok) {
      const details = await parseErrorDetails(response);
      throw new Error(details);
    }

    scoreEntryEl.classList.add("hidden");
    setScoreStatus("Score lagret.");
    await fetchLeaderboard();
  } catch (error) {
    state.scoreSubmitted = false;
    saveScoreEl.disabled = false;
    setScoreStatus(`Kunne ikke lagre score. ${error.message || ""}`.trim());
  }
}

function setOverlay(title, buttonText, show = true) {
  messageEl.textContent = title;
  actionEl.textContent = buttonText;
  overlayEl.classList.toggle("hidden", !show);
}

function showStartOverlay() {
  scoreEntryEl.classList.add("hidden");
  leaderboardPanelEl.classList.add("hidden");
  saveScoreEl.disabled = false;
  renderShop();
  setOverlay("Start rolig, samle coins og bygg opp banken din. Portal-run venter ved 2000 meter.", "Start spill", true);
}

async function showGameOverOverlay() {
  const score = Math.floor(state.heightScore);
  scoreEntryEl.classList.add("hidden");
  leaderboardPanelEl.classList.remove("hidden");
  saveScoreEl.disabled = false;
  unlockBananaIfNeeded(score);
  renderShop();

  const scores = await fetchLeaderboard();
  const qualifies = qualifiesForLeaderboard(score);

  if (qualifies) {
    scoreEntryEl.classList.remove("hidden");
    setScoreStatus("Ny toppliste-score. Lagre navnet ditt.");
  } else if (scores.length) {
    setScoreStatus("Ikke top 10 denne gangen, men her er lista.");
  }

  setOverlay(`Du kom til level ${state.level} og nadde ${score} meter. Banken din er pa ${state.progression.bankCoins} coins.`, "Prov igjen", true);
}
function ensureMusic() {
  if (music.context) {
    if (music.context.state === "suspended") {
      music.context.resume();
    }
    music.active = true;
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const master = context.createGain();
  const bassGain = context.createGain();
  const leadGain = context.createGain();
  const pulseGain = context.createGain();
  const filter = context.createBiquadFilter();

  master.gain.value = 0.17;
  bassGain.gain.value = 0.12;
  leadGain.gain.value = 0.07;
  pulseGain.gain.value = 0.05;
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  filter.Q.value = 1.2;

  bassGain.connect(filter);
  leadGain.connect(filter);
  pulseGain.connect(filter);
  filter.connect(master);
  master.connect(context.destination);

  music.context = context;
  music.master = master;
  music.bassGain = bassGain;
  music.leadGain = leadGain;
  music.pulseGain = pulseGain;
  music.active = true;
  music.nextNoteTime = context.currentTime;
}

function isDiscoActive() {
  return state.effects.discoUntil > state.elapsedMs;
}

function isJetpackActive() {
  return state.effects.jetpackUntil > state.elapsedMs;
}

function isRunnerDashActive() {
  return state.runner.dashUntil > state.elapsedMs;
}

function isFrogActive() {
  return state.skillState.frogUntil > state.elapsedMs;
}

function isSpeedSkillActive() {
  return state.skillState.speedUntil > state.elapsedMs;
}

function isBananaActive() {
  return state.effects.bananaUntil > state.elapsedMs;
}

function activateDisco(duration = discoDurationMs) {
  state.effects.discoUntil = Math.max(state.effects.discoUntil, state.elapsedMs + duration);
  addFloatingText("DISCO!", width / 2, state.cameraY + 220, "#ff4fd8", 70);
}

function activateJetpack(power = -17, duration = jetpackDurationMs) {
  state.effects.jetpackUntil = Math.max(state.effects.jetpackUntil, state.elapsedMs + duration);
  state.player.vy = Math.min(state.player.vy, power);
  addFloatingText("JETPACK!", state.player.x + state.player.w / 2, state.player.y - 18, "#ff8c42", 60);
}

function activateBananaSurprise() {
  state.skillState.bananaTriggered = true;
  state.effects.bananaUntil = state.elapsedMs + 7000;
  state.skillState.bananaPulseUntil = state.elapsedMs + 7000;
  activateDisco(7000);
  activateJetpack(-18.4, 1000);
  state.progression.bankCoins += 12;
  saveProgression();
  updateProfileBar();
  addFloatingText("BANANAMANIA!", width / 2, state.cameraY + 200, "#ffe066", 90);
}

function scheduleTone(type, frequency, startTime, duration, gainNode, volume) {
  const oscillator = music.context.createOscillator();
  const gain = music.context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(gainNode);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function updateMusic() {
  if (!music.active || !music.context) {
    return;
  }

  const disco = isDiscoActive();
  const runnerMode = state.mode === "runner";
  const sequence = runnerMode ? music.runnerSequence : disco ? music.discoSequence : getSelectedMap().musicSequence;
  const lookAhead = 0.18;
  const intensity = Math.min(1, 0.2 + (state.heightScore / 95) + (state.level - 1) * 0.14 + (disco ? 0.3 : 0) + (runnerMode ? 0.2 : 0));
  const baseBeat = runnerMode ? 0.18 : disco ? 0.16 : 0.25;
  const beatLength = state.running ? clamp(baseBeat - intensity * 0.05, 0.11, 0.32) : 0.3;

  music.master.gain.setTargetAtTime(state.running ? (runnerMode ? 0.22 : disco ? 0.24 : 0.18) : 0.1, music.context.currentTime, 0.08);
  music.leadGain.gain.setTargetAtTime(0.05 + intensity * 0.07, music.context.currentTime, 0.08);
  music.pulseGain.gain.setTargetAtTime(state.running ? (runnerMode ? 0.065 : disco ? 0.075 : 0.05) : 0.025, music.context.currentTime, 0.08);

  while (music.nextNoteTime < music.context.currentTime + lookAhead) {
    const note = sequence[music.step % sequence.length];
    scheduleTone(runnerMode ? "square" : disco ? "sawtooth" : "triangle", note.bass, music.nextNoteTime, beatLength * 0.9, music.bassGain, 0.6);
    scheduleTone(runnerMode ? "triangle" : disco ? "triangle" : "square", note.lead * (music.step % 2 === 0 ? 1 : 0.5), music.nextNoteTime, beatLength * 0.58, music.leadGain, 0.24 + intensity * 0.08);

    if (note.pulse) {
      scheduleTone("square", 120 + intensity * 50, music.nextNoteTime, 0.05, music.pulseGain, runnerMode ? 0.14 : disco ? 0.16 : 0.11);
    }

    music.nextNoteTime += beatLength;
    music.step += 1;
  }
}

function getRunDifficulty() {
  const heightFactor = Math.min(1.35, state.heightScore / 85);
  const levelFactor = Math.min(1.2, (state.level - 1) / 2.2);
  return clamp(0.32 + heightFactor * 0.95 + levelFactor * 0.75, 0, 1.75);
}

function getPlatformWidth() {
  const difficulty = getRunDifficulty();
  const bananaBonus = isBananaActive() ? 16 : 0;
  return Math.max(40, basePlatformWidth - state.level * 4 - difficulty * 26 + bananaBonus);
}

function getPlatformGap() {
  const difficulty = getRunDifficulty();
  const bananaRelief = isBananaActive() ? 10 : 0;
  return Math.min(154, basePlatformGap + state.level * 5 + difficulty * 24 - bananaRelief);
}

function getJumpVelocity() {
  const difficulty = getRunDifficulty();
  let jump = baseJumpVelocity - Math.min(1.2, (state.level - 1) * 0.1) - difficulty * 0.65;
  if (isFrogActive()) {
    jump -= 1.6;
  }
  if (isBananaActive()) {
    jump -= 0.6;
  }
  return jump;
}

function getGravity(vy) {
  const difficulty = getRunDifficulty();
  const bananaShift = isBananaActive() ? -0.03 : 0;

  if (vy < -7) return 0.22 + difficulty * 0.015 + bananaShift;
  if (vy < -2) return 0.18 + difficulty * 0.02 + bananaShift;
  if (vy < 1.2) return 0.12 + difficulty * 0.02 + bananaShift;
  if (vy < 6) return 0.27 + difficulty * 0.025;
  return 0.34 + difficulty * 0.03;
}

function addFloatingText(text, x, y, color, life = 50) {
  state.floatingTexts.push({ text, x, y, color, life, maxLife: life });
}

function maybeCreateCollectible(platform) {
  if (Math.random() > 0.4) {
    return;
  }

  state.collectibles.push({
    type: "coin",
    x: platform.x + platform.w / 2,
    y: platform.y - rand(34, 58),
    r: 10,
    value: 1,
    collected: false
  });

  const difficulty = getRunDifficulty();
  const powerupChance = 0.06 + difficulty * 0.08;
  if (Math.random() < powerupChance) {
    const type = Math.random() < 0.5 ? "disco" : "jetpack";
    state.collectibles.push({
      type,
      x: platform.x + platform.w / 2 + rand(-18, 18),
      y: platform.y - rand(56, 86),
      r: 12,
      collected: false
    });
  }
}

function createPlatform(y, guaranteedCenter = false, previousPlatform = null) {
  const platformWidth = getPlatformWidth();
  const difficulty = getRunDifficulty();
  const movingChance = guaranteedCenter ? 0 : clamp((difficulty - 0.05) * 0.58, 0, 0.55);
  const crackedChance = guaranteedCenter ? 0 : clamp((difficulty - 0.2) * 0.34, 0, 0.3);
  const maxOffset = 80 + difficulty * 42;

  let x;
  if (guaranteedCenter || !previousPlatform) {
    x = width / 2 - platformWidth / 2;
  } else {
    x = previousPlatform.x + rand(-maxOffset, maxOffset);
    x = clamp(x, 18, width - platformWidth - 18);
  }

  const platform = {
    x,
    y,
    w: platformWidth,
    h: platformHeight,
    vx: Math.random() < movingChance ? rand(0.3, 0.65 + difficulty * 0.3) * (Math.random() < 0.5 ? -1 : 1) : 0,
    cracked: Math.random() < crackedChance,
    broken: false
  };

  maybeCreateCollectible(platform);
  return platform;
}

function createObstacle() {
  return {
    x: width + rand(40, 90),
    y: runnerGroundY,
    w: rand(30, 48),
    h: rand(34, 60)
  };
}

function resetRunnerState() {
  state.runner.distance = 0;
  state.runner.nextObstacleAt = 220;
  state.runner.portalDistance = 980;
  state.runner.obstacles = [];
  state.runner.portal = null;
  state.runner.dashUntil = 0;
  state.runner.obstacleCooldownUntil = 0;
  state.runner.speed = 6.3 + state.level * 0.28;
  state.runner.backgroundOffset = 0;
  state.runner.jumpQueued = false;
  state.runner.dashQueued = false;
}

function enterRunnerMode() {
  state.mode = "runner";
  state.effects.discoUntil = 0;
  state.effects.jetpackUntil = 0;
  resetRunnerState();
  state.player.x = 84;
  state.player.y = runnerGroundY - state.player.h;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.bounceSquash = 0;
  addFloatingText("PORTAL RUN!", width / 2, state.cameraY + 220, "#00d1ff", 72);
}

function rebuildJumperWorld(baseY) {
  state.platforms = [];
  state.collectibles = [];

  let previousPlatform = null;
  for (let i = 0; i < 7; i += 1) {
    const platform = createPlatform(baseY - i * getPlatformGap(), i === 0, previousPlatform);
    state.platforms.push(platform);
    previousPlatform = platform;
  }
}

function exitRunnerMode(success) {
  state.mode = "jumper";
  state.heightScore = Math.max(0, state.heightScore + (success ? runnerBonusScore : -runnerCrashPenalty));
  state.cameraY = -state.heightScore * 10;

  const baseY = state.cameraY + height - 104;
  rebuildJumperWorld(baseY);

  state.player.x = width / 2 - state.player.w / 2;
  state.player.y = baseY - state.player.h - 12;
  state.player.vx = 0;
  state.player.vy = success ? getJumpVelocity() - 1.2 : getJumpVelocity() * 0.72;
  state.player.bounceSquash = 0.9;

  state.runner.completed = success;
  addFloatingText(success ? "PORTAL BOOST!" : "SMELL!", width / 2, state.cameraY + 200, success ? "#00d1ff" : "#ff6b6b", 70);
  updateHud();
}
function updatePlatforms() {
  for (const platform of state.platforms) {
    if (!platform.vx || platform.broken) {
      continue;
    }

    platform.x += platform.vx;
    if (platform.x <= 12 || platform.x + platform.w >= width - 12) {
      platform.vx *= -1;
      platform.x = clamp(platform.x, 12, width - platform.w - 12);
    }
  }
}

function resetSkillState() {
  const selected = state.progression.selectedSkill;
  state.skillState = {
    selected,
    extraLifeUsed: false,
    frogUntil: selected === "frog_hop" ? 9000 : 0,
    speedUntil: selected === "superspeed" ? 10000 : 0,
    bananaTriggered: false,
    bananaPulseUntil: 0
  };
}

function resetGame() {
  state.mode = "jumper";
  state.cameraY = 0;
  state.heightScore = 0;
  state.coins = 0;
  state.level = 1;
  state.scoreSubmitted = false;
  state.accumulator = 0;
  state.elapsedMs = 0;
  state.effects.discoUntil = 0;
  state.effects.jetpackUntil = 0;
  state.effects.bananaUntil = 0;
  state.floatingTexts = [];
  state.runner.triggered = false;
  state.runner.completed = false;
  resetRunnerState();
  resetSkillState();

  state.player = {
    x: width / 2 - 22,
    y: height - 160,
    w: 44,
    h: 48,
    vx: 0,
    vy: 0,
    bounceSquash: 0
  };

  rebuildJumperWorld(height - 90);
  updateHud();
}

function updateHud() {
  scoreEl.textContent = `${Math.floor(state.heightScore)} m`;
  coinsEl.textContent = `${state.coins} / ${coinsPerLevel}`;
  levelEl.textContent = `${state.level}`;
  bestEl.textContent = `${Math.floor(state.bestScore)} m`;
  updateProfileBar();
}

function levelUp() {
  state.level += 1;
  state.coins = 0;
  addFloatingText(`LEVEL ${state.level}!`, width / 2, state.cameraY + 220, "#ff5f6d", 60);
  updateHud();
}

function spawnPlatforms() {
  let topPlatform = state.platforms.reduce((top, platform) => (platform.y < top.y ? platform : top), state.platforms[0]);

  while (topPlatform.y > state.cameraY - 120) {
    const nextY = topPlatform.y - getPlatformGap();
    const nextPlatform = createPlatform(nextY, false, topPlatform);
    state.platforms.push(nextPlatform);
    topPlatform = nextPlatform;
  }

  state.platforms = state.platforms.filter((platform) => !platform.broken && platform.y < state.cameraY + height + 120);
  state.collectibles = state.collectibles.filter((item) => !item.collected && item.y < state.cameraY + height + 180);
}

function updateMagnetizedPickups() {
  if (!isBananaActive()) {
    return;
  }

  const playerCenterX = state.player.x + state.player.w / 2;
  const playerCenterY = state.player.y + state.player.h / 2;

  for (const item of state.collectibles) {
    if (item.collected || item.type !== "coin") {
      continue;
    }

    const dx = playerCenterX - item.x;
    const dy = playerCenterY - item.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 130) {
      continue;
    }

    item.x += dx * 0.08;
    item.y += dy * 0.08;
  }
}

function collectPickups() {
  const player = state.player;

  for (const item of state.collectibles) {
    if (item.collected) {
      continue;
    }

    const dx = player.x + player.w / 2 - item.x;
    const dy = player.y + player.h / 2 - item.y;
    if ((dx * dx) + (dy * dy) < 24 * 24) {
      item.collected = true;

      if (item.type === "coin") {
        const bonus = isDiscoActive() ? 2 : 1;
        state.coins += bonus;
        state.progression.bankCoins += bonus;
        saveProgression();
        updateProfileBar();
        addFloatingText(`+${bonus}`, item.x, item.y, "#f9b208");
        if (state.coins >= coinsPerLevel) {
          levelUp();
        } else {
          updateHud();
        }
      }

      if (item.type === "disco") {
        activateDisco();
      }

      if (item.type === "jetpack") {
        activateJetpack();
      }
    }
  }
}

function updateFloatingTexts() {
  state.floatingTexts = state.floatingTexts.filter((item) => {
    item.y -= 0.6;
    item.life -= 1;
    return item.life > 0;
  });
}

function finishRun() {
  state.running = false;
  showGameOverOverlay();
}

function getMoveIntent() {
  return (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
}

function reviveFromFall() {
  if (state.progression.selectedSkill !== "extra_life" || state.skillState.extraLifeUsed) {
    return false;
  }

  state.skillState.extraLifeUsed = true;
  const rescuePlatformY = state.cameraY + height - 160;
  const rescuePlatform = createPlatform(rescuePlatformY, true, null);
  rescuePlatform.cracked = false;
  rescuePlatform.vx = 0;
  state.platforms.push(rescuePlatform);
  state.player.x = width / 2 - state.player.w / 2;
  state.player.y = rescuePlatformY - state.player.h - 10;
  state.player.vx = 0;
  state.player.vy = getJumpVelocity() - 0.8;
  state.player.bounceSquash = 1;
  addFloatingText("EKSTRALIV!", width / 2, state.cameraY + 220, "#7cff95", 70);
  return true;
}

function updateJumperPlayer() {
  const player = state.player;
  const difficulty = getRunDifficulty();
  const moveIntent = getMoveIntent();
  const airAcceleration = 0.36 + difficulty * 0.08 + (isSpeedSkillActive() ? 0.11 : 0) + (isBananaActive() ? 0.06 : 0);
  const maxMoveSpeed = moveSpeed + difficulty * 0.62 + (isSpeedSkillActive() ? 1.15 : 0) + (isBananaActive() ? 0.45 : 0);

  player.bounceSquash *= 0.84;

  if (Math.abs(moveIntent) > 0.04) {
    player.vx += moveIntent * airAcceleration;
  } else {
    player.vx *= 0.84;
  }

  if (isJetpackActive()) {
    player.vy = Math.min(player.vy, -11.5);
  }

  if (state.progression.selectedSkill === "banana" && !state.skillState.bananaTriggered && state.heightScore >= 900) {
    activateBananaSurprise();
  }

  player.vy += getGravity(player.vy);
  player.vx = clamp(player.vx, -maxMoveSpeed, maxMoveSpeed);
  player.x += player.vx;
  player.y += player.vy;

  if (player.x + player.w < 0) {
    player.x = width;
  } else if (player.x > width) {
    player.x = -player.w;
  }

  for (const platform of state.platforms) {
    if (platform.broken) {
      continue;
    }

    const wasAbove = player.y + player.h - player.vy <= platform.y;
    const touchingX = player.x + player.w > platform.x && player.x < platform.x + platform.w;
    const touchingY = player.y + player.h >= platform.y && player.y + player.h <= platform.y + platform.h + 12;

    if (player.vy > 0 && wasAbove && touchingX && touchingY) {
      player.y = platform.y - player.h;
      player.vy = getJumpVelocity();
      player.bounceSquash = 1;

      if (platform.vx) {
        player.x += platform.vx * 0.6;
      }

      if (platform.cracked) {
        platform.broken = true;
        addFloatingText("KNAKK!", platform.x + platform.w / 2, platform.y - 8, "#ff6b6b", 34);
      }
      break;
    }
  }

  updateMagnetizedPickups();
  collectPickups();

  const targetCamera = Math.min(state.cameraY, player.y - 260);
  if (targetCamera < state.cameraY) {
    state.cameraY = targetCamera;
    state.heightScore = Math.max(state.heightScore, Math.abs(state.cameraY) / 10);
    if (state.heightScore > state.bestScore) {
      state.bestScore = state.heightScore;
      localStorage.setItem(bestScoreKey, String(Math.floor(state.bestScore)));
      unlockBananaIfNeeded(state.bestScore);
    }
    updateHud();
  }

  if (!state.runner.triggered && state.heightScore >= runnerTriggerScore) {
    state.runner.triggered = true;
    enterRunnerMode();
    return;
  }

  if (player.y - state.cameraY > height + 140) {
    if (!reviveFromFall()) {
      finishRun();
    }
  }
}

function updateRunnerPlayer() {
  const player = state.player;
  const runner = state.runner;
  const dashActive = isRunnerDashActive();
  const speed = runner.speed + (dashActive ? 2.1 : 0) + Math.min(2.4, state.level * 0.22);

  runner.distance += speed;
  runner.backgroundOffset += speed;

  if (runner.jumpQueued) {
    if (player.y >= runnerGroundY - player.h - 0.5) {
      player.vy = -10.8;
      player.bounceSquash = 0.6;
    }
    runner.jumpQueued = false;
  }

  if (runner.dashQueued) {
    runner.dashUntil = state.elapsedMs + runnerDashDurationMs;
    runner.dashQueued = false;
  }

  player.vy += 0.58;
  player.y += player.vy;
  player.x = dashActive ? 132 : 92;
  player.bounceSquash *= 0.85;

  if (player.y > runnerGroundY - player.h) {
    player.y = runnerGroundY - player.h;
    player.vy = 0;
  }

  if (!runner.portal && runner.distance >= runner.portalDistance) {
    runner.portal = { x: width + 80, y: runnerGroundY - 92, w: 54, h: 92 };
    addFloatingText("PORTAL!", width / 2, runnerGroundY - 120, "#00d1ff", 42);
    clearTouchInput();
  }

  if (!runner.portal && runner.distance >= runner.nextObstacleAt) {
    runner.obstacles.push(createObstacle());
    runner.nextObstacleAt += rand(180, 280);
  }

  for (const obstacle of runner.obstacles) {
    obstacle.x -= speed;
  }
  runner.obstacles = runner.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -40);

  if (runner.portal) {
    runner.portal.x -= speed;
  }

  const playerBox = { x: player.x + 6, y: player.y + 6, w: player.w - 12, h: player.h - 6 };

  if (runner.portal) {
    const portalHit = playerBox.x < runner.portal.x + runner.portal.w &&
      playerBox.x + playerBox.w > runner.portal.x &&
      playerBox.y < runner.portal.y + runner.portal.h &&
      playerBox.y + playerBox.h > runner.portal.y;

    if (portalHit) {
      exitRunnerMode(true);
      return;
    }
  }

  if (state.elapsedMs > runner.obstacleCooldownUntil) {
    for (const obstacle of runner.obstacles) {
      const hit = playerBox.x < obstacle.x + obstacle.w &&
        playerBox.x + playerBox.w > obstacle.x &&
        playerBox.y < obstacle.y &&
        playerBox.y + playerBox.h > obstacle.y - obstacle.h;

      if (!hit) {
        continue;
      }

      if (dashActive) {
        addFloatingText("SMASH!", obstacle.x, obstacle.y - obstacle.h, "#ffd166", 28);
        obstacle.x = -200;
      } else {
        runner.obstacleCooldownUntil = state.elapsedMs + 700;
        exitRunnerMode(false);
      }
      break;
    }
  }
}

function stepSimulation() {
  state.elapsedMs += fixedStepMs;
  updateFloatingTexts();

  if (!state.running) {
    return;
  }

  if (state.mode === "runner") {
    updateRunnerPlayer();
    return;
  }

  updatePlatforms();
  updateJumperPlayer();
  spawnPlatforms();
}
function drawBackground() {
  ctx.clearRect(0, 0, width, height);
  const mapTheme = getSelectedMap().theme;

  if (state.mode === "runner") {
    const offset = state.runner.backgroundOffset;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, mapTheme.runnerTop);
    gradient.addColorStop(0.6, mapTheme.runnerMid);
    gradient.addColorStop(1, mapTheme.runnerBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < (lowFxMode ? 4 : 8); i += 1) {
      const x = ((i * 80) - (offset * 0.3)) % (width + 100) - 50;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x, 70 + (i % 3) * 36, 46, 14);
    }

    ctx.fillStyle = "#283618";
    ctx.fillRect(0, runnerGroundY, width, height - runnerGroundY);
    ctx.fillStyle = "#606c38";
    for (let i = 0; i < 18; i += 1) {
      const x = ((i * 30) - offset) % (width + 30) - 30;
      ctx.fillRect(x, runnerGroundY + 6, 16, 4);
    }
    return;
  }

  const difficulty = getRunDifficulty();
  const disco = isDiscoActive();
  const pulse = disco ? (Math.sin(state.elapsedMs / 120) + 1) * 0.5 : 0;
  const tint = Math.floor(difficulty * 50 + pulse * 80);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, disco ? `rgb(${180 + Math.floor(pulse * 60)}, ${110 + tint}, 255)` : mapTheme.top);
  gradient.addColorStop(0.55, disco ? `rgb(${255 - Math.floor(pulse * 80)}, ${235 - Math.floor(pulse * 30)}, 255)` : mapTheme.mid);
  gradient.addColorStop(1, disco ? `rgb(255, ${215 + Math.floor(pulse * 30)}, ${170 + Math.floor(pulse * 40)})` : mapTheme.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (disco) {
    for (let i = 0; i < (lowFxMode ? 4 : 8); i += 1) {
      ctx.fillStyle = `hsla(${(state.elapsedMs / 8 + i * 45) % 360}, 90%, 65%, 0.12)`;
      ctx.beginPath();
      ctx.moveTo(width / 2, 140);
      ctx.lineTo((i / 7) * width, 0);
      ctx.lineTo(((i + 1) / 7) * width, 0);
      ctx.fill();
    }
  }

  for (let i = 0; i < (lowFxMode ? 4 : 6); i += 1) {
    const cloudX = (i * 90 + (state.cameraY * -0.08)) % (width + 120) - 60;
    const cloudY = 60 + i * 90;
    ctx.fillStyle = mapTheme.cloud;
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, 24, 0, Math.PI * 2);
    ctx.arc(cloudX + 22, cloudY + 8, 18, 0, Math.PI * 2);
    ctx.arc(cloudX - 22, cloudY + 10, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  if (state.mode === "runner") {
    return;
  }

  const mapId = getSelectedMap().id;
  const movingColor = mapId === "frost" ? "#5b8cff" : mapId === "sunset" ? "#7a3fff" : "#8a4fff";
  const staticColor = mapId === "frost" ? "#4c8bb5" : mapId === "sunset" ? "#9f5a2f" : state.level % 2 === 0 ? "#3d5f9b" : "#3d9b53";
  const glowColor = mapId === "frost" ? "#cde8ff" : mapId === "sunset" ? "#ffd8b1" : state.level % 2 === 0 ? "#8fb1ff" : "#7ad08e";

  for (const platform of state.platforms) {
    const screenY = platform.y - state.cameraY;
    ctx.fillStyle = platform.cracked ? "#8d6f64" : platform.vx ? movingColor : staticColor;
    ctx.fillRect(platform.x, screenY, platform.w, platform.h);
    ctx.fillStyle = platform.cracked ? "#d8c0b1" : glowColor;
    ctx.fillRect(platform.x + 4, screenY + 3, platform.w - 8, 4);

    if (platform.cracked) {
      ctx.strokeStyle = "#5a3b32";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(platform.x + 10, screenY + 2);
      ctx.lineTo(platform.x + platform.w / 2, screenY + 10);
      ctx.lineTo(platform.x + platform.w - 12, screenY + 3);
      ctx.stroke();
    }
  }
}

function drawCollectibles() {
  if (state.mode === "runner") {
    for (const obstacle of state.runner.obstacles) {
      ctx.fillStyle = "#bc4749";
      ctx.fillRect(obstacle.x, obstacle.y - obstacle.h, obstacle.w, obstacle.h);
      ctx.fillStyle = "#f28482";
      ctx.fillRect(obstacle.x + 6, obstacle.y - obstacle.h + 8, obstacle.w - 12, 8);
    }

    if (state.runner.portal) {
      const portal = state.runner.portal;
      const pulse = 1 + Math.sin(state.elapsedMs / 90) * 0.06;
      ctx.save();
      ctx.translate(portal.x + portal.w / 2, portal.y + portal.h / 2);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = "#00d1ff";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, portal.w / 2, portal.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, portal.w / 2 - 8, portal.h / 2 - 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  for (const item of state.collectibles) {
    const screenY = item.y - state.cameraY;
    const pulse = 1 + Math.sin((state.elapsedMs / 120) + item.y * 0.02) * 0.08;

    if (item.type === "coin") {
      ctx.fillStyle = isBananaActive() ? "#ffe066" : "#f9b208";
      ctx.beginPath();
      ctx.arc(item.x, screenY, item.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff3bf";
      ctx.beginPath();
      ctx.arc(item.x - 2, screenY - 2, item.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    if (item.type === "disco") {
      ctx.save();
      ctx.translate(item.x, screenY);
      ctx.rotate(state.elapsedMs / 260);
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = `hsl(${(state.elapsedMs / 6 + i * 90) % 360}, 90%, 65%)`;
        ctx.fillRect(-4, -14, 8, 28);
        ctx.rotate(Math.PI / 4);
      }
      ctx.restore();
      continue;
    }

    if (item.type === "jetpack") {
      ctx.fillStyle = "#ff8c42";
      ctx.fillRect(item.x - 10, screenY - 12, 20, 24);
      ctx.fillStyle = "#4f5d75";
      ctx.fillRect(item.x - 6, screenY - 8, 4, 16);
      ctx.fillRect(item.x + 2, screenY - 8, 4, 16);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.moveTo(item.x - 5, screenY + 12);
      ctx.lineTo(item.x, screenY + 22 + Math.sin(state.elapsedMs / 60) * 3);
      ctx.lineTo(item.x + 5, screenY + 12);
      ctx.fill();
    }
  }
}

function drawFloatingTexts() {
  ctx.font = "bold 20px Trebuchet MS";
  ctx.textAlign = "center";

  for (const item of state.floatingTexts) {
    const alpha = item.life / (item.maxLife || 50);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = item.color;
    const offsetY = state.mode === "runner" ? 0 : state.cameraY;
    ctx.fillText(item.text, item.x, item.y - offsetY);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "start";
}

function drawPlayer() {
  const player = state.player;
  const skin = getSelectedSkin();
  const screenX = player.x;
  const screenY = state.mode === "runner" ? player.y : player.y - state.cameraY;
  const squash = 1 + player.bounceSquash * 0.12;
  const stretch = 1 - player.bounceSquash * 0.08;
  const bodyW = player.w * squash;
  const bodyH = player.h * stretch;
  const bodyX = screenX - (bodyW - player.w) / 2;
  const bodyY = screenY + (player.h - bodyH);
  const disco = isDiscoActive();

  if (isJetpackActive() && state.mode !== "runner") {
    ctx.fillStyle = "rgba(255,140,66,0.55)";
    ctx.beginPath();
    ctx.moveTo(screenX + player.w * 0.28, screenY + player.h);
    ctx.lineTo(screenX + player.w * 0.18, screenY + player.h + 20 + Math.sin(state.elapsedMs / 40) * 4);
    ctx.lineTo(screenX + player.w * 0.38, screenY + player.h + 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(screenX + player.w * 0.72, screenY + player.h);
    ctx.lineTo(screenX + player.w * 0.62, screenY + player.h + 20 + Math.sin(state.elapsedMs / 40 + 1) * 4);
    ctx.lineTo(screenX + player.w * 0.82, screenY + player.h + 12);
    ctx.fill();
  }

  if (state.mode === "runner" && isRunnerDashActive()) {
    ctx.fillStyle = "rgba(0,209,255,0.22)";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(screenX - (i + 1) * 18, screenY + 16, 18, 12);
    }
  }

  ctx.fillStyle = disco ? `hsl(${(state.elapsedMs / 6) % 360}, 80%, 52%)` : skin.colors.body;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY + 8, bodyW, bodyH - 8, 16);
  ctx.fill();

  ctx.fillStyle = skin.id === "melon" ? "#2f6f36" : skin.id === "robot" ? "#d7dee9" : skin.id === "toast" ? "#f4d4a5" : "#ffd7a8";
  ctx.beginPath();
  ctx.arc(screenX + player.w / 2, bodyY + 14, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.colors.accent;
  ctx.beginPath();
  ctx.roundRect(screenX + 7, bodyY + 8, player.w - 14, 10, 6);
  ctx.fill();
  ctx.fillStyle = skin.colors.visor;
  ctx.beginPath();
  ctx.arc(screenX + 16, bodyY + 13, 4.2, 0, Math.PI * 2);
  ctx.arc(screenX + player.w - 16, bodyY + 13, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = skin.colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screenX + 18, bodyY + 17);
  ctx.quadraticCurveTo(screenX + player.w / 2, bodyY + 21, screenX + player.w - 18, bodyY + 17);
  ctx.stroke();

  ctx.fillStyle = disco ? "#ff4fd8" : skin.colors.cape;
  ctx.beginPath();
  ctx.moveTo(screenX + 5, bodyY + 24);
  ctx.lineTo(screenX + player.w - 5, bodyY + 22);
  ctx.lineTo(screenX + player.w - 8, bodyY + 30);
  ctx.lineTo(screenX + 8, bodyY + 32);
  ctx.fill();

  if (skin.id === "robot") {
    ctx.fillStyle = "rgba(0, 209, 255, 0.4)";
    ctx.fillRect(screenX + 18, bodyY + 2, 8, 10);
  }
  if (skin.id === "toast") {
    ctx.strokeStyle = "#6b3e26";
    ctx.lineWidth = 3;
    ctx.strokeRect(bodyX + 2, bodyY + 10, bodyW - 4, bodyH - 16);
  }
  if (skin.id === "melon") {
    ctx.fillStyle = "#0c5f29";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(screenX + 10 + i * 8, bodyY + 28, 3, 10);
    }
  }

  ctx.strokeStyle = skin.colors.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screenX + 12, bodyY + bodyH - 2);
  ctx.lineTo(screenX + 10, bodyY + bodyH + 9);
  ctx.moveTo(screenX + player.w - 12, bodyY + bodyH - 2);
  ctx.lineTo(screenX + player.w - 10, bodyY + bodyH + 9);
  ctx.stroke();
}

function drawRunnerUi() {
  if (state.mode !== "runner") {
    return;
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
  ctx.fillRect(14, 14, 170, 46);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Trebuchet MS";
  ctx.fillText(`Portal: ${Math.max(0, Math.floor((state.runner.portalDistance - state.runner.distance) / 10))} m`, 24, 42);
}

function drawFrame() {
  drawBackground();
  drawPlatforms();
  drawCollectibles();
  drawPlayer();
  drawFloatingTexts();
  drawRunnerUi();
}
function loop(timestamp) {
  if (!state.lastFrameTime) {
    state.lastFrameTime = timestamp;
  }

  const frameDelta = Math.min(maxFrameDeltaMs, timestamp - state.lastFrameTime);
  state.lastFrameTime = timestamp;
  state.accumulator += frameDelta;

  updateMusic();

  let updates = 0;
  while (state.accumulator >= fixedStepMs && updates < maxUpdatesPerFrame) {
    stepSimulation();
    state.accumulator -= fixedStepMs;
    updates += 1;
  }

  if (updates === maxUpdatesPerFrame) {
    state.accumulator = 0;
  }

  drawFrame();
  requestAnimationFrame(loop);
}

function startGame() {
  ensureMusic();
  resetGame();
  state.running = true;
  state.lastFrameTime = 0;
  clearTouchInput();
  scoreEntryEl.classList.add("hidden");
  leaderboardPanelEl.classList.add("hidden");
  setOverlay("", "", false);
  state.player.vy = getJumpVelocity();

  if (state.progression.selectedSkill === "frog_hop") {
    addFloatingText("FROSKEHOPP!", width / 2, state.cameraY + 220, "#7cff95", 65);
  }
  if (state.progression.selectedSkill === "superspeed") {
    addFloatingText("SUPERSPEED!", width / 2, state.cameraY + 220, "#7dd3fc", 65);
  }
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height
  };
}

function setKeyboardInput(direction, isPressed) {
  state.keys[direction] = isPressed;
}

function applyTouchSwipe(x, timeStamp) {
  const dx = x - state.touch.lastX;
  const dt = Math.max(8, timeStamp - state.touch.lastTime);

  state.touch.lastX = x;
  state.touch.lastTime = timeStamp;

  if (Math.abs(dx) < 2 || !state.player) {
    return;
  }

  const impulse = clamp((dx / dt) * 1.25, -1.85, 1.85);
  state.player.vx += impulse + Math.sign(impulse) * 0.06;
}

function clearTouchInput() {
  state.touch.active = false;
  state.touch.pointerId = null;
  state.touch.startX = 0;
  state.touch.lastX = 0;
  state.touch.lastTime = 0;
}

function handleRunnerTap(pointX) {
  if (pointX < width / 2) {
    state.runner.jumpQueued = true;
  } else {
    state.runner.dashQueued = true;
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", " ", "Spacebar", "Enter"].includes(event.key)) {
    event.preventDefault();
  }

  ensureMusic();

  if (state.mode === "runner") {
    if (["ArrowLeft", "a", "A", " ", "Spacebar", "Enter"].includes(event.key)) {
      state.runner.jumpQueued = true;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      state.runner.dashQueued = true;
    }
    if (!state.running && (event.key === " " || event.key === "Spacebar" || event.key === "Enter")) {
      startGame();
    }
    return;
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    setKeyboardInput("left", true);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    setKeyboardInput("right", true);
  }
  if (!state.running && (event.key === " " || event.key === "Spacebar" || event.key === "Enter")) {
    startGame();
  }
});

window.addEventListener("keyup", (event) => {
  if (state.mode === "runner") {
    return;
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    setKeyboardInput("left", false);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    setKeyboardInput("right", false);
  }
});

for (const element of [document.body, canvas]) {
  element.addEventListener("touchmove", (event) => {
    if (event.target.closest(".panel")) {
      return;
    }
    event.preventDefault();
  }, { passive: false });
}

overlayEl.addEventListener("touchmove", (event) => {
  if (!event.target.closest(".panel")) {
    event.preventDefault();
  }
}, { passive: false });

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  ensureMusic();

  if (!state.running) {
    startGame();
    return;
  }

  const point = getCanvasPoint(event);

  if (state.mode === "runner") {
    handleRunnerTap(point.x);
    return;
  }

  if (!isCoarsePointer && event.pointerType === "mouse") {
    return;
  }

  state.touch.active = true;
  state.touch.pointerId = event.pointerId;
  state.touch.startX = point.x;
  state.touch.lastX = point.x;
  state.touch.lastTime = event.timeStamp;
  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.touch.active || state.touch.pointerId !== event.pointerId || state.mode !== "jumper") {
    return;
  }
  const point = getCanvasPoint(event);
  applyTouchSwipe(point.x, event.timeStamp);
});

const releasePointer = (event) => {
  if (state.touch.pointerId !== null && event.pointerId !== undefined && state.touch.pointerId !== event.pointerId) {
    return;
  }
  clearTouchInput();
};

canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("lostpointercapture", releasePointer);

overlayEl.addEventListener("click", (event) => {
  const categoryButton = event.target.closest(".shop-category");
  if (categoryButton) {
    setShopCategory(categoryButton.dataset.category);
    return;
  }

  const button = event.target.closest(".shop-button");
  if (!button) {
    return;
  }

  const kind = button.dataset.kind;
  const id = button.dataset.id;
  if (!kind || !id) {
    return;
  }

  purchase(kind, id);
});

actionEl.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  startGame();
});
saveScoreEl.addEventListener("click", submitScore);

playerNameEl.value = localStorage.getItem(playerNameKey) || "";
playerNameEl.addEventListener("input", () => {
  const cleanName = sanitizeName(playerNameEl.value);
  if (playerNameEl.value !== cleanName) {
    playerNameEl.value = cleanName;
  }
  localStorage.setItem(playerNameKey, cleanName);
});

state.progression = loadProgression();
applyBodyTheme();
resetGame();
showStartOverlay();
updateHud();
renderShop();
fetchLeaderboard();
requestAnimationFrame(loop);







