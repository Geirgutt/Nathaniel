const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const levelEl = document.getElementById("level");
const comboEl = document.getElementById("combo");
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
const skinsSectionEl = document.getElementById("skinsSection");
const mapsSectionEl = document.getElementById("mapsSection");
const skillsSectionEl = document.getElementById("skillsSection");
const shopCategoryEls = Array.from(document.querySelectorAll(".shop-category"));
const pauseMenuBtnEl = document.getElementById("pauseMenuBtn");
const settingsPanelEl = document.getElementById("settingsPanel");
const settingsResumeEl = document.getElementById("settingsResume");
const controlModeSwipeEl = document.getElementById("controlModeSwipe");
const controlModeButtonsEl = document.getElementById("controlModeButtons");
const touchButtonsEl = document.getElementById("touchButtons");
const touchLeftBtnEl = document.getElementById("touchLeftBtn");
const touchRightBtnEl = document.getElementById("touchRightBtn");

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
const runnerIntervalScore = 1000;
const runnerBonusScore = 180;
const runnerCrashPenalty = 120;
const runnerGroundY = height - 118;
const runnerPlayerX = 72;
const runnerFailCoinPenalty = 3;
const saveVersion = "1.0";
const storageKey = (name) => `hopp-hoyest-${name}-v${saveVersion}`;
const bestScoreKey = storageKey("best");
const playerNameKey = "hopp-hoyest-player-name";
const localLeaderboardKey = storageKey("local-leaderboard");
const controlModeKey = "hopp-hoyest-control-mode";
const controlSpeedBase = 1.8;
const buttonSpeedScale = 0.75;
const swipeSpeedScale = 1.0;
const progressionKey = storageKey("progression");
const coinsPerLevel = 12;
const leaderboardLimit = 10;
const discoDurationMs = 8000;
const jetpackDurationMs = 900;
const rushDurationMs = 2200;
const runnerDuckDurationMs = 520;
const mapGoalHeight = 5000;
const comboDecayMs = 2200;
const comboStepSize = 3;
const comboMaxMultiplier = 6;
const secretRoomTriggerScore = 500;
const secretRoomReward = 500;
const coinDashFirstTriggerScore = 1500;
const coinDashIntervalScore = 2000;
const coinDashDurationMs = 8500;
const phaseCycleMs = 1380;
const phaseVisibleMs = 880;
const phaseSpawnGraceMs = 720;
const fireworksDurationMs = 2800;
const supabaseConfig = window.SUPABASE_CONFIG || { url: "", publishableKey: "", table: "scores" };
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const lowFxMode = isCoarsePointer;

const skins = {
  starter: {
    id: "starter",
    name: "Sky Kid",
    description: "Klassisk helt med r\u00f8d kappe.",
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
  },
  ghost: {
    id: "ghost",
    name: "Skysp\u00f8k",
    description: "Et smilende laken med null respekt for fysikk.",
    cost: 120,
    colors: { body: "#eaf4ff", cape: "#9ad1ff", visor: "#fefefe", accent: "#6b7fa3" }
  },
  duck: {
    id: "duck",
    name: "Captain Quack",
    description: "En and med altfor h\u00f8y selvtillit.",
    cost: 135,
    colors: { body: "#ffd23f", cape: "#ff6b6b", visor: "#fff7cc", accent: "#7a4e00" }
  },
  disco: {
    id: "disco",
    name: "Disco Comet",
    description: "Ren glitterpanikk i spillerform.",
    cost: 150,
    colors: { body: "#ff4fd8", cape: "#7c3aed", visor: "#a7f3d0", accent: "#3b0764" }
  },
  ninja: {
    id: "ninja",
    name: "Nattnudel",
    description: "M\u00f8rk, dramatisk og litt for stolt.",
    cost: 165,
    colors: { body: "#1f2937", cape: "#ef4444", visor: "#fde68a", accent: "#030712" }
  },
  banana_orange: {
    id: "banana_orange",
    name: "Bananmann med Appelsinhatt",
    description: "Akkurat s\u00e5 dumt som det burde v\u00e6re.",
    cost: 190,
    colors: { body: "#f4d03f", cape: "#ff7b00", visor: "#fff4b8", accent: "#8d5a00" }
  },
  shrimp_king: {
    id: "shrimp_king",
    name: "Rekekongen",
    description: "Kongelig skalldyr med null brems.",
    cost: 210,
    colors: { body: "#ff8b94", cape: "#ffd166", visor: "#fff1f2", accent: "#8c2f39" }
  },
  potato_cowboy: {
    id: "potato_cowboy",
    name: "Potet-Cowboy",
    description: "Rir inn i solnedgangen uten hest.",
    cost: 240,
    colors: { body: "#b08968", cape: "#6d4c41", visor: "#fef3c7", accent: "#4e342e" }
  },
  sausage_wizard: {
    id: "sausage_wizard",
    name: "P\u00f8lse-trollmann",
    description: "Kaster grillmagi og d\u00e5rlig d\u00f8mmekraft.",
    cost: 275,
    colors: { body: "#d97757", cape: "#fbbf24", visor: "#fff7d6", accent: "#7c2d12" }
  },
  cone_lord: {
    id: "cone_lord",
    name: "Kjeglefyr Deluxe",
    description: "Halv helt, halv veiarbeid.",
    cost: 310,
    colors: { body: "#ff7a00", cape: "#1f2937", visor: "#fff3c4", accent: "#7c2d12" }
  },
  grandma_turbo: {
    id: "grandma_turbo",
    name: "Bestemor Turbo",
    description: "Strikker i 300 km/t og nekter \u00e5 roe ned.",
    cost: 345,
    colors: { body: "#d8b4fe", cape: "#f472b6", visor: "#fdf2f8", accent: "#6b21a8" }
  },
  mop_dj: {
    id: "mop_dj",
    name: "DJ Mopp",
    description: "Vasker gulvet med konkurransen.",
    cost: 380,
    colors: { body: "#7dd3fc", cape: "#14b8a6", visor: "#ecfeff", accent: "#164e63" }
  },
  cheese_prophet: {
    id: "cheese_prophet",
    name: "Osteorakelet",
    description: "Ser fremtiden i hullost og overdriver alt.",
    cost: 420,
    colors: { body: "#facc15", cape: "#fb7185", visor: "#fff9c4", accent: "#854d0e" }
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
    description: "Hvert 3. hopp blir et kraftig boost.",
    cost: 85
  },
  superspeed: {
    id: "superspeed",
    name: "Superspeed",
    description: "Kvassere styring og h\u00f8yere toppfart en stund.",
    cost: 95
  },
  magnet: {
    id: "magnet",
    name: "Myntmagnet",
    description: "Mynter trekkes mot deg hele runden.",
    cost: 90
  },
  moon_boots: {
    id: "moon_boots",
    name: "M\u00e5nest\u00f8vler",
    description: "Litt mykere tyngdekraft og mer svev.",
    cost: 100
  },
  lucky_cat: {
    id: "lucky_cat",
    name: "Lucky Cat",
    description: "Noen mynter blir plutselig litt bedre enn de burde v\u00e6re.",
    cost: 110
  },
  party_hat: {
    id: "party_hat",
    name: "Festhatt",
    description: "Av og til blir alt litt for mye. Helt topp.",
    cost: 75
  },
  tiny_drama: {
    id: "tiny_drama",
    name: "Lite drama",
    description: "Gir ingen mening, men kommenterer l\u00f8pet ditt med stil.",
    cost: 45
  },
  airhorn: {
    id: "airhorn",
    name: "Lommetuba",
    description: "Koster 1000 mynter. Starter en komplett tubakatastrofe som er herlig ubalansert.",
    cost: 1000
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
  clearedMaps: [],
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
  touch: { active: false, pointerId: null, startX: 0, lastX: 0, lastTime: 0, lastSwipeSpeed: 0 },
  controlMode: loadControlModeSetting(),
  pausedBySettings: false,
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
    bananaUntil: 0,
    rushUntil: 0,
    fireworksUntil: 0
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
  combo: {
    count: 0,
    multiplier: 1,
    expiresAt: 0,
    flashUntil: 0
  },
  runner: {
    triggered: false,
    completed: false,
    distance: 0,
    nextObstacleAt: 700,
    portalDistance: 2600,
    stage: 1,
    nextTriggerScore: runnerIntervalScore,
    variant: "classic",
    variantLabel: "Klassisk",
    pickups: [],
    nextPickupAt: 0,
    clearBonusCoins: 0,
    collectedCoins: 0,
    lowBias: 0.55,
    obstacles: [],
    portal: null,
    duckUntil: 0,
    obstacleCooldownUntil: 0,
    speed: 6.4,
    backgroundOffset: 0,
    jumpQueued: false,
    duckQueued: false
  },
  secret: {
    active: false,
    used: false,
    rewardClaimed: false,
    roomCoins: []
  },
  coinDash: {
    active: false,
    nextTriggerScore: coinDashFirstTriggerScore,
    lane: 1,
    moveCooldownUntil: 0,
    endAt: 0,
    pickups: [],
    nextSpawnAt: 0,
    collected: 0,
    laneFlashUntil: 0,
    celebrationUntil: 0
  },
  spectacle: {
    reserveLife: false,
    nextEnemyAt: 560,
    enemy: null,
    projectiles: [],
    hitCooldownUntil: 0
  }
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadControlModeSetting() {
  return localStorage.getItem(controlModeKey) === "swipe" ? "swipe" : "buttons";
}

function getControlSpeedMultiplier() {
  return controlSpeedBase * (state.controlMode === "buttons" ? buttonSpeedScale : swipeSpeedScale);
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

function repairMojibake(text) {
  if (typeof text !== "string" || !/[ÃƒÆ’Ãƒâ€šÃƒÂ¢Ã¢â€šÂ¬]/.test(text)) {
    return text;
  }

  try {
    const bytes = Uint8Array.from([...text].map((char) => char.charCodeAt(0)));
    const repaired = new TextDecoder("utf-8").decode(bytes);
    return /\u0000/.test(repaired) ? text : repaired;
  } catch {
    return text;
  }
}

function uiText(text) {
  return repairMojibake(String(text ?? ""));
}

function escapeHtml(text) {
  return uiText(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setScoreStatus(message) {
  scoreStatusEl.textContent = uiText(message);
}

function cloneDefaultProgression() {
  return {
    bankCoins: defaultProgression.bankCoins,
    clearedMaps: [...defaultProgression.clearedMaps],
    ownedSkins: [...defaultProgression.ownedSkins],
    selectedSkin: defaultProgression.selectedSkin,
    ownedMaps: [...defaultProgression.ownedMaps],
    selectedMap: defaultProgression.selectedMap,
    ownedSkills: [...defaultProgression.ownedSkills],
    selectedSkill: defaultProgression.selectedSkill,
    unlockedBanana: defaultProgression.unlockedBanana
  };
}

function getMapRules() {
  const mapId = state.progression?.selectedMap || "sky";
  if (mapId === "sunset") {
    return {
      comboWindowBonus: 120,
      comboBuildBonus: 1,
      gravityShift: 0,
      airControlBonus: 0.12,
      idleDrag: 0.84,
      platformGapBonus: 8,
      boostPlatformBonus: 0.04,
      phasePlatformBonus: 0.14,
      icePlatformBonus: 0.02,
      movingPlatformBonus: 0.03,
      crackedPlatformBonus: 0.02,
      collectibleBonus: 0.02,
      runnerSpeedBonus: 0.95,
      runnerPortalShift: -180,
      runnerVariantWeights: { classic: 1, sprint: 3, tunnel: 1, coinrush: 2 }
    };
  }

  if (mapId === "frost") {
    return {
      comboWindowBonus: 300,
      comboBuildBonus: 0,
      gravityShift: 0.018,
      airControlBonus: -0.02,
      idleDrag: 0.9,
      platformGapBonus: 0,
      boostPlatformBonus: 0.02,
      phasePlatformBonus: 0.05,
      icePlatformBonus: 0.22,
      movingPlatformBonus: 0.12,
      crackedPlatformBonus: 0.06,
      collectibleBonus: 0,
      runnerSpeedBonus: 0.2,
      runnerPortalShift: 40,
      runnerVariantWeights: { classic: 1, sprint: 1, tunnel: 3, coinrush: 1 }
    };
  }

  return {
    comboWindowBonus: 520,
    comboBuildBonus: 0,
    gravityShift: -0.018,
    airControlBonus: 0.05,
    idleDrag: 0.8,
    platformGapBonus: -6,
    boostPlatformBonus: 0.14,
    phasePlatformBonus: 0.04,
    icePlatformBonus: 0.04,
    movingPlatformBonus: 0,
    crackedPlatformBonus: 0,
    collectibleBonus: 0.06,
    runnerSpeedBonus: -0.2,
    runnerPortalShift: -80,
    runnerVariantWeights: { classic: 2, sprint: 1, tunnel: 1, coinrush: 3 }
  };
}

function getComboWindowMs() {
  return comboDecayMs + getMapRules().comboWindowBonus;
}

function resetCombo() {
  state.combo.count = 0;
  state.combo.multiplier = 1;
  state.combo.expiresAt = 0;
  state.combo.flashUntil = 0;
}

function extendCombo(amount, x, y, label = "") {
  const rules = getMapRules();
  const previousMultiplier = state.combo.multiplier;
  state.combo.count = Math.max(0, state.combo.count + amount + rules.comboBuildBonus);
  state.combo.multiplier = clamp(1 + Math.floor(state.combo.count / comboStepSize), 1, comboMaxMultiplier);
  state.combo.expiresAt = state.elapsedMs + getComboWindowMs();
  state.combo.flashUntil = state.elapsedMs + 460;

  if (state.combo.multiplier > previousMultiplier) {
    addFloatingText(`COMBO x${state.combo.multiplier}`, x, y, "#ff6b6b", 40);
  } else if (label) {
    addFloatingText(label, x, y, "#ffd166", 28);
  }
}

function updateComboState() {
  if (state.combo.count > 0 && state.elapsedMs > state.combo.expiresAt) {
    resetCombo();
    updateHud();
  }
}

function grantCoins(amount, x, y, color = "#f9b208", text = "") {
  if (!amount) {
    return;
  }

  state.coins += amount;
  state.progression.bankCoins += amount;
  saveProgression();
  updateProfileBar();
  addFloatingText(text || `+${amount}`, x, y, color);

  while (state.coins >= coinsPerLevel) {
    levelUp();
  }

  updateHud();
}

function chooseWeightedOption(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return key;
    }
  }
  return entries[0]?.[0] || "classic";
}

function getRunnerVariantConfig() {
  const rules = getMapRules();
  const variant = chooseWeightedOption(rules.runnerVariantWeights);
  const configs = {
    classic: { id: "classic", label: "Klassisk", speedBonus: 0, portalShift: 220, lowBias: 0.55, pickupBurst: true, pickupSpacing: [320, 450], reward: 4, failPenalty: 2 },
    sprint: { id: "sprint", label: "Sprint", speedBonus: 0.45, portalShift: 120, lowBias: 0.72, pickupBurst: true, pickupSpacing: [280, 380], reward: 5, failPenalty: 3 },
    tunnel: { id: "tunnel", label: "Dukkesone", speedBonus: 0.1, portalShift: 180, lowBias: 0.2, pickupBurst: true, pickupSpacing: [300, 410], reward: 6, failPenalty: 2 },
    coinrush: { id: "coinrush", label: "Myntjag", speedBonus: 0.05, portalShift: 280, lowBias: 0.55, pickupBurst: true, pickupSpacing: [190, 270], reward: 7, failPenalty: 3 }
  };
  return configs[variant] || configs.classic;
}
function getPlatformType(guaranteedCenter, difficulty) {
  if (guaranteedCenter) {
    return "normal";
  }

  const rules = getMapRules();
  const boostChance = clamp(0.08 + difficulty * 0.12 + rules.boostPlatformBonus, 0.04, 0.3);
  const iceChance = clamp(0.05 + difficulty * 0.08 + rules.icePlatformBonus, 0.03, 0.32);
  const roll = Math.random();

  if (roll < boostChance) {
    return "boost";
  }
  if (roll < boostChance + iceChance) {
    return "ice";
  }
  return "normal";
}

function isPlatformActive(platform) {
  return true;
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
    ownedSkills: uniqueList([...(loaded.ownedSkills || defaultProgression.ownedSkills)]).filter((id) => skills[id]),
    clearedMaps: uniqueList([...(loaded.clearedMaps || defaultProgression.clearedMaps)]).filter((id) => maps[id])
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
  progression.clearedMaps = uniqueList(progression.clearedMaps || []);
  return progression;
}

function maybeHandleMapClear() {
  const currentMap = getSelectedMap();
  if (!currentMap || state.progression.clearedMaps.includes(currentMap.id) || state.heightScore < mapGoalHeight) {
    return;
  }

  state.progression.clearedMaps.push(currentMap.id);
  state.progression.clearedMaps = uniqueList(state.progression.clearedMaps);

  const mapOrder = ["sky", "sunset", "frost"];
  const nextMapId = mapOrder[mapOrder.indexOf(currentMap.id) + 1];
  let message = "MAP CLEAR!";

  if (nextMapId && maps[nextMapId] && !state.progression.ownedMaps.includes(nextMapId)) {
    state.progression.ownedMaps.push(nextMapId);
    state.progression.ownedMaps = uniqueList(state.progression.ownedMaps);
    message = `MAP CLEAR! ${maps[nextMapId].name} unlocked`;
  }

  saveProgression();
  renderShop();
  updateProfileBar();
  addFloatingText(message, width / 2, state.cameraY + 180, "#7cff95", 85);
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
  selectedMapNameEl.textContent = uiText(getSelectedMap().name);
  selectedSkillNameEl.textContent = uiText(getSelectedSkill().name);
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

    let label = "K\u00f8p";
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
      label = item.cost > 0 ? `${item.cost} mynter` : "Gratis";
    }

    return `
      <article class="shop-card">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.description)}</p>
          <div class="shop-meta">
            <span>${escapeHtml(ownedItem ? "Eies" : lockedByScore ? "L\u00e5ses opp senere" : `Pris: ${item.cost}`)}</span>
          </div>
        </div>
        <button
          class="shop-button ${extraClass}"
          type="button"
          data-kind="${kind}"
          data-id="${item.id}"
          ${selected ? "disabled" : ""}
          ${lockedByScore ? "disabled" : ""}
        >${escapeHtml(label)}</button>
      </article>`;
  }).join("");
}

function renderShop() {
  renderShopCards(skinsShopEl, skins, "skin");
  renderShopCards(mapsShopEl, maps, "map");
  renderShopCards(skillsShopEl, skills, "skill");

  for (const button of document.querySelectorAll(".shop-button")) {
    button.onclick = () => {
      const kind = button.dataset.kind;
      const id = button.dataset.id;
      if (!kind || !id) {
        return;
      }
      purchase(kind, id);
    };
    button.onpointerup = (event) => {
      event.preventDefault();
      button.click();
    };
  }

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
    addFloatingText("Flere mynter trengs", width / 2, state.cameraY + 220, "#ff6b6b", 60);
    return;
  }

  spendCoins(item.cost);
  const key = kind === "skin" ? "ownedSkins" : kind === "map" ? "ownedMaps" : "ownedSkills";
  state.progression[key].push(id);
  state.progression[key] = uniqueList(state.progression[key]);
  selectOwned(kind, id);
}

function unlockBananaIfNeeded(score) {
  return false;
}

function renderLeaderboard(scores) {
  state.leaderboard = scores;

  if (!scores.length) {
    leaderboardEl.innerHTML = "<li>Ingen score enda.</li>";
    return;
  }

  leaderboardEl.innerHTML = scores
    .map((entry) => `<li><strong>${escapeHtml(entry.name)}</strong> - ${entry.score} m (level ${entry.level})</li>`)
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
    setScoreStatus("Fyll inn Supabase i config.js for delt toppliste. Viser lokal liste forel\u00f8pig.");
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
    setScoreStatus("Skriv inn kallenavn for \u00e5 lagre score.");
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
  messageEl.textContent = uiText(title);
  actionEl.textContent = uiText(buttonText);
  overlayEl.classList.toggle("hidden", !show);
  updateTouchButtonsVisibility();
}

function showStartOverlay() {
  scoreEntryEl.classList.add("hidden");
  leaderboardPanelEl.classList.add("hidden");
  saveScoreEl.disabled = false;
  renderShop();
  setOverlay("Start rolig, samle mynter og bygg opp banken din. Runnerbrett kommer ved hver 1000 m med hopp og dukk.", "Start spill", true);
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

  setOverlay(`Du kom til level ${state.level} og n\u00e5dde ${score} meter. Banken din er p\u00e5 ${state.progression.bankCoins} mynter.`, "Pr\u00f8v igjen", true);
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
function isRushActive() {
  return state.effects.rushUntil > state.elapsedMs;
}
function isRunnerDuckActive() {
  return state.runner.duckUntil > state.elapsedMs;
}

function isFrogActive() {
  return state.progression.selectedSkill === "frog_hop";
}

function isSpeedSkillActive() {
  return state.skillState.speedUntil > state.elapsedMs;
}

function isMagnetSkillActive() {
  return state.progression.selectedSkill === "magnet";
}

function isMoonBootsActive() {
  return state.progression.selectedSkill === "moon_boots";
}

function isLuckyCatActive() {
  return state.progression.selectedSkill === "lucky_cat";
}

function isPartyHatActive() {
  return state.progression.selectedSkill === "party_hat";
}

function isTinyDramaActive() {
  return state.progression.selectedSkill === "tiny_drama";
}

function isBananaActive() {
  return state.effects.bananaUntil > state.elapsedMs;
}

function isAirhornCatastropheActive() {
  return state.progression.selectedSkill === "airhorn" && isBananaActive();
}

function isFireworksActive() {
  return state.effects.fireworksUntil > state.elapsedMs;
}

function activateDisco(duration = discoDurationMs) {
  state.effects.discoUntil = Math.max(state.effects.discoUntil, state.elapsedMs + duration);
  addFloatingText("DISKO!", width / 2, state.cameraY + 220, "#ff4fd8", 70);
}

function activateJetpack(power = -17, duration = jetpackDurationMs) {
  state.effects.jetpackUntil = Math.max(state.effects.jetpackUntil, state.elapsedMs + duration);
  state.player.vy = Math.min(state.player.vy, power);
  addFloatingText("RAKETTPAKKE!", state.player.x + state.player.w / 2, state.player.y - 18, "#ff8c42", 60);
}
function activateRush(power = -28, duration = rushDurationMs) {
  state.effects.rushUntil = Math.max(state.effects.rushUntil, state.elapsedMs + duration);
  state.player.vy = Math.min(state.player.vy, power);
  addFloatingText("SUPERJETPACK!", state.player.x + state.player.w / 2, state.player.y - 18, "#7dd3fc", 60);
}
function activateFireworks(duration = fireworksDurationMs) {
  state.effects.fireworksUntil = Math.max(state.effects.fireworksUntil, state.elapsedMs + duration);
  activateDisco(Math.min(2200, duration));
  grantCoins(6, state.player.x + state.player.w / 2, state.player.y - 16, "#fff0a6", "+6 WOW!");
  addFloatingText("FYRVERKERI!", width / 2, state.cameraY + 200, "#fff0a6", 66);
}
function activateBananaSurprise() {
  state.skillState.bananaTriggered = true;
  state.effects.bananaUntil = state.elapsedMs + 11000;
  state.skillState.bananaPulseUntil = state.elapsedMs + 11000;
  activateDisco(11000);
  activateJetpack(-24.5, 1600);
  activateRush(-35, 2600);
  state.progression.bankCoins += 100;
  for (let i = 0; i < 18; i += 1) {
    state.collectibles.push({
      type: "coin",
      x: rand(24, width - 24),
      y: state.cameraY + rand(40, height - 180),
      r: 10,
      value: i % 4 === 0 ? 2 : 1,
      collected: false
    });
  }
  saveProgression();
  updateProfileBar();
  addFloatingText("TUBAKATASTROFE!", width / 2, state.cameraY + 200, "#ffe066", 105);
  addFloatingText("OOOMPAA!!", width / 2, state.cameraY + 150, "#ff9f1c", 88);
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
  const rush = isRushActive();
  const runnerMode = state.mode === "runner";
  const sequence = runnerMode ? music.runnerSequence : disco ? music.discoSequence : getSelectedMap().musicSequence;
  const lookAhead = 0.18;
  const intensity = Math.min(1, 0.2 + (state.heightScore / 95) + (state.level - 1) * 0.14 + (disco ? 0.3 : 0) + (rush ? 0.22 : 0) + (runnerMode ? 0.2 : 0));
  const baseBeat = runnerMode ? 0.18 : rush ? 0.14 : disco ? 0.16 : 0.25;
  const beatLength = state.running ? clamp(baseBeat - intensity * 0.05, 0.11, 0.32) : 0.3;
  music.master.gain.setTargetAtTime(state.running ? (runnerMode ? 0.22 : disco ? 0.24 : rush ? 0.21 : 0.18) : 0.1, music.context.currentTime, 0.08);
  music.leadGain.gain.setTargetAtTime(0.05 + intensity * 0.07 + (rush ? 0.02 : 0), music.context.currentTime, 0.08);
  music.pulseGain.gain.setTargetAtTime(state.running ? (runnerMode ? 0.065 : disco ? 0.075 : rush ? 0.07 : 0.05) : 0.025, music.context.currentTime, 0.08);

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
  const rules = getMapRules();
  const bananaBonus = isBananaActive() ? 16 : 0;
  return Math.max(40, basePlatformWidth - state.level * 4 - difficulty * 26 + bananaBonus - rules.platformGapBonus * 0.28);
}

function getPlatformGap() {
  const difficulty = getRunDifficulty();
  const rules = getMapRules();
  const bananaRelief = isBananaActive() ? 10 : 0;
  return Math.min(154, basePlatformGap + state.level * 5 + difficulty * 24 - bananaRelief + rules.platformGapBonus);
}

function getJumpVelocity() {
  const difficulty = getRunDifficulty();
  const rules = getMapRules();
  let jump = baseJumpVelocity - Math.min(1.2, (state.level - 1) * 0.1) - difficulty * 0.65;
  jump -= rules.gravityShift * 6.5;
  if (isBananaActive()) {
    jump -= 0.6;
  }
  if (isMoonBootsActive()) {
    jump -= 0.8;
  }
  return jump;
}


function getGravity(vy) {
  const difficulty = getRunDifficulty();
  const rules = getMapRules();
  const bananaShift = isBananaActive() ? -0.03 : 0;
  const moonShift = isMoonBootsActive() ? -0.022 : 0;
  const mapShift = rules.gravityShift;

  if (vy < -7) return 0.22 + difficulty * 0.015 + bananaShift + moonShift + mapShift;
  if (vy < -2) return 0.18 + difficulty * 0.02 + bananaShift + moonShift + mapShift;
  if (vy < 1.2) return 0.12 + difficulty * 0.02 + bananaShift + moonShift + mapShift * 0.8;
  if (vy < 6) return 0.27 + difficulty * 0.025 + moonShift * 0.3 + mapShift * 0.45;
  return 0.34 + difficulty * 0.03 + moonShift * 0.25 + mapShift * 0.2;
}

function addFloatingText(text, x, y, color, life = 50) {
  state.floatingTexts.push({ text: uiText(text), x, y, color, life, maxLife: life });
}

function maybeCreateCollectible(platform) {
  const rules = getMapRules();
  const baseChance = isBananaActive() ? 0.94 : 0.4 + rules.collectibleBonus;
  if (Math.random() > baseChance) {
    return;
  }

  const coinValue = platform.type === "boost" ? 2 : 1;
  state.collectibles.push({
    type: "coin",
    x: platform.x + platform.w / 2,
    y: platform.y - rand(34, 58),
    r: 10,
    value: coinValue,
    collected: false
  });

  if (platform.type === "boost" && Math.random() < 0.45) {
    state.collectibles.push({
      type: "coin",
      x: clamp(platform.x + platform.w / 2 + rand(-18, 18), 18, width - 18),
      y: platform.y - rand(60, 88),
      r: 10,
      value: 1,
      collected: false
    });
  }

  if (isBananaActive()) {
    const bananaBurst = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bananaBurst; i += 1) {
      state.collectibles.push({
        type: "coin",
        x: clamp(platform.x + platform.w / 2 + rand(-platform.w * 0.45, platform.w * 0.45), 18, width - 18),
        y: platform.y - rand(42, 96),
        r: 10,
        value: 1,
        collected: false
      });
    }
  }

  const difficulty = getRunDifficulty();
  const powerupChance = 0.06 + difficulty * 0.08 + rules.collectibleBonus + (isBananaActive() ? 0.14 : 0);
  if (Math.random() < powerupChance) {
    const roll = Math.random();
    const heartAllowed = !state.spectacle.reserveLife && !state.skillState.extraLifeUsed;
    const type = roll < 0.28 ? "disco" :
      roll < 0.54 ? "jetpack" :
      roll < 0.76 ? "rush" :
      roll < 0.92 || !heartAllowed ? "firework" : "heart";
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
  const rules = getMapRules();
  const previousWasTricky = previousPlatform && (previousPlatform.cracked || previousPlatform.vx);
  const movingChance = guaranteedCenter ? 0 : clamp((difficulty - 0.05) * 0.58 + rules.movingPlatformBonus - (previousWasTricky ? 0.22 : 0), 0, 0.68);
  const crackedChance = guaranteedCenter ? 0 : clamp((difficulty - 0.2) * 0.34 + rules.crackedPlatformBonus - (previousWasTricky ? 0.14 : 0), 0, 0.38);
  const maxOffset = (previousWasTricky ? 56 : 80) + difficulty * 42;
  const type = getPlatformType(guaranteedCenter, difficulty);
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
    cracked: type === "boost" ? false : Math.random() < crackedChance,
    peel: false,
    peelUsed: false,
    broken: false,
    type,
    phaseOffset: rand(0, phaseCycleMs),
    safeUntil: 0
  };
  platform.x = clamp(platform.x, 18, width - platform.w - 18);
  maybeCreateCollectible(platform);
  return platform;
}

function createRunnerPickup(x, y, value = 1) {
  return { x, y, r: 8, value, collected: false };
}

function spawnEnemyHarasser() {
  const side = Math.random() < 0.5 ? -1 : 1;
  state.spectacle.enemy = {
    side,
    x: side < 0 ? 34 : width - 34,
    targetX: side < 0 ? width * 0.28 : width * 0.72,
    y: state.cameraY + 96,
    wobble: rand(0, Math.PI * 2),
    throwAt: state.elapsedMs + 520,
    throwsLeft: 3,
    exitAt: state.elapsedMs + 3000
  };
  addFloatingText("FIENDE!", width / 2, state.cameraY + 132, "#fecdd3", 44);
}

function updateJumperSpectacle() {
  if (state.heightScore >= state.spectacle.nextEnemyAt && !state.spectacle.enemy) {
    state.spectacle.nextEnemyAt += rand(520, 860);
    spawnEnemyHarasser();
  }

  const enemy = state.spectacle.enemy;
  if (enemy) {
    enemy.y = state.cameraY + 96 + Math.sin(state.elapsedMs / 150 + enemy.wobble) * 8;
    enemy.x += (enemy.targetX - enemy.x) * 0.08;
    if (state.elapsedMs >= enemy.throwAt && enemy.throwsLeft > 0) {
      const playerCenterX = state.player.x + state.player.w / 2;
      const dx = playerCenterX - enemy.x;
      state.spectacle.projectiles.push({
        x: enemy.x,
        y: enemy.y + 12,
        vx: clamp(dx / 75, -3.4, 3.4),
        vy: 2.6 + Math.random() * 0.9,
        r: 9 + Math.random() * 2
      });
      enemy.throwAt = state.elapsedMs + rand(360, 620);
      enemy.throwsLeft -= 1;
    }

    if (enemy.throwsLeft <= 0 && state.elapsedMs > enemy.exitAt) {
      state.spectacle.enemy = null;
    }
  }

  const player = state.player;
  const remainingProjectiles = [];
  for (const projectile of state.spectacle.projectiles) {
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.vy += 0.18;

    const dx = (player.x + player.w / 2) - projectile.x;
    const dy = (player.y + player.h / 2) - projectile.y;
    const hitRadius = 20 + projectile.r;
    if (state.elapsedMs > state.spectacle.hitCooldownUntil && (dx * dx) + (dy * dy) < hitRadius * hitRadius) {
      state.spectacle.hitCooldownUntil = state.elapsedMs + 850;
      state.coins = Math.max(0, state.coins - 2);
      player.vx += projectile.vx * 0.35;
      player.vy = Math.min(player.vy, -4.6);
      player.bounceSquash = 0.92;
      addFloatingText("SPLÆSJ!", projectile.x, projectile.y, "#fecdd3", 40);
      updateHud();
      continue;
    }

    if (projectile.y < state.cameraY + height + 80) {
      remainingProjectiles.push(projectile);
    }
  }
  state.spectacle.projectiles = remainingProjectiles;
}

function spawnRunnerPickupBurst() {
  const variant = state.runner.variant;
  const lane = Math.random() < 0.55 ? "jump" : "ground";
  const startX = width + rand(130, 240);
  const count = variant === "coinrush" ? 6 : variant === "sprint" ? 4 : 5;

  for (let i = 0; i < count; i += 1) {
    const arc = lane === "jump" ? Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 16 : 0;
    const offsetY = lane === "jump" ? runnerGroundY - 74 - arc : runnerGroundY - 24 - (i % 2) * 5;
    const value = variant === "coinrush" && (i === 0 || i === count - 1) ? 2 : 1;
    state.runner.pickups.push(createRunnerPickup(startX + i * 42, offsetY, value));
  }
}
function createObstacle() {
  const variant = state.runner.variant;
  const lowBias = state.runner.lowBias || 0.55;
  const spawnX = width + rand(300, 430);
  const type = Math.random() < lowBias ? "low" : "high";
  if (type === "low") {
    return {
      type,
      x: spawnX,
      y: runnerGroundY,
      w: variant === "sprint" ? rand(34, 48) : rand(40, 56),
      h: variant === "sprint" ? rand(34, 48) : rand(44, 60)
    };
  }

  return {
    type,
    x: spawnX,
    y: runnerGroundY - rand(28, 34),
    w: rand(56, variant === "tunnel" ? 94 : 78),
    h: rand(96, variant === "tunnel" ? 118 : 108)
  };
}

function resetRunnerState() {
  const stage = Math.max(1, state.runner.stage || 1);
  const rules = getMapRules();
  const variantConfig = getRunnerVariantConfig();
  state.runner.distance = 0;
  state.runner.nextObstacleAt = variantConfig.id === "sprint" ? 900 : 1040;
  state.runner.portalDistance = 3200 + (stage - 1) * 320 + rules.runnerPortalShift + variantConfig.portalShift;
  state.runner.variant = variantConfig.id;
  state.runner.variantLabel = variantConfig.label;
  state.runner.pickups = [];
  state.runner.nextPickupAt = rand(variantConfig.pickupSpacing[0], variantConfig.pickupSpacing[1]);
  state.runner.clearBonusCoins = variantConfig.reward;
  state.runner.collectedCoins = 0;
  state.runner.failCoinPenalty = variantConfig.failPenalty;
  state.runner.lowBias = variantConfig.lowBias;
  state.runner.obstacles = [];
  state.runner.portal = null;
  state.runner.duckUntil = 0;
  state.runner.obstacleCooldownUntil = 0;
  state.runner.speed = 3.8 + state.level * 0.12 + stage * 0.2 + rules.runnerSpeedBonus * 0.45 + variantConfig.speedBonus;
  state.runner.backgroundOffset = 0;
  state.runner.jumpQueued = false;
  state.runner.duckQueued = false;
}

function getNextRunnerObstacle() {
  if (state.mode !== "runner") {
    return null;
  }

  let nearest = null;
  for (const obstacle of state.runner.obstacles) {
    if (obstacle.x + obstacle.w < runnerPlayerX - 12) {
      continue;
    }
    if (!nearest || obstacle.x < nearest.x) {
      nearest = obstacle;
    }
  }
  return nearest;
}

function enterRunnerMode() {
  state.mode = "runner";
  updateTouchButtonsVisibility();
  state.effects.discoUntil = 0;
  state.effects.jetpackUntil = 0;
  state.effects.rushUntil = 0;
  resetRunnerState();
  state.player.x = runnerPlayerX;
  state.player.y = runnerGroundY - state.player.h;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.bounceSquash = 0;
  addFloatingText(`RUNNERBRETT ${state.runner.stage} - ${state.runner.variantLabel}`, width / 2, state.cameraY + 220, "#00d1ff", 72);
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
  updateTouchButtonsVisibility();
  const runnerReward = runnerBonusScore + state.runner.stage * 90;
  const runnerPenalty = runnerCrashPenalty + (state.runner.stage - 1) * 30;
  const variantCoinBonus = success ? state.runner.clearBonusCoins + state.runner.collectedCoins : 0;
  state.heightScore = Math.max(0, state.heightScore + (success ? runnerReward : -runnerPenalty));
  state.cameraY = -state.heightScore * 10;

  const baseY = state.cameraY + height - 104;
  rebuildJumperWorld(baseY);

  state.player.x = width / 2 - state.player.w / 2;
  state.player.y = baseY - state.player.h - 12;
  state.player.vx = 0;
  state.player.vy = success ? getJumpVelocity() - 1.2 : getJumpVelocity() * 0.72;
  state.player.bounceSquash = 0.9;

  state.runner.completed = success;
  if (success) {
    extendCombo(2, width / 2, state.cameraY + 200, state.runner.variantLabel.toUpperCase());
    if (variantCoinBonus > 0) {
      grantCoins(variantCoinBonus, width / 2, state.cameraY + 170, "#ffe066", `+${variantCoinBonus} banemynter`);
    }
    addFloatingText(`+${runnerReward} m`, width / 2, state.cameraY + 138, "#9bf6ff", 44);
  } else {
    resetCombo();
    if ((state.runner.failCoinPenalty || runnerFailCoinPenalty) > 0 && state.coins > 0) {
      const lostCoins = Math.min(state.coins, state.runner.failCoinPenalty || runnerFailCoinPenalty);
      state.coins -= lostCoins;
      addFloatingText(`-${lostCoins} run-mynter`, width / 2, state.cameraY + 170, "#ffadad", 44);
    }
    addFloatingText(`-${runnerPenalty} m`, width / 2, state.cameraY + 138, "#ffadad", 44);
  }
  addFloatingText(success ? "PORTALBOOST!" : "TRUFFET!", width / 2, state.cameraY + 200, success ? "#00d1ff" : "#ff6b6b", 70);
  updateHud();
  maybeHandleMapClear();
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
    frogUntil: 0,
    frogJumpCount: 0,
    speedUntil: selected === "superspeed" ? 12000 : 0,
    bananaTriggered: false,
    bananaPulseUntil: 0,
    partyBurstAt: selected === "party_hat" ? rand(700, 1500) : Infinity,
    dramaNextAt: selected === "tiny_drama" ? rand(300, 700) : Infinity
  };
}

function resetGame() {
  state.mode = "jumper";
  updateTouchButtonsVisibility();
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
  state.effects.rushUntil = 0;
  state.effects.fireworksUntil = 0;
  state.floatingTexts = [];
  state.runner.triggered = false;
  state.runner.completed = false;
  state.runner.stage = 1;
  resetCombo();

  state.runner.nextTriggerScore = runnerIntervalScore;
  state.secret.active = false;
  state.secret.used = false;
  state.secret.rewardClaimed = false;
  state.secret.roomCoins = [];
  state.coinDash.active = false;
  state.coinDash.nextTriggerScore = coinDashFirstTriggerScore;
  state.coinDash.lane = 1;
  state.coinDash.moveCooldownUntil = 0;
  state.coinDash.endAt = 0;
  state.coinDash.pickups = [];
  state.coinDash.nextSpawnAt = 0;
  state.coinDash.collected = 0;
  state.coinDash.laneFlashUntil = 0;
  state.coinDash.celebrationUntil = 0;
  state.spectacle.reserveLife = false;
  state.spectacle.nextEnemyAt = 560;
  state.spectacle.enemy = null;
  state.spectacle.projectiles = [];
  state.spectacle.hitCooldownUntil = 0;
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
  if (comboEl) {
    comboEl.textContent = `x${state.combo.multiplier}`;
    comboEl.style.opacity = state.combo.count > 0 ? "1" : "0.55";
  }
  bestEl.textContent = `${Math.floor(state.bestScore)} m`;
  updateProfileBar();
}
function isSecretHintWindow() {
  return !state.secret.used && state.heightScore >= secretRoomTriggerScore - 70 && state.heightScore <= secretRoomTriggerScore + 45;
}

function getCoinDashLaneX(lane) {
  return [width * 0.22, width * 0.5, width * 0.78][clamp(lane, 0, 2)] - state.player.w / 2;
}

function spawnCoinDashPickup(lane, type = "coin", shiny = false, y = -20) {
  state.coinDash.pickups.push({
    lane,
    x: getCoinDashLaneX(lane) + state.player.w / 2,
    y,
    r: shiny ? 12 : 10,
    type,
    value: type === "coin" ? (shiny ? 5 : 3) : 0
  });
}

function enterSecretRoom() {
  state.mode = "secret";
  state.secret.active = true;
  state.secret.used = true;
  state.secret.rewardClaimed = false;
  state.secret.roomCoins = Array.from({ length: 10 }, (_, index) => ({
    x: 86 + index * 28,
    y: 112 + (index % 2) * 18,
    r: index % 3 === 0 ? 11 : 9
  }));
  state.player.x = 42;
  state.player.y = height - 168;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.bounceSquash = 0.5;
  updateTouchButtonsVisibility();
  addFloatingText("HEMMELIG ROM!", width / 2, 120, "#ffe066", 95);
  addFloatingText("Han fant det!", width / 2, 155, "#9bf6ff", 70);
}

function exitSecretRoom() {
  state.mode = "jumper";
  state.secret.active = false;
  updateTouchButtonsVisibility();
  const baseY = state.cameraY + height - 104;
  rebuildJumperWorld(baseY);
  state.player.x = width - 94;
  state.player.y = baseY - state.player.h - 12;
  state.player.vx = 0;
  state.player.vy = getJumpVelocity() - 0.5;
  state.player.bounceSquash = 0.8;
  addFloatingText("Tilbake igjen!", width / 2, state.cameraY + 190, "#ffe066", 55);
}

function enterCoinDashMode() {
  state.mode = "coindash";
  state.coinDash.active = true;
  state.coinDash.lane = 1;
  state.coinDash.moveCooldownUntil = 0;
  state.coinDash.endAt = state.elapsedMs + coinDashDurationMs;
  state.coinDash.pickups = [];
  state.coinDash.nextSpawnAt = state.elapsedMs + 250;
  state.coinDash.collected = 0;
  state.coinDash.laneFlashUntil = state.elapsedMs + 500;
  state.coinDash.celebrationUntil = 0;
  state.player.x = getCoinDashLaneX(state.coinDash.lane);
  state.player.y = height - 138;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.bounceSquash = 0.3;
  updateTouchButtonsVisibility();
  addFloatingText("COIN DASH!", width / 2, 120, "#ffe066", 90);
  addFloatingText("Trekk inn mynter, unngå søpla", width / 2, 154, "#9bf6ff", 68);
  addFloatingText(`${getSelectedSkin().name} er klar!`, width / 2, 188, "#ffffff", 56);
}

function exitCoinDashMode() {
  state.mode = "jumper";
  state.coinDash.active = false;
  state.coinDash.pickups = [];
  updateTouchButtonsVisibility();
  const baseY = state.cameraY + height - 104;
  rebuildJumperWorld(baseY);
  state.player.x = width / 2 - state.player.w / 2;
  state.player.y = baseY - state.player.h - 12;
  state.player.vx = 0;
  state.player.vy = getJumpVelocity() - 0.7;
  state.player.bounceSquash = 0.75;
  addFloatingText("COIN DASH FERDIG!", width / 2, state.cameraY + 180, "#ffe066", 70);
}

function updateSecretRoom() {
  const player = state.player;
  const swipeIntent = state.controlMode === "swipe" && state.touch.active ? clamp((state.touch.lastSwipeSpeed || 0) * 5.5, -1, 1) : 0;
  const moveIntent = Math.abs(swipeIntent) > 0.08 ? swipeIntent : getMoveIntent();
  const speed = 4.2;
  player.x += moveIntent * speed;
  player.x = clamp(player.x, -16, width - player.w + 8);
  player.y = height - 168;
  player.vx = moveIntent * speed;
  player.vy = 0;
  player.bounceSquash *= 0.8;

  const chest = { x: width / 2 - 46, y: height - 186, w: 92, h: 64 };
  const touchingChest = player.x + player.w > chest.x && player.x < chest.x + chest.w && player.y + player.h > chest.y && player.y < chest.y + chest.h;
  if (touchingChest && !state.secret.rewardClaimed) {
    state.secret.rewardClaimed = true;
    grantCoins(secretRoomReward, width / 2, 150, "#ffe066", "+" + secretRoomReward + " hemmelige mynter");
    addFloatingText("JACKPOT!", width / 2, 116, "#ff9f1c", 90);
  }

  if (state.secret.rewardClaimed && player.x < 18) {
    exitSecretRoom();
  }
}

function updateCoinDashMode() {
  const moveIntent = getMoveIntent();
  if (state.elapsedMs >= state.coinDash.moveCooldownUntil) {
    if (moveIntent < -0.4) {
      state.coinDash.lane = Math.max(0, state.coinDash.lane - 1);
      state.coinDash.moveCooldownUntil = state.elapsedMs + 120;
      state.coinDash.laneFlashUntil = state.elapsedMs + 180;
      state.player.bounceSquash = 0.75;
    } else if (moveIntent > 0.4) {
      state.coinDash.lane = Math.min(2, state.coinDash.lane + 1);
      state.coinDash.moveCooldownUntil = state.elapsedMs + 120;
      state.coinDash.laneFlashUntil = state.elapsedMs + 180;
      state.player.bounceSquash = 0.75;
    }
  }

  state.player.x += (getCoinDashLaneX(state.coinDash.lane) - state.player.x) * 0.32;
  state.player.y = height - 138;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.bounceSquash *= 0.82;

  if (state.elapsedMs >= state.coinDash.nextSpawnAt) {
    const patternRoll = Math.random();
    if (patternRoll < 0.16) {
      const shinyLane = Math.floor(Math.random() * 3);
      for (let lane = 0; lane < 3; lane += 1) {
        spawnCoinDashPickup(lane, "coin", lane === shinyLane);
      }
      state.coinDash.nextSpawnAt = state.elapsedMs + rand(360, 520);
    } else if (patternRoll < 0.34) {
      const firstLane = Math.floor(Math.random() * 3);
      const secondLane = (firstLane + 1 + Math.floor(Math.random() * 2)) % 3;
      spawnCoinDashPickup(firstLane, "coin", Math.random() < 0.24);
      spawnCoinDashPickup(secondLane, "coin", Math.random() < 0.24);
      state.coinDash.nextSpawnAt = state.elapsedMs + rand(280, 420);
    } else {
      const lane = Math.floor(Math.random() * 3);
      const shiny = Math.random() < 0.22;
      spawnCoinDashPickup(lane, Math.random() < 0.78 ? "coin" : "junk", shiny);
      state.coinDash.nextSpawnAt = state.elapsedMs + rand(240, 420);
    }
  }

  for (const pickup of state.coinDash.pickups) {
    pickup.y += pickup.type === "coin" ? 5.6 : 6.3;
  }

  const playerBox = { x: state.player.x, y: state.player.y, w: state.player.w, h: state.player.h };
  const remaining = [];
  for (const pickup of state.coinDash.pickups) {
    const hit = playerBox.x < pickup.x + pickup.r &&
      playerBox.x + playerBox.w > pickup.x - pickup.r &&
      playerBox.y < pickup.y + pickup.r &&
      playerBox.y + playerBox.h > pickup.y - pickup.r;
    if (hit) {
      if (pickup.type === "coin") {
        state.coinDash.collected += pickup.value;
        state.coinDash.celebrationUntil = state.elapsedMs + (pickup.value >= 5 ? 360 : 180);
        state.player.bounceSquash = pickup.value >= 5 ? 1 : 0.72;
        if (pickup.value >= 5) {
          addFloatingText("MEGA!", pickup.x, pickup.y - 12, "#fff0a6", 42);
        }
        grantCoins(pickup.value, pickup.x, pickup.y, "#ffe066", "+" + pickup.value);
      } else {
        state.coins = Math.max(0, state.coins - 2);
        state.coinDash.laneFlashUntil = state.elapsedMs + 220;
        addFloatingText("BØTTEBONK!", pickup.x, pickup.y, "#ff6b6b", 40);
        updateHud();
      }
      continue;
    }
    if (pickup.y < height + 40) {
      remaining.push(pickup);
    }
  }
  state.coinDash.pickups = remaining;

  if (state.elapsedMs >= state.coinDash.endAt) {
    exitCoinDashMode();
  }
}

function levelUp() {
  state.level += 1;
  state.coins = Math.max(0, state.coins - coinsPerLevel);
  addFloatingText(`LEVEL ${state.level}!`, width / 2, state.cameraY + 220, "#ff5f6d", 60);
  if (isPartyHatActive()) {
    activateDisco(2200);
  }
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
  if (!isBananaActive() && !isMagnetSkillActive()) {
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
        const baseBonus = item.value || 1;
        const luckyBonus = isLuckyCatActive() && Math.random() < 0.35 ? 2 : 0;
        const bonus = baseBonus + (isDiscoActive() ? 1 : 0) + (isBananaActive() ? 1 : 0) + luckyBonus + Math.max(0, state.combo.multiplier - 1);
        extendCombo(baseBonus + (luckyBonus > 0 ? 1 : 0), item.x, item.y, luckyBonus > 0 ? "LUCKY!" : "+" + bonus);
        grantCoins(bonus, item.x, item.y, "#f9b208", "+" + bonus);
      }

      if (item.type === "disco") {
        extendCombo(1, item.x, item.y, "DISKO!");
        activateDisco();
      }

      if (item.type === "jetpack") {
        extendCombo(1, item.x, item.y, "RAKETTPAKKE!");
        activateJetpack(isBananaActive() ? -22 : -20, isBananaActive() ? 1600 : 1300);
      }

      if (item.type === "rush") {
        extendCombo(1, item.x, item.y, "SUPERJETPACK!");
        activateRush(isBananaActive() ? -31 : -28, isBananaActive() ? 2200 : rushDurationMs);
      }

      if (item.type === "firework") {
        extendCombo(2, item.x, item.y, "WOW!");
        activateFireworks();
      }

      if (item.type === "heart") {
        state.spectacle.reserveLife = true;
        extendCombo(2, item.x, item.y, "EKSTRALIV!");
        addFloatingText("EKSTRALIV LAGRET!", item.x, item.y - 18, "#7cff95", 56);
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
  resetCombo();
  showGameOverOverlay();
}

function getMoveIntent() {
  return (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
}

function reviveFromFall() {
  if (state.spectacle.reserveLife) {
    state.spectacle.reserveLife = false;
    const rescuePlatformY = state.cameraY + height - 160;
    const rescuePlatform = createPlatform(rescuePlatformY, true, null);
    rescuePlatform.cracked = false;
    rescuePlatform.vx = 0;
    state.platforms.push(rescuePlatform);
    state.player.x = width / 2 - state.player.w / 2;
    state.player.y = rescuePlatformY - state.player.h - 10;
    state.player.vx = 0;
    state.player.vy = getJumpVelocity() - 1;
    state.player.bounceSquash = 1;
    addFloatingText("EKSTRALIV REDDER DEG!", width / 2, state.cameraY + 220, "#7cff95", 74);
    return true;
  }

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
  const rules = getMapRules();
  const moveIntent = getMoveIntent();
  const controlMult = getControlSpeedMultiplier();
  const speedSkillBonus = isSpeedSkillActive() ? 1 : 0;
  const airAcceleration = (0.36 + difficulty * 0.08 + speedSkillBonus * 0.22 + (isBananaActive() ? 0.18 : 0) + rules.airControlBonus) * controlMult;
  const maxMoveSpeed = (moveSpeed + difficulty * 0.62 + speedSkillBonus * 2.35 + (isBananaActive() ? 2.2 : 0) + Math.max(0, rules.airControlBonus * 6)) * controlMult;
  const touchSpeedCap = state.touch.active && isCoarsePointer ? maxMoveSpeed * 1.24 : maxMoveSpeed;

  player.bounceSquash *= 0.84;

  if (Math.abs(moveIntent) > 0.04) {
    player.vx += moveIntent * airAcceleration;
  } else {
    player.vx *= rules.idleDrag;
  }

  if (isRushActive()) {
    player.vy = Math.min(player.vy, -16.6);
  } else if (isJetpackActive()) {
    player.vy = Math.min(player.vy, -11.5);
  }

  if (state.progression.selectedSkill === "airhorn" && !state.skillState.bananaTriggered && state.heightScore >= 700) {
    activateBananaSurprise();
  }

  if (isPartyHatActive() && state.heightScore >= state.skillState.partyBurstAt) {
    state.skillState.partyBurstAt += rand(850, 1600);
    activateDisco(2600);
    addFloatingText("FESTMODUS!", width / 2, state.cameraY + 200, "#ff4fd8", 55);
  }

  if (isTinyDramaActive() && state.heightScore >= state.skillState.dramaNextAt) {
    const dramaLines = ["DRAMATISK!", "FOR ET HOPP", "UH\u00d8RT FLYT", "LITEN HELT", "REN TEATER!"];
    state.skillState.dramaNextAt += rand(380, 860);
    addFloatingText(dramaLines[Math.floor(Math.random() * dramaLines.length)], width / 2, state.cameraY + 240, "#ffffff", 40);
  }

  updateJumperSpectacle();

  player.vy += getGravity(player.vy);
  player.vx = clamp(player.vx, -touchSpeedCap, touchSpeedCap);
  player.x += player.vx;
  player.y += player.vy;

  if (player.x + player.w < 0) {
    player.x = width;
  } else if (isSecretHintWindow() && player.x + player.w > width + 18) {
    enterSecretRoom();
    return;
  } else if (player.x > width) {
    player.x = -player.w;
  }

  for (const platform of state.platforms) {
    if (platform.broken || !isPlatformActive(platform)) {
      continue;
    }

    const wasAbove = player.y + player.h - player.vy <= platform.y;
    const touchingX = player.x + player.w > platform.x && player.x < platform.x + platform.w;
    const touchingY = player.y + player.h >= platform.y && player.y + player.h <= platform.y + platform.h + 12;

    if (player.vy > 0 && wasAbove && touchingX && touchingY) {
      player.y = platform.y - player.h;
      player.vy = getJumpVelocity();
      extendCombo(platform.type === "boost" ? 2 : 1, platform.x + platform.w / 2, platform.y - 12, platform.type === "boost" ? "BOOST!" : "");
      if (isFrogActive()) {
        state.skillState.frogJumpCount = (state.skillState.frogJumpCount || 0) + 1;
        if (state.skillState.frogJumpCount % 3 === 0) {
          player.vy -= 2.2;
          addFloatingText("FROSKEBOOST!", player.x + player.w / 2, player.y - 12, "#7cff95", 44);
        }
      }
      player.bounceSquash = 1;

      if (platform.type === "boost") {
        player.vy -= 2.7;
      }

      if (platform.type === "ice") {
        player.vx = clamp(player.vx * 1.14 + platform.vx * 0.9, -touchSpeedCap * 1.15, touchSpeedCap * 1.15);
        addFloatingText("ISGLID!", platform.x + platform.w / 2, platform.y - 10, "#9ad1ff", 34);
      }

      if (platform.vx) {
        player.x += platform.vx * 0.6;
      }

      if (platform.cracked) {
        platform.broken = true;
        addFloatingText("KNAKK!", platform.x + platform.w / 2, platform.y - 8, "#ff6b6b", 34);
      }
      updateHud();
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
    maybeHandleMapClear();
  }

  if (state.heightScore >= state.coinDash.nextTriggerScore) {
    state.coinDash.nextTriggerScore += coinDashIntervalScore;
    enterCoinDashMode();
    return;
  }

  if (state.heightScore >= state.runner.nextTriggerScore) {
    state.runner.stage = Math.max(1, Math.floor(state.runner.nextTriggerScore / runnerIntervalScore));
    state.runner.nextTriggerScore += runnerIntervalScore;
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
  const duckActive = isRunnerDuckActive();
  const speed = runner.speed + Math.min(1.0, state.level * 0.1) + Math.min(0.7, (runner.stage - 1) * 0.09);

  runner.distance += speed;
  runner.backgroundOffset += speed;

  if (runner.jumpQueued) {
    if (player.y >= runnerGroundY - player.h - 0.5 && !duckActive) {
      player.vy = -11.2;
      player.bounceSquash = 0.62;
    }
    runner.jumpQueued = false;
  }

  if (runner.duckQueued) {
    if (player.y >= runnerGroundY - player.h - 0.5) {
      runner.duckUntil = state.elapsedMs + runnerDuckDurationMs;
      player.bounceSquash = 0.35;
    }
    runner.duckQueued = false;
  }

  player.vy += 0.58;
  player.y += player.vy;
  player.x = runnerPlayerX;
  player.bounceSquash *= 0.85;

  if (player.y > runnerGroundY - player.h) {
    player.y = runnerGroundY - player.h;
    player.vy = 0;
  }

  if (!runner.portal && runner.distance >= runner.portalDistance) {
    runner.portal = { x: width + 160, y: runnerGroundY - 96, w: 58, h: 96 };
    addFloatingText("PORTAL!", width / 2, runnerGroundY - 120, "#00d1ff", 42);
    clearTouchInput();
  }

  if (!runner.portal && runner.distance >= runner.nextObstacleAt) {
    runner.obstacles.push(createObstacle());
    const baseSpacing = runner.variant === "sprint" ? 540 : 650 - Math.min(90, runner.stage * 8);
    runner.nextObstacleAt += rand(Math.max(430, baseSpacing), Math.max(620, baseSpacing + 160));
  }

  if (!runner.portal && runner.distance >= runner.nextPickupAt) {
    spawnRunnerPickupBurst();
    const [minPickupGap, maxPickupGap] = runner.variant === "coinrush" ? [170, 250] : runner.variant === "sprint" ? [260, 360] : [300, 420];
    runner.nextPickupAt += rand(minPickupGap, maxPickupGap);
  }

  for (const obstacle of runner.obstacles) {
    obstacle.x -= speed;
  }
  runner.obstacles = runner.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -60);

  for (const pickup of runner.pickups) {
    pickup.x -= speed;
  }
  runner.pickups = runner.pickups.filter((pickup) => !pickup.collected && pickup.x + pickup.r > -20);

  if (runner.portal) {
    runner.portal.x -= speed;
  }

  const boxHeight = duckActive ? player.h * 0.56 : player.h - 6;
  const playerBox = {
    x: player.x + 6,
    y: player.y + (duckActive ? player.h - boxHeight : 6),
    w: player.w - 12,
    h: boxHeight
  };

  for (const pickup of runner.pickups) {
    if (pickup.collected) {
      continue;
    }
    const hit = playerBox.x < pickup.x + pickup.r &&
      playerBox.x + playerBox.w > pickup.x - pickup.r &&
      playerBox.y < pickup.y + pickup.r &&
      playerBox.y + playerBox.h > pickup.y - pickup.r;
    if (!hit) {
      continue;
    }
    pickup.collected = true;
    state.runner.collectedCoins += pickup.value;
    extendCombo(1, pickup.x, pickup.y, "RUSH!");
    grantCoins(pickup.value, pickup.x, state.cameraY + 180, "#ffe066", `+${pickup.value}`);
  }

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
      const obstacleTop = obstacle.y - obstacle.h;
      const overlapX = playerBox.x < obstacle.x + obstacle.w &&
        playerBox.x + playerBox.w > obstacle.x;
      let hit = false;

      if (obstacle.type === "low") {
        hit = overlapX && playerBox.y + playerBox.h > obstacleTop + 2;
      } else {
        const grounded = player.y >= runnerGroundY - player.h - 0.5;
        hit = overlapX && (!duckActive || !grounded || playerBox.y < obstacle.y - 2);
      }

      if (!hit) {
        continue;
      }

      runner.obstacleCooldownUntil = state.elapsedMs + 700;
      addFloatingText(obstacle.type === "high" ? "DUKK!" : "HOPP!", obstacle.x, obstacleTop - 8, "#ff6b6b", 30);
      exitRunnerMode(false);
      break;
    }
  }
}

function stepSimulation() {
  state.elapsedMs += fixedStepMs;
  updateFloatingTexts();
  updateComboState();

  if (!state.running) {
    return;
  }

  if (state.mode === "runner") {
    updateRunnerPlayer();
    return;
  }

  if (state.mode === "secret") {
    updateSecretRoom();
    return;
  }

  if (state.mode === "coindash") {
    updateCoinDashMode();
    return;
  }

  updatePlatforms();
  updateJumperPlayer();
  spawnPlatforms();
}
function drawBackground() {
  ctx.clearRect(0, 0, width, height);
  const mapTheme = getSelectedMap().theme;

  if (state.mode === "secret") {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#12081f");
    gradient.addColorStop(0.6, "#34164f");
    gradient.addColorStop(1, "#6d3a7f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 18; i += 1) {
      const sparkX = (i * 29 + (state.elapsedMs * 0.05)) % (width + 40) - 20;
      const sparkY = 38 + (i * 31) % (height - 180);
      ctx.fillStyle = `hsla(${36 + (i % 4) * 12}, 95%, 72%, 0.12)`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#4b275f";
    ctx.fillRect(12, 28, width - 24, height - 144);
    ctx.fillStyle = "#241036";
    ctx.fillRect(28, 44, width - 56, height - 176);

    ctx.fillStyle = "rgba(255, 214, 102, 0.16)";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(74 + i * 62, 72 + (i % 2) * 10, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#7c5a33";
    ctx.fillRect(0, height - 112, width, 112);
    ctx.fillStyle = "#8f6b3d";
    for (let i = 0; i < 11; i += 1) {
      ctx.fillRect(i * 36, height - 112 + (i % 2) * 8, 22, 112);
    }

    ctx.fillStyle = "rgba(255, 225, 140, 0.14)";
    ctx.beginPath();
    ctx.moveTo(width / 2, 54);
    ctx.lineTo(width / 2 - 90, height - 112);
    ctx.lineTo(width / 2 + 90, height - 112);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (state.mode === "coindash") {
    const activeLane = state.coinDash.lane;
    const lanePulse = state.elapsedMs < state.coinDash.laneFlashUntil ? 0.34 : 0.14;
    const celebrate = state.elapsedMs < state.coinDash.celebrationUntil;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, celebrate ? "#173b5f" : "#091f33");
    gradient.addColorStop(1, celebrate ? "#1e5f79" : "#16425b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 3; i += 1) {
      const laneX = width * (0.22 + i * 0.28);
      ctx.fillStyle = i === activeLane ? `rgba(125, 211, 252, ${lanePulse})` : "rgba(255,255,255,0.05)";
      ctx.fillRect(laneX - 40, 0, 80, height);
      ctx.fillStyle = i === activeLane ? "rgba(219, 234, 254, 0.22)" : "rgba(255,255,255,0.12)";
      for (let y = 0; y < height; y += 34) {
        ctx.fillRect(laneX - 3, y + (state.elapsedMs / 18 + i * 9) % 34, 6, 18);
      }
    }
    ctx.fillStyle = "#0b1c2c";
    ctx.fillRect(0, height - 100, width, 100);
    return;
  }

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

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const guideY = runnerGroundY - 18 - i * 28;
      ctx.beginPath();
      ctx.moveTo(0, guideY);
      ctx.lineTo(width, guideY - 14);
      ctx.stroke();
    }

    ctx.fillStyle = "#283618";
    ctx.fillRect(0, runnerGroundY, width, height - runnerGroundY);
    ctx.fillStyle = "#606c38";
    for (let i = 0; i < 18; i += 1) {
      const x = ((i * 30) - offset) % (width + 30) - 30;
      ctx.fillRect(x, runnerGroundY + 6, 16, 4);
    }

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(runnerPlayerX + 40, runnerGroundY - 112, width - (runnerPlayerX + 52), 118);
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

  if (isFireworksActive()) {
    for (let i = 0; i < (lowFxMode ? 5 : 9); i += 1) {
      const burstX = (width * (0.12 + i * 0.1) + Math.sin(state.elapsedMs / 220 + i) * 22);
      const burstY = 72 + (i % 3) * 58 + Math.cos(state.elapsedMs / 260 + i) * 12;
      for (let j = 0; j < 6; j += 1) {
        const angle = (Math.PI * 2 * j) / 6 + state.elapsedMs / 380;
        ctx.strokeStyle = `hsla(${(state.elapsedMs / 7 + i * 28 + j * 18) % 360}, 95%, 72%, 0.34)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(burstX, burstY);
        ctx.lineTo(burstX + Math.cos(angle) * 16, burstY + Math.sin(angle) * 16);
        ctx.stroke();
      }
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

  if (isSecretHintWindow()) {
    const hintX = width - 24;
    const hintY = 122 + Math.sin(state.elapsedMs / 190) * 8;
    const swirl = Math.sin(state.elapsedMs / 120) * 5;
    ctx.fillStyle = "rgba(255, 230, 120, 0.12)";
    ctx.beginPath();
    ctx.arc(hintX - 8, hintY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 245, 180, 0.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 38, hintY - 12);
    ctx.quadraticCurveTo(width - 8 + swirl, hintY, width - 38, hintY + 12);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "bold 12px Trebuchet MS";
    ctx.fillText("?", width - 18, hintY + 4);
  }
}

function drawPlatforms() {
  if (state.mode !== "jumper") {
    return;
  }

  const mapId = getSelectedMap().id;
  const movingColor = mapId === "frost" ? "#5b8cff" : mapId === "sunset" ? "#7a3fff" : "#8a4fff";
  const staticColor = mapId === "frost" ? "#4c8bb5" : mapId === "sunset" ? "#9f5a2f" : state.level % 2 === 0 ? "#3d5f9b" : "#3d9b53";
  const glowColor = mapId === "frost" ? "#cde8ff" : mapId === "sunset" ? "#ffd8b1" : state.level % 2 === 0 ? "#8fb1ff" : "#7ad08e";

  for (const platform of state.platforms) {
    const screenY = platform.y - state.cameraY;
    ctx.save();
    ctx.fillStyle = platform.type === "boost" ? "#ff8c42" : platform.type === "ice" ? "#7dd3fc" : platform.cracked ? "#8d6f64" : platform.vx ? movingColor : staticColor;
    ctx.fillRect(platform.x, screenY, platform.w, platform.h);
    ctx.fillStyle = platform.type === "boost" ? "#ffe29a" : platform.type === "ice" ? "#effbff" : platform.cracked ? "#d8c0b1" : glowColor;
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

    if (platform.type === "boost") {
      ctx.strokeStyle = "#fff3bf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(platform.x + 12, screenY + platform.h - 2);
      ctx.lineTo(platform.x + platform.w / 2, screenY + 2);
      ctx.lineTo(platform.x + platform.w - 12, screenY + platform.h - 2);
      ctx.stroke();
    }

    if (platform.type === "ice") {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(platform.x + 10, screenY + 5);
      ctx.lineTo(platform.x + platform.w - 10, screenY + 5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawCollectibles() {
  if (state.mode === "secret" || state.mode === "coindash") {
    return;
  }
  if (state.mode === "runner") {
    for (const obstacle of state.runner.obstacles) {
      const obstacleTop = obstacle.y - obstacle.h;
      if (isAirhornCatastropheActive()) {
        if (obstacle.type === "high") {
          ctx.fillStyle = "#ff7a00";
          ctx.beginPath();
          ctx.moveTo(obstacle.x + obstacle.w / 2, obstacleTop);
          ctx.lineTo(obstacle.x + obstacle.w, obstacle.y);
          ctx.lineTo(obstacle.x, obstacle.y);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fff3bf";
          ctx.fillRect(obstacle.x + obstacle.w * 0.24, obstacleTop + obstacle.h * 0.35, obstacle.w * 0.52, 8);
          ctx.fillStyle = "#1f2937";
          ctx.fillRect(obstacle.x + obstacle.w * 0.28, obstacleTop + obstacle.h * 0.58, obstacle.w * 0.44, 7);
        } else {
          ctx.fillStyle = "#d97757";
          ctx.beginPath();
          ctx.roundRect(obstacle.x, obstacleTop + 6, obstacle.w, Math.max(18, obstacle.h - 10), 14);
          ctx.fill();
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(obstacle.x + 4, obstacleTop + 11, obstacle.w - 8, 5);
          ctx.fillRect(obstacle.x + 4, obstacle.y - 12, obstacle.w - 8, 5);
        }
      } else {
        if (obstacle.type === "high") {
          ctx.strokeStyle = "rgba(199,125,255,0.45)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(obstacle.x + obstacle.w * 0.24, obstacleTop - 22);
          ctx.lineTo(obstacle.x + obstacle.w * 0.24, obstacleTop);
          ctx.moveTo(obstacle.x + obstacle.w * 0.76, obstacleTop - 22);
          ctx.lineTo(obstacle.x + obstacle.w * 0.76, obstacleTop);
          ctx.stroke();
          ctx.fillStyle = "#7b2cbf";
          ctx.fillRect(obstacle.x, obstacleTop, obstacle.w, obstacle.h);
          ctx.fillStyle = "#c77dff";
          ctx.fillRect(obstacle.x + 6, obstacleTop + 8, obstacle.w - 12, 8);
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.fillRect(obstacle.x + 8, obstacleTop + obstacle.h * 0.32, obstacle.w - 16, 6);
        } else {
          ctx.fillStyle = "#bc4749";
          ctx.beginPath();
          ctx.roundRect(obstacle.x, obstacleTop + 6, obstacle.w, Math.max(20, obstacle.h - 10), 14);
          ctx.fill();
          ctx.fillStyle = "#f28482";
          ctx.fillRect(obstacle.x + 4, obstacleTop + 12, obstacle.w - 8, 6);
          ctx.fillRect(obstacle.x + 4, obstacle.y - 13, obstacle.w - 8, 6);
          ctx.fillStyle = "rgba(0,0,0,0.18)";
          ctx.fillRect(obstacle.x + 6, obstacle.y + 2, obstacle.w - 12, 5);
        }
      }

      if (obstacle.x > width - 300) {
        const markerY = obstacle.type === "high" ? 96 : 146;
        const markerColor = obstacle.type === "high" ? "#c77dff" : "#ff6b6b";
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
        ctx.fillRect(width - 126, markerY - 18, 108, 36);
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.moveTo(width - 22, markerY);
        ctx.lineTo(width - 48, markerY - 11);
        ctx.lineTo(width - 48, markerY + 11);
        ctx.closePath();
        ctx.fill();
        ctx.font = "bold 15px Trebuchet MS";
        ctx.fillText(obstacle.type === "high" ? "DUKK" : "HOPP", width - 114, markerY + 5);
      }
    }

    for (const pickup of state.runner.pickups) {
      const pulse = 1 + Math.sin((state.elapsedMs / 120) + pickup.x * 0.02) * 0.08;
      const glow = ctx.createRadialGradient(pickup.x, pickup.y, 2, pickup.x, pickup.y, pickup.r * 2.4);
      glow.addColorStop(0, "rgba(255,245,180,0.55)");
      glow.addColorStop(1, "rgba(255,245,180,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff3bf";
      ctx.beginPath();
      ctx.arc(pickup.x - 2, pickup.y - 2, pickup.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(122, 77, 0, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      if ((pickup.value || 1) > 1) {
        ctx.fillStyle = "#7a4d00";
        ctx.font = "bold 12px Trebuchet MS";
        ctx.fillText(String(pickup.value), pickup.x - 3, pickup.y + 4);
      }
    }

    if (state.runner.portal) {
      const portal = state.runner.portal;
      const wobble = 1 + Math.sin(state.elapsedMs / 110) * 0.05;
      ctx.save();
      ctx.translate(portal.x + portal.w / 2, portal.y + portal.h / 2);
      ctx.rotate((state.elapsedMs / 250) % (Math.PI * 2));
      const gradient = ctx.createRadialGradient(0, 0, 6, 0, 0, portal.w * 1.1);
      gradient.addColorStop(0, "rgba(255,255,255,0.98)");
      gradient.addColorStop(0.22, "rgba(144,224,255,0.85)");
      gradient.addColorStop(0.55, "rgba(0,209,255,0.5)");
      gradient.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, portal.w * 0.95 * wobble, portal.h * 0.62 * wobble, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.strokeStyle = `hsla(${190 + i * 18}, 95%, 72%, 0.68)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(portal.w * 0.08, 0);
        ctx.lineTo(portal.w * 0.48, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.78)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, portal.w * 0.58, portal.h * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  for (const item of state.collectibles) {
    if (item.collected) {
      continue;
    }

    const screenY = item.y - state.cameraY;
    const pulse = 1 + Math.sin((state.elapsedMs / 130) + item.x * 0.02) * 0.08;

    if (item.type === "coin") {
      ctx.fillStyle = isBananaActive() ? "#ffe066" : "#f9b208";
      ctx.beginPath();
      ctx.arc(item.x, screenY, item.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff3bf";
      ctx.beginPath();
      ctx.arc(item.x - 2, screenY - 2, item.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      if ((item.value || 1) > 1) {
        ctx.fillStyle = "#7a4d00";
        ctx.font = "bold 12px Trebuchet MS";
        ctx.fillText(String(item.value), item.x - 3, screenY + 4);
      }
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
      continue;
    }

    if (item.type === "rush") {
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(item.x - 13, screenY - 15, 26, 30);
      ctx.fillStyle = "#1e3a5f";
      ctx.fillRect(item.x - 8, screenY - 10, 5, 20);
      ctx.fillRect(item.x + 3, screenY - 10, 5, 20);
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(item.x - 4, screenY - 18, 8, 8);
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(item.x - 8, screenY + 14);
      ctx.lineTo(item.x - 2, screenY + 30 + Math.sin(state.elapsedMs / 45) * 4);
      ctx.lineTo(item.x + 1, screenY + 16);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(item.x + 8, screenY + 14);
      ctx.lineTo(item.x + 2, screenY + 30 + Math.sin(state.elapsedMs / 45 + 1) * 4);
      ctx.lineTo(item.x - 1, screenY + 16);
      ctx.fill();
      continue;
    }

    if (item.type === "firework") {
      ctx.save();
      ctx.translate(item.x, screenY);
      ctx.rotate(state.elapsedMs / 280);
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = `hsl(${(state.elapsedMs / 7 + i * 70) % 360}, 90%, 66%)`;
        ctx.fillRect(-3, -14, 6, 28);
        ctx.rotate(Math.PI / 4);
      }
      ctx.fillStyle = "#fff3bf";
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (item.type === "heart") {
      ctx.fillStyle = "#7cff95";
      ctx.beginPath();
      ctx.arc(item.x - 5, screenY - 2, 6, 0, Math.PI * 2);
      ctx.arc(item.x + 5, screenY - 2, 6, 0, Math.PI * 2);
      ctx.lineTo(item.x, screenY + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(item.x - 2, screenY - 2, 4, 9);
      ctx.fillRect(item.x - 5, screenY + 1, 10, 4);
    }
  }

  if (state.mode === "jumper") {
    const enemy = state.spectacle.enemy;
    if (enemy) {
      const enemyScreenY = enemy.y - state.cameraY;
      ctx.save();
      ctx.translate(enemy.x, enemyScreenY);
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(-6, -2, 4, 0, Math.PI * 2);
      ctx.arc(6, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-10, 10, 20, 7);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(enemy.side < 0 ? 8 : -14, -6, 10, 12);
      ctx.restore();
    }

    for (const projectile of state.spectacle.projectiles) {
      const projectileScreenY = projectile.y - state.cameraY;
      ctx.fillStyle = "#f87171";
      ctx.beginPath();
      ctx.arc(projectile.x, projectileScreenY, projectile.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(projectile.x - 2, projectileScreenY - projectile.r + 2, 4, 5);
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
  const screenY = state.mode === "jumper" ? player.y - state.cameraY : player.y;
  const catastropheScale = isAirhornCatastropheActive() ? 1.32 + Math.sin(state.elapsedMs / 90) * 0.06 : 1;
  const squash = 1 + player.bounceSquash * 0.12;
  const stretch = 1 - player.bounceSquash * 0.08;
  const ducking = state.mode === "runner" && isRunnerDuckActive();
  const coinDashHeroScale = state.mode === "coindash" ? 1.12 : 1;
  const idleBob = ducking ? 0 : Math.sin(state.elapsedMs / 140) * 1.8;
  const swagger = Math.sin(state.elapsedMs / 180) * 2.5;
  const bodyW = player.w * squash * catastropheScale * coinDashHeroScale;
  const bodyH = player.h * stretch * (ducking ? 0.68 : 1) * catastropheScale * coinDashHeroScale;
  const bodyX = screenX - (bodyW - player.w) / 2;
  const bodyY = screenY + (player.h - bodyH) + (ducking ? 8 : 0) - (catastropheScale - 1) * 10 + idleBob;
  const disco = isDiscoActive();

  if (skin.cost > 0 && state.mode !== "runner") {
    const aura = ctx.createRadialGradient(screenX + player.w / 2, screenY + player.h / 2, 8, screenX + player.w / 2, screenY + player.h / 2, skin.cost >= 200 ? 52 : 40);
    aura.addColorStop(0, "rgba(255,255,255,0.08)");
    aura.addColorStop(0.45, `${skin.colors.visor}22`);
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(screenX + player.w / 2, screenY + player.h / 2, skin.cost >= 200 ? 50 : 38, 0, Math.PI * 2);
    ctx.fill();

    if (!lowFxMode) {
      for (let i = 0; i < (skin.cost >= 200 ? 3 : 2); i += 1) {
        const sparkleX = screenX + 8 + i * 14 + Math.sin(state.elapsedMs / 160 + i) * 5;
        const sparkleY = screenY + 6 + i * 11 + Math.cos(state.elapsedMs / 180 + i) * 4;
        ctx.fillStyle = skin.colors.visor;
        ctx.fillRect(sparkleX - 1, sparkleY - 4, 2, 8);
        ctx.fillRect(sparkleX - 4, sparkleY - 1, 8, 2);
      }
    }
  }

  if ((isJetpackActive() || isRushActive()) && state.mode !== "runner") {
    const flameScale = isRushActive() ? 1.55 : 1;
    const flameColor = isRushActive() ? "rgba(56,189,248,0.68)" : "rgba(255,140,66,0.55)";
    ctx.fillStyle = flameColor;
    ctx.beginPath();
    ctx.moveTo(screenX + player.w * 0.28, screenY + player.h);
    ctx.lineTo(screenX + player.w * 0.18, screenY + player.h + (20 * flameScale) + Math.sin(state.elapsedMs / 40) * 4);
    ctx.lineTo(screenX + player.w * 0.38, screenY + player.h + (12 * flameScale));
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(screenX + player.w * 0.72, screenY + player.h);
    ctx.lineTo(screenX + player.w * 0.62, screenY + player.h + (20 * flameScale) + Math.sin(state.elapsedMs / 40 + 1) * 4);
    ctx.lineTo(screenX + player.w * 0.82, screenY + player.h + (12 * flameScale));
    ctx.fill();
  }

  if (state.mode === "runner" && isRunnerDuckActive()) {
    ctx.fillStyle = "rgba(0,209,255,0.18)";
    ctx.fillRect(screenX - 10, screenY + 26, player.w + 20, 10);
  }

  const bodyGlow = ctx.createRadialGradient(bodyX + bodyW / 2, bodyY + bodyH / 2, 10, bodyX + bodyW / 2, bodyY + bodyH / 2, Math.max(bodyW, bodyH));
  bodyGlow.addColorStop(0, disco ? "rgba(255,255,255,0.16)" : state.mode === "coindash" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)");
  bodyGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bodyGlow;
  ctx.beginPath();
  ctx.roundRect(bodyX - 8, bodyY + 2, bodyW + 16, bodyH + 8, 22);
  ctx.fill();

  ctx.fillStyle = disco ? `hsl(${(state.elapsedMs / 6) % 360}, 80%, 52%)` : skin.colors.body;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY + 8, bodyW, bodyH - 8, 16);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(bodyX + 6, bodyY + 12, Math.max(10, bodyW * 0.2), Math.max(14, bodyH * 0.4));

  ctx.fillStyle = skin.id === "melon" ? "#2f6f36" :
    skin.id === "robot" ? "#d7dee9" :
    skin.id === "toast" ? "#f4d4a5" :
    skin.id === "ghost" ? "#f8fbff" :
    skin.id === "duck" ? "#ffe08a" :
    skin.id === "disco" ? "#ffd0f4" :
    skin.id === "ninja" ? "#d1d5db" :
    skin.id === "banana_orange" ? "#ffe066" :
    skin.id === "shrimp_king" ? "#ffd6db" :
    skin.id === "potato_cowboy" ? "#d6b690" :
    skin.id === "sausage_wizard" ? "#ffc6a0" :
    skin.id === "cone_lord" ? "#ffe3bf" :
    skin.id === "grandma_turbo" ? "#f5d0fe" :
    skin.id === "mop_dj" ? "#cffafe" :
    skin.id === "cheese_prophet" ? "#fff3b0" :
    "#ffd7a8";
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
  ctx.lineTo(screenX + player.w - 5, bodyY + 22 + Math.sin(state.elapsedMs / 120) * 1.4);
  ctx.lineTo(screenX + player.w - 8, bodyY + 30 + Math.sin(state.elapsedMs / 100 + 0.8) * 2.2);
  ctx.lineTo(screenX + 8, bodyY + 32 + Math.sin(state.elapsedMs / 100) * 2.2);
  ctx.fill();

  if (isAirhornCatastropheActive()) {
    ctx.fillStyle = "rgba(255, 224, 138, 0.92)";
    ctx.beginPath();
    ctx.moveTo(screenX + player.w - 4, bodyY + 8);
    ctx.lineTo(screenX + player.w + 20, bodyY + 2);
    ctx.lineTo(screenX + player.w + 20, bodyY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(screenX + player.w - 8, bodyY + 10, 12, 6);
    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 16px Trebuchet MS";
    ctx.fillText("OOMPA", screenX - 8, bodyY - 8);
  }

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
  if (skin.id === "ghost") {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(screenX + player.w / 2, bodyY + 28, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  if (skin.id === "duck") {
    ctx.fillStyle = "#ff9f1c";
    ctx.beginPath();
    ctx.moveTo(screenX + player.w / 2, bodyY + 16);
    ctx.lineTo(screenX + player.w / 2 + 12, bodyY + 20);
    ctx.lineTo(screenX + player.w / 2, bodyY + 24);
    ctx.closePath();
    ctx.fill();
  }
  if (skin.id === "disco") {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(screenX + 8 + i * 10, bodyY + 26 + (i % 2) * 3, 5, 5);
    }
  }
  if (skin.id === "ninja") {
    ctx.fillStyle = "#111827";
    ctx.fillRect(screenX + 8, bodyY + 20, player.w - 16, 10);
  }
  if (skin.id === "banana_orange") {
    ctx.fillStyle = "#fb8500";
    ctx.beginPath();
    ctx.arc(screenX + player.w / 2, bodyY + 2, 10, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb703";
    ctx.beginPath();
    ctx.arc(screenX + player.w / 2 - 7, bodyY + 1, 3, 0, Math.PI * 2);
    ctx.arc(screenX + player.w / 2 + 7, bodyY + 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (skin.id === "shrimp_king") {
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX + 12, bodyY + 6);
    ctx.lineTo(screenX + 18, bodyY - 2);
    ctx.lineTo(screenX + 24, bodyY + 6 + Math.sin(state.elapsedMs / 130) * 1.2);
    ctx.lineTo(screenX + 30, bodyY - 2);
    ctx.lineTo(screenX + 36, bodyY + 6);
    ctx.stroke();
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX + player.w / 2, bodyY + 18, 10, -0.2, 1.4);
    ctx.stroke();
  }
  if (skin.id === "potato_cowboy") {
    ctx.fillStyle = "#6d4c41";
    ctx.fillRect(screenX + 8, bodyY + 2, player.w - 16, 4);
    ctx.fillRect(screenX + 14, bodyY - 2, player.w - 28, 6);
    ctx.fillStyle = "#3b2416";
    ctx.fillRect(screenX + player.w / 2 - 7, bodyY + 18, 14, 3);
  }
  if (skin.id === "sausage_wizard") {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(screenX + player.w / 2, bodyY - 4);
    ctx.lineTo(screenX + player.w / 2 + 10, bodyY + 10);
    ctx.lineTo(screenX + player.w / 2 - 10, bodyY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,224,138,0.55)";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(screenX + player.w / 2 - 1, bodyY - 10 - i * 6 - Math.sin(state.elapsedMs / 90 + i) * 2, 2, 4);
    }
  }
  if (skin.id === "cone_lord") {
    ctx.fillStyle = "#fff3bf";
    ctx.fillRect(screenX + 14, bodyY + 2, player.w - 28, 3);
    ctx.fillStyle = "#ff7a00";
    ctx.beginPath();
    ctx.moveTo(screenX + player.w / 2, bodyY - 8);
    ctx.lineTo(screenX + player.w / 2 + 10, bodyY + 8);
    ctx.lineTo(screenX + player.w / 2 - 10, bodyY + 8);
    ctx.closePath();
    ctx.fill();
  }
  if (skin.id === "grandma_turbo") {
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(screenX + player.w / 2, bodyY + 4, 8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX + 14, bodyY + 14, 4, 0, Math.PI * 2);
    ctx.arc(screenX + player.w - 14, bodyY + 14, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (skin.id === "mop_dj") {
    ctx.strokeStyle = "#164e63";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX + 14, bodyY + 6, 5, 0, Math.PI * 2);
    ctx.arc(screenX + player.w - 14, bodyY + 6, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX + player.w / 2, bodyY - 2);
    ctx.lineTo(screenX + player.w / 2 + 12 + swagger, bodyY - 12);
    ctx.stroke();
    ctx.fillStyle = "#e0f2fe";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(screenX + player.w / 2 + 9 + swagger + i * 2, bodyY - 15 + i * 3, 2, 6);
    }
  }
  if (skin.id === "cheese_prophet") {
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.moveTo(screenX + 10, bodyY + 10);
    ctx.lineTo(screenX + player.w - 10, bodyY + 6);
    ctx.lineTo(screenX + player.w - 14, bodyY + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(253,224,71,0.45)";
    ctx.beginPath();
    ctx.arc(screenX + player.w / 2, bodyY - 6, 8 + Math.sin(state.elapsedMs / 120) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

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

  const remaining = Math.max(0, Math.floor((state.runner.portalDistance - state.runner.distance) / 10));
  const nextObstacle = getNextRunnerObstacle();
  const panelGradient = ctx.createLinearGradient(14, 14, 350, 106);
  panelGradient.addColorStop(0, "rgba(10, 20, 38, 0.82)");
  panelGradient.addColorStop(1, "rgba(26, 45, 72, 0.62)");
  ctx.fillStyle = panelGradient;
  ctx.fillRect(14, 14, 344, 98);
  ctx.fillStyle = "rgba(125, 211, 252, 0.2)";
  ctx.fillRect(14, 14, 344, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Trebuchet MS";
  ctx.fillText(`Portal om ${remaining} m`, 24, 38);
  ctx.fillStyle = "#7dd3fc";
  ctx.font = "bold 13px Trebuchet MS";
  ctx.fillText(state.runner.variantLabel.toUpperCase(), 252, 38);
  ctx.fillStyle = "#dbeafe";
  ctx.font = "13px Trebuchet MS";
  ctx.fillText(`Venstre: hopp   H\u00f8yre: dukk`, 24, 58);
  ctx.fillText(`Banemynter: ${state.runner.collectedCoins}   Fullf\u00f8r: +${state.runner.clearBonusCoins} bonus`, 24, 78);
  ctx.fillStyle = "#fecdd3";
  ctx.fillText(`Krasj: -${Math.min(state.coins, state.runner.failCoinPenalty || runnerFailCoinPenalty)} run-mynter`, 24, 98);

  if (nextObstacle && nextObstacle.x < width + 40) {
    const action = nextObstacle.type === "high" ? "DUKK" : "HOPP";
    const accent = nextObstacle.type === "high" ? "#c77dff" : "#ff6b6b";
    const hintDistance = Math.max(0, Math.floor((nextObstacle.x - runnerPlayerX) / 12));
    ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
    ctx.fillRect(238, 58, 108, 42);
    ctx.fillStyle = accent;
    ctx.font = "bold 18px Trebuchet MS";
    ctx.fillText(action, 248, 78);
    ctx.font = "12px Trebuchet MS";
    ctx.fillText(`${hintDistance} m`, 249, 95);
  }
}

function drawStatusEffects() {
  if (state.mode === "runner") {
    return;
  }
  const labels = [];
  if (isRushActive()) {
    labels.push({ text: "SUPERJETPACK", color: "#7dd3fc" });
  }
  if (isJetpackActive()) {
    labels.push({ text: "JETPACK", color: "#ffb366" });
  }
  if (isFireworksActive()) {
    labels.push({ text: "FYRVERKERI", color: "#fff0a6" });
  }
  if (state.spectacle.reserveLife) {
    labels.push({ text: "EKSTRALIV", color: "#7cff95" });
  }
  if (!labels.length) {
    return;
  }
  ctx.save();
  ctx.font = "bold 14px Trebuchet MS";
  let x = 16;
  for (const label of labels) {
    const labelWidth = ctx.measureText(label.text).width + 18;
    ctx.fillStyle = "rgba(15, 23, 42, 0.62)";
    ctx.fillRect(x, 14, labelWidth, 28);
    ctx.fillStyle = label.color;
    ctx.fillText(label.text, x + 9, 33);
    x += labelWidth + 8;
  }
  ctx.restore();
}
function drawRushOverlay() {
  if (!isRushActive() || state.mode === "runner") {
    return;
  }
  const player = state.player;
  const centerX = player.x + player.w / 2;
  const centerY = player.y - state.cameraY + player.h / 2;
  const gradient = ctx.createRadialGradient(centerX, centerY, 26, centerX, centerY, 220);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.34, "rgba(8,15,28,0.05)");
  gradient.addColorStop(0.7, "rgba(8,15,28,0.42)");
  gradient.addColorStop(1, "rgba(8,15,28,0.94)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.strokeStyle = "rgba(125, 211, 252, 0.24)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i += 1) {
    const offset = (state.elapsedMs * 0.34 + i * 32) % width;
    ctx.beginPath();
    ctx.moveTo(offset, centerY + Math.sin((state.elapsedMs / 90) + i) * 140);
    ctx.lineTo(offset - 24, centerY + Math.cos((state.elapsedMs / 70) + i) * 36);
    ctx.stroke();
  }
  ctx.restore();
}
function drawSpecialModeUi() {
  if (state.mode === "secret") {
    ctx.save();
    ctx.fillStyle = "rgba(14, 8, 28, 0.5)";
    ctx.fillRect(24, height - 156, 72, 82);
    ctx.fillStyle = "#2d1b46";
    ctx.fillRect(34, height - 150, 54, 74);
    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 14px Trebuchet MS";
    ctx.fillText("UT", 48, height - 108);
    ctx.fillStyle = "rgba(255,230,102,0.24)";
    ctx.fillRect(56, height - 140, 10, 54);

    const chestX = width / 2 - 46;
    const chestY = height - 186;
    const chestGlow = ctx.createRadialGradient(width / 2, chestY + 20, 8, width / 2, chestY + 20, 92);
    chestGlow.addColorStop(0, state.secret.rewardClaimed ? "rgba(255,255,255,0.18)" : "rgba(255,224,138,0.32)");
    chestGlow.addColorStop(1, "rgba(255,224,138,0)");
    ctx.fillStyle = chestGlow;
    ctx.fillRect(chestX - 30, chestY - 36, 152, 116);
    ctx.fillStyle = state.secret.rewardClaimed ? "#8d6f64" : "#c08457";
    ctx.fillRect(chestX, chestY, 92, 44);
    ctx.fillStyle = state.secret.rewardClaimed ? "#9ca3af" : "#fbbf24";
    ctx.fillRect(chestX - 4, chestY - 14, 100, 18);
    ctx.fillStyle = state.secret.rewardClaimed ? "#6b7280" : "#fff3bf";
    ctx.fillRect(chestX + 38, chestY - 6, 16, 18);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(chestX, chestY, 92, 44);

    for (const coin of state.secret.roomCoins) {
      const glow = ctx.createRadialGradient(coin.x, coin.y, 2, coin.x, coin.y, coin.r * 2.2);
      glow.addColorStop(0, "rgba(255,245,180,0.45)");
      glow.addColorStop(1, "rgba(255,245,180,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(coin.x - 1, coin.y - coin.r + 2, 2, coin.r - 1);
    }

    const panel = ctx.createLinearGradient(16, 16, 326, 108);
    panel.addColorStop(0, "rgba(13, 18, 34, 0.82)");
    panel.addColorStop(1, "rgba(52, 22, 79, 0.72)");
    ctx.fillStyle = panel;
    ctx.fillRect(16, 16, 316, 96);
    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 22px Trebuchet MS";
    ctx.fillText("Hemmelig rom", 30, 42);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "16px Trebuchet MS";
    ctx.fillText(state.secret.rewardClaimed ? "G\u00e5 til venstre d\u00f8r for \u00e5 komme tilbake" : "Snus borti kista for 500 mynter", 30, 68);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText("Hintet var gl\u00f8den til h\u00f8yre ved 500 m", 30, 92);
    ctx.restore();
    return;
  }

  if (state.mode === "coindash") {
    ctx.save();
    const celebrate = state.elapsedMs < state.coinDash.celebrationUntil;
    const laneFlash = state.elapsedMs < state.coinDash.laneFlashUntil;
    const playerCenterX = state.player.x + state.player.w / 2;
    const playerCenterY = state.player.y + state.player.h * 0.72;
    const spotlight = ctx.createRadialGradient(playerCenterX, playerCenterY, 10, playerCenterX, playerCenterY, 90);
    spotlight.addColorStop(0, celebrate ? "rgba(255,240,180,0.34)" : laneFlash ? "rgba(125,211,252,0.28)" : "rgba(255,255,255,0.18)");
    spotlight.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spotlight;
    ctx.fillRect(state.player.x - 60, state.player.y - 44, state.player.w + 120, state.player.h + 100);

    if (laneFlash || celebrate) {
      ctx.save();
      ctx.globalAlpha = celebrate ? 0.5 : 0.35;
      ctx.strokeStyle = celebrate ? "#fff0a6" : "#7dd3fc";
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i += 1) {
        const startX = state.player.x - 38 - i * 14;
        const y = state.player.y + 26 + i * 12;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + 32, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const pickup of state.coinDash.pickups) {
      if (pickup.type === "coin") {
        const glow = ctx.createRadialGradient(pickup.x, pickup.y, 2, pickup.x, pickup.y, pickup.r * 2.4);
        glow.addColorStop(0, pickup.value >= 5 ? "rgba(255,255,200,0.55)" : "rgba(255,220,120,0.45)");
        glow.addColorStop(1, "rgba(255,220,120,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, pickup.r * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pickup.value >= 5 ? "#fff0a6" : "#ffd166";
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, pickup.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.38)";
        ctx.fillRect(pickup.x - 1, pickup.y - pickup.r + 2, 2, pickup.r - 1);
      } else {
        ctx.save();
        ctx.translate(pickup.x, pickup.y);
        ctx.rotate((pickup.y / 40) % (Math.PI * 2));
        ctx.fillStyle = "#9ca3af";
        ctx.fillRect(-pickup.r, -pickup.r, pickup.r * 2, pickup.r * 2);
        ctx.fillStyle = "#475569";
        ctx.fillRect(-pickup.r + 3, -2, pickup.r * 2 - 6, 4);
        ctx.restore();
      }
    }

    const panel = ctx.createLinearGradient(16, 16, 338, 116);
    panel.addColorStop(0, "rgba(13, 18, 34, 0.82)");
    panel.addColorStop(1, "rgba(12, 58, 84, 0.72)");
    ctx.fillStyle = panel;
    ctx.fillRect(16, 16, 324, 112);
    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 22px Trebuchet MS";
    ctx.fillText("Coin Dash", 30, 42);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "16px Trebuchet MS";
    ctx.fillText("Tid igjen: " + Math.max(0, Math.ceil((state.coinDash.endAt - state.elapsedMs) / 1000)) + "s", 30, 68);
    ctx.fillText("Bonusmynter: " + state.coinDash.collected, 30, 90);
    ctx.fillStyle = celebrate ? "#fff0a6" : "rgba(255,255,255,0.72)";
    ctx.fillText("Din figur: " + getSelectedSkin().name, 30, 112);
    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.fillRect(238, height - 118, 110, 72);
    ctx.fillStyle = laneFlash ? "#fff0a6" : "#7dd3fc";
    ctx.font = "bold 15px Trebuchet MS";
    ctx.fillText(["VENSTRE", "MIDT", "HOYRE"][state.coinDash.lane], 250, height - 86);
    ctx.fillStyle = "rgba(255,255,255,0.74)";
    ctx.font = "12px Trebuchet MS";
    ctx.fillText("aktiv bane", 250, height - 66);
    ctx.restore();
  }
}
function drawFrame() {
  drawBackground();
  drawPlatforms();
  drawCollectibles();
  drawPlayer();
  drawFloatingTexts();
  drawRunnerUi();
  drawSpecialModeUi();
  drawStatusEffects();
  drawRushOverlay();
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
  closeSettingsMenu();
  updateTouchButtonsVisibility();
  state.player.vy = getJumpVelocity();

  if (state.progression.selectedSkill === "frog_hop") {
    addFloatingText("FROSKEHOPP!", width / 2, state.cameraY + 220, "#7cff95", 65);
  }
  if (state.progression.selectedSkill === "superspeed") {
    addFloatingText("SUPERSPEED!", width / 2, state.cameraY + 220, "#7dd3fc", 65);
  }
  if (state.progression.selectedSkill === "magnet") {
    addFloatingText("MAGNETMODUS!", width / 2, state.cameraY + 220, "#ffe066", 65);
  }
  if (state.progression.selectedSkill === "moon_boots") {
    addFloatingText("M\u00c5NEST\u00d8VLER!", width / 2, state.cameraY + 220, "#dbeafe", 65);
  }
  if (state.progression.selectedSkill === "party_hat") {
    addFloatingText("FESTHATT!", width / 2, state.cameraY + 220, "#ff4fd8", 65);
  }
  if (state.progression.selectedSkill === "tiny_drama") {
    addFloatingText("FULLT DRAMA!", width / 2, state.cameraY + 220, "#ffffff", 65);
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

  if (!state.player || Math.abs(dx) < 1) {
    return;
  }

  const speedMult = getControlSpeedMultiplier();
  const speedSkillScale = isSpeedSkillActive() ? 1.28 : 1;
  const swipeSpeed = dx / dt;
  state.touch.lastSwipeSpeed = (state.touch.lastSwipeSpeed * 0.35) + (swipeSpeed * 0.65);

  const targetVx = clamp(swipeSpeed * 13.2 * speedMult * speedSkillScale, -5.8 * speedMult * speedSkillScale, 5.8 * speedMult * speedSkillScale);
  const impulse = Math.sign(swipeSpeed) * Math.pow(Math.abs(swipeSpeed), 0.88) * 1.25 * speedMult * speedSkillScale;
  state.player.vx = clamp((state.player.vx * 0.45) + (targetVx * 0.55) + clamp(impulse, -1.65 * speedMult * speedSkillScale, 1.65 * speedMult * speedSkillScale), -6.1 * speedMult * speedSkillScale, 6.1 * speedMult * speedSkillScale);
}

function clearTouchInput() {
  state.touch.active = false;
  state.touch.pointerId = null;
  state.touch.startX = 0;


  state.touch.lastX = 0;
  state.touch.lastTime = 0;
  state.touch.lastSwipeSpeed = 0;
}

function handleRunnerTap(pointX) {
  if (pointX < width / 2) {
    state.runner.jumpQueued = true;
  } else {
    state.runner.duckQueued = true;
  }
}

function updateTouchButtonLabels() {
  if (!touchLeftBtnEl || !touchRightBtnEl) {
    return;
  }

  if (state.mode === "runner") {
    touchLeftBtnEl.innerHTML = "&#8593;";
    touchRightBtnEl.innerHTML = "&#8595;";
    touchLeftBtnEl.setAttribute("aria-label", "Hopp");
    touchRightBtnEl.setAttribute("aria-label", "Dukk");
    return;
  }

  touchLeftBtnEl.innerHTML = "&#8592;";
  touchRightBtnEl.innerHTML = "&#8594;";
  touchLeftBtnEl.setAttribute("aria-label", "Venstre");
  touchRightBtnEl.setAttribute("aria-label", "H\u00f8yre");
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowDown", " ", "Spacebar", "Enter"].includes(event.key)) {
    event.preventDefault();
  }

  ensureMusic();

  if (state.mode === "runner") {
    if (["ArrowLeft", "a", "A", " ", "Spacebar", "Enter"].includes(event.key)) {
      state.runner.jumpQueued = true;
    }
    if (["ArrowRight", "ArrowDown", "s", "S"].includes(event.key) || event.key.toLowerCase() === "d") {
      state.runner.duckQueued = true;
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

  if (state.mode === "coindash") {
    state.coinDash.lane = point.x < width / 3 ? 0 : point.x > width * (2 / 3) ? 2 : 1;
    state.player.bounceSquash = 0.6;
    return;
  }

  if (state.controlMode === "buttons") {
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
  if (!state.touch.active || state.touch.pointerId !== event.pointerId || !(state.mode === "jumper" || state.mode === "secret")) {
    return;
  }
  const point = getCanvasPoint(event);
  applyTouchSwipe(point.x, event.timeStamp);
});

const releasePointer = (event) => {
  if (state.touch.pointerId !== null && event.pointerId !== undefined && state.touch.pointerId !== event.pointerId) {
    return;
  }

  if (state.running && state.mode === "jumper" && state.player && isCoarsePointer) {
    const speedMult = getControlSpeedMultiplier();
    const flick = state.touch.lastSwipeSpeed || 0;
    if (Math.abs(flick) > 0.08) {
      const flickBoost = clamp(flick * 7.2 * speedMult, -3.0 * speedMult, 3.0 * speedMult);
      state.player.vx = clamp(state.player.vx + flickBoost, -6.4 * speedMult, 6.4 * speedMult);
    }
  }

  clearTouchInput();
};

canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("lostpointercapture", releasePointer);

function bindTouchPad(button, direction) {
  if (!button) {
    return;
  }

  const release = () => setKeyboardInput(direction, false);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureMusic();
    if (!state.running || state.controlMode !== "buttons") {
      return;
    }
    if (state.mode === "runner") {
      if (direction === "left") {
        state.runner.jumpQueued = true;
      } else {
        state.runner.duckQueued = true;
      }
      return;
    }
    if (!(state.mode === "jumper" || state.mode === "secret" || state.mode === "coindash")) {
      return;
    }
    setKeyboardInput(direction, true);
    if (button.setPointerCapture) {
      button.setPointerCapture(event.pointerId);
    }
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("lostpointercapture", release);
}

bindTouchPad(touchLeftBtnEl, "left");
bindTouchPad(touchRightBtnEl, "right");
for (const categoryButton of shopCategoryEls) {
  categoryButton.onclick = () => {
    setShopCategory(categoryButton.dataset.category || "skins");
  };
  categoryButton.onpointerup = (event) => {
    event.preventDefault();
    categoryButton.click();
  };
}

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



function positionTouchButtons() {
  if (!touchButtonsEl) {
    return;
  }

  const leftInset = canvas.offsetLeft + 8;
  const topPos = canvas.offsetTop + canvas.clientHeight - 66;
  const widthPx = Math.max(120, canvas.clientWidth - 16);

  touchButtonsEl.style.left = `${leftInset}px`;
  touchButtonsEl.style.width = `${widthPx}px`;
  touchButtonsEl.style.top = `${topPos}px`;
}

function updateTouchButtonsVisibility() {
  if (!touchButtonsEl) {
    return;
  }

  updateTouchButtonLabels();
  const isPlayableMode = state.mode === "jumper" || state.mode === "runner" || state.mode === "secret" || state.mode === "coindash";
  const shouldShow = isCoarsePointer && state.running && isPlayableMode && state.controlMode === "buttons" && overlayEl.classList.contains("hidden") && (settingsPanelEl?.classList.contains("hidden") ?? true);
  if (shouldShow) {
    positionTouchButtons();
  }
  touchButtonsEl.classList.toggle("hidden", !shouldShow);
}

function updateControlModeUi() {
  if (controlModeSwipeEl) {
    controlModeSwipeEl.classList.toggle("active", state.controlMode === "swipe");
  }
  if (controlModeButtonsEl) {
    controlModeButtonsEl.classList.toggle("active", state.controlMode === "buttons");
  }
  if (state.controlMode === "swipe") {
    setKeyboardInput("left", false);
    setKeyboardInput("right", false);
  }
  updateTouchButtonsVisibility();
}

function setControlMode(mode) {
  state.controlMode = mode === "swipe" ? "swipe" : "buttons";
  localStorage.setItem(controlModeKey, state.controlMode);
  clearTouchInput();
  updateControlModeUi();
}

function openSettingsMenu() {
  if (!settingsPanelEl || !settingsPanelEl.classList.contains("hidden")) {
    return;
  }
  settingsPanelEl.classList.remove("hidden");
  updateTouchButtonsVisibility();
  if (state.running) {
    state.running = false;
    state.pausedBySettings = true;
  }
}

function closeSettingsMenu() {
  if (!settingsPanelEl || settingsPanelEl.classList.contains("hidden")) {
    return;
  }
  settingsPanelEl.classList.add("hidden");
  if (state.pausedBySettings) {
    state.running = true;
    state.pausedBySettings = false;
    state.lastFrameTime = 0;
  }
  updateTouchButtonsVisibility();
}

if (pauseMenuBtnEl) {
  pauseMenuBtnEl.addEventListener("click", (event) => {
    event.preventDefault();
    if (settingsPanelEl && settingsPanelEl.classList.contains("hidden")) {
      openSettingsMenu();
    } else {
      closeSettingsMenu();
    }
  });
}

if (settingsResumeEl) {
  settingsResumeEl.addEventListener("click", (event) => {
    event.preventDefault();
    closeSettingsMenu();
  });
}


if (controlModeSwipeEl) {
  controlModeSwipeEl.addEventListener("click", () => {
    setControlMode("swipe");
  });
}

if (controlModeButtonsEl) {
  controlModeButtonsEl.addEventListener("click", () => {
    setControlMode("buttons");
  });
}
window.addEventListener("resize", () => {
  positionTouchButtons();
  updateTouchButtonsVisibility();
});

window.addEventListener("orientationchange", () => {
  positionTouchButtons();
  updateTouchButtonsVisibility();
});
state.progression = loadProgression();
applyBodyTheme();
resetGame();
showStartOverlay();
updateHud();
renderShop();
updateControlModeUi();
updateTouchButtonsVisibility();
fetchLeaderboard();
requestAnimationFrame(loop);




