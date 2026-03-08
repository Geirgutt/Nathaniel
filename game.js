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
const coinsPerLevel = 12;
const leaderboardLimit = 10;
const discoDurationMs = 8000;
const jetpackDurationMs = 900;
const runnerDashDurationMs = 380;
const supabaseConfig = window.SUPABASE_CONFIG || { url: "", publishableKey: "", table: "scores" };
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const lowFxMode = isCoarsePointer;

const music = {
  context: null,
  master: null,
  bassGain: null,
  leadGain: null,
  pulseGain: null,
  active: false,
  nextNoteTime: 0,
  step: 0,
  sequence: [
    { bass: 110.0, lead: 659.25, pulse: true },
    { bass: 146.83, lead: 783.99, pulse: false },
    { bass: 123.47, lead: 698.46, pulse: true },
    { bass: 164.81, lead: 880.0, pulse: true },
    { bass: 110.0, lead: 587.33, pulse: false },
    { bass: 146.83, lead: 783.99, pulse: true },
    { bass: 123.47, lead: 698.46, pulse: false },
    { bass: 174.61, lead: 987.77, pulse: true }
  ],
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
  keys: { left: false, right: false },
  player: null,
  platforms: [],
  collectibles: [],
  floatingTexts: [],
  lastFrameTime: 0,
  accumulator: 0,
  elapsedMs: 0,
  effects: {
    discoUntil: 0,
    jetpackUntil: 0
  },
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

function setControlMode() {
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
  setOverlay("Trykk pa start og hopp sa hoyt du kan. Portal run venter ved 2000 meter.", "Start spill", true);
}

async function showGameOverOverlay() {
  const score = Math.floor(state.heightScore);
  scoreEntryEl.classList.add("hidden");
  leaderboardPanelEl.classList.remove("hidden");
  saveScoreEl.disabled = false;

  const scores = await fetchLeaderboard();
  const qualifies = qualifiesForLeaderboard(score);

  if (qualifies) {
    scoreEntryEl.classList.remove("hidden");
    setScoreStatus("Ny toppliste-score. Lagre navnet ditt.");
  } else if (scores.length) {
    setScoreStatus("Ikke top 10 denne gangen, men her er lista.");
  }

  setOverlay(`Du kom til level ${state.level} og nadde ${score} meter.`, "Prov igjen", true);
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

function activateDisco() {
  state.effects.discoUntil = state.elapsedMs + discoDurationMs;
  addFloatingText("DISCO!", width / 2, state.cameraY + 220, "#ff4fd8", 70);
}

function activateJetpack() {
  state.effects.jetpackUntil = state.elapsedMs + jetpackDurationMs;
  state.player.vy = -17;
  addFloatingText("JETPACK!", state.player.x + state.player.w / 2, state.player.y - 18, "#ff8c42", 60);
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
  const sequence = runnerMode ? music.runnerSequence : disco ? music.discoSequence : music.sequence;
  const lookAhead = 0.18;
  const intensity = Math.min(1, 0.22 + (state.heightScore / 90) + (state.level - 1) * 0.14 + (disco ? 0.3 : 0) + (runnerMode ? 0.2 : 0));
  const beatLength = state.running ? (runnerMode ? 0.18 : disco ? 0.16 : 0.24) - intensity * 0.05 : 0.29;

  music.master.gain.setTargetAtTime(state.running ? (runnerMode ? 0.22 : disco ? 0.24 : 0.19) : 0.1, music.context.currentTime, 0.08);
  music.leadGain.gain.setTargetAtTime(0.05 + intensity * 0.07, music.context.currentTime, 0.08);
  music.pulseGain.gain.setTargetAtTime(state.running ? (runnerMode ? 0.065 : disco ? 0.075 : 0.05) : 0.025, music.context.currentTime, 0.08);

  while (music.nextNoteTime < music.context.currentTime + lookAhead) {
    const note = sequence[music.step % sequence.length];
    scheduleTone(runnerMode ? "square" : disco ? "sawtooth" : "triangle", note.bass, music.nextNoteTime, beatLength * 0.9, music.bassGain, 0.6);
    scheduleTone(runnerMode ? "triangle" : disco ? "triangle" : "square", note.lead * (music.step % 2 === 0 ? 1.0 : 0.5), music.nextNoteTime, beatLength * 0.58, music.leadGain, 0.24 + intensity * 0.08);

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
  return Math.max(40, basePlatformWidth - state.level * 4 - difficulty * 26);
}

function getPlatformGap() {
  const difficulty = getRunDifficulty();
  return Math.min(154, basePlatformGap + state.level * 5 + difficulty * 24);
}

function getJumpVelocity() {
  const difficulty = getRunDifficulty();
  return baseJumpVelocity - Math.min(1.2, (state.level - 1) * 0.1) - difficulty * 0.65;
}

function getGravity(vy) {
  const difficulty = getRunDifficulty();

  if (vy < -7) {
    return 0.22 + difficulty * 0.015;
  }
  if (vy < -2) {
    return 0.18 + difficulty * 0.02;
  }
  if (vy < 1.2) {
    return 0.12 + difficulty * 0.02;
  }
  if (vy < 6) {
    return 0.27 + difficulty * 0.025;
  }
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
  setControlMode();

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
  setControlMode();

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
  state.floatingTexts = [];
  state.runner.triggered = false;
  state.runner.completed = false;
  resetRunnerState();

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
  setControlMode();
}

function updateHud() {
  scoreEl.textContent = `${Math.floor(state.heightScore)} m`;
  coinsEl.textContent = `${state.coins} / ${coinsPerLevel}`;
  levelEl.textContent = `${state.level}`;
  bestEl.textContent = `${Math.floor(state.bestScore)} m`;
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

function updateJumperPlayer() {
  const player = state.player;
  const difficulty = getRunDifficulty();
  const airAcceleration = 0.36 + difficulty * 0.08;
  const maxMoveSpeed = moveSpeed + difficulty * 0.62;

  player.bounceSquash *= 0.84;

  if (state.keys.left) {
    player.vx = Math.max(player.vx - airAcceleration, -maxMoveSpeed);
  } else if (state.keys.right) {
    player.vx = Math.min(player.vx + airAcceleration, maxMoveSpeed);
  } else {
    player.vx *= 0.84;
  }

  if (isJetpackActive()) {
    player.vy = Math.min(player.vy, -11.5);
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

  collectPickups();

  const targetCamera = Math.min(state.cameraY, player.y - 260);
  if (targetCamera < state.cameraY) {
    state.cameraY = targetCamera;
    state.heightScore = Math.max(state.heightScore, Math.abs(state.cameraY) / 10);
    if (state.heightScore > state.bestScore) {
      state.bestScore = state.heightScore;
      localStorage.setItem(bestScoreKey, String(Math.floor(state.bestScore)));
    }
    updateHud();
  }

  if (!state.runner.triggered && state.heightScore >= runnerTriggerScore) {
    state.runner.triggered = true;
    enterRunnerMode();
    return;
  }

  if (player.y - state.cameraY > height + 140) {
    finishRun();
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
    runner.portal = {
      x: width + 80,
      y: runnerGroundY - 92,
      w: 54,
      h: 92
    };
    addFloatingText("PORTAL!", width / 2, runnerGroundY - 120, "#00d1ff", 42);
    state.touch.active = false;
    state.touch.axis = 0;
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

  const playerBox = {
    x: player.x + 6,
    y: player.y + 6,
    w: player.w - 12,
    h: player.h - 6
  };

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

  if (state.mode === "runner") {
    const offset = state.runner.backgroundOffset;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(0.6, "#1d3557");
    gradient.addColorStop(1, "#2d6a4f");
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
  const tint = Math.floor(difficulty * 60 + pulse * 80);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, disco ? `rgb(${180 + Math.floor(pulse * 60)}, ${110 + tint}, 255)` : `rgb(${120 + tint}, ${207 - Math.floor(tint * 0.2)}, 255)`);
  gradient.addColorStop(0.55, disco ? `rgb(${255 - Math.floor(pulse * 80)}, ${235 - Math.floor(pulse * 30)}, 255)` : "#dff7ff");
  gradient.addColorStop(1, disco ? `rgb(${255}, ${215 + Math.floor(pulse * 30)}, ${170 + Math.floor(pulse * 40)})` : "#fff4c9");
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
    ctx.fillStyle = disco ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.65)";
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

  for (const platform of state.platforms) {
    const screenY = platform.y - state.cameraY;
    ctx.fillStyle = platform.cracked ? "#8d6f64" : platform.vx ? "#8a4fff" : state.level % 2 === 0 ? "#3d5f9b" : "#3d9b53";
    ctx.fillRect(platform.x, screenY, platform.w, platform.h);
    ctx.fillStyle = platform.cracked ? "#d8c0b1" : platform.vx ? "#c4a0ff" : state.level % 2 === 0 ? "#8fb1ff" : "#7ad08e";
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
      ctx.fillStyle = "#f9b208";
      ctx.beginPath();
      ctx.arc(item.x, screenY, item.r * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffe08a";
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

  ctx.fillStyle = disco ? `hsl(${(state.elapsedMs / 6) % 360}, 80%, 52%)` : state.mode === "runner" ? "#ff8c42" : "#1f3c88";
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY + 8, bodyW, bodyH - 8, 16);
  ctx.fill();

  ctx.fillStyle = "#ffd7a8";
  ctx.beginPath();
  ctx.arc(screenX + player.w / 2, bodyY + 14, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(screenX + 7, bodyY + 8, player.w - 14, 10, 6);
  ctx.fill();
  ctx.fillStyle = "#7dd3fc";
  ctx.beginPath();
  ctx.arc(screenX + 16, bodyY + 13, 4.2, 0, Math.PI * 2);
  ctx.arc(screenX + player.w - 16, bodyY + 13, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screenX + 18, bodyY + 17);
  ctx.quadraticCurveTo(screenX + player.w / 2, bodyY + 21, screenX + player.w - 18, bodyY + 17);
  ctx.stroke();

  ctx.fillStyle = disco ? "#ff4fd8" : "#ff5f6d";
  ctx.beginPath();
  ctx.moveTo(screenX + 5, bodyY + 24);
  ctx.lineTo(screenX + player.w - 5, bodyY + 22);
  ctx.lineTo(screenX + player.w - 8, bodyY + 30);
  ctx.lineTo(screenX + 8, bodyY + 32);
  ctx.fill();

  ctx.strokeStyle = "#102235";
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
  ctx.fillRect(14, 14, 164, 46);
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
  state.touch.active = false;
  state.touch.axis = 0;
  scoreEntryEl.classList.add("hidden");
  leaderboardPanelEl.classList.add("hidden");
  setOverlay("", "", false);
  state.player.vy = getJumpVelocity();
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

function updateTouchAxis(x) {
  const delta = x - state.touch.startX;
  const deadzone = 18;
  const maxDistance = 90;
  if (Math.abs(delta) <= deadzone) {
    state.touch.axis = 0;
    return;
  }
  state.touch.axis = clamp(delta / maxDistance, -1, 1);
}

function clearTouchInput() {
  state.touch.active = false;
  state.touch.pointerId = null;
  state.touch.axis = 0;
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

for (const element of [document.body, canvas, overlayEl]) {
  element.addEventListener("touchmove", (event) => {
    event.preventDefault();
  }, { passive: false });
}

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
  state.touch.axis = 0;
  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.touch.active || state.touch.pointerId !== event.pointerId || state.mode !== "jumper") {
    return;
  }
  const point = getCanvasPoint(event);
  updateTouchAxis(point.x);
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

actionEl.addEventListener("click", startGame);
saveScoreEl.addEventListener("click", submitScore);

playerNameEl.value = localStorage.getItem(playerNameKey) || "";
playerNameEl.addEventListener("input", () => {
  const cleanName = sanitizeName(playerNameEl.value);
  if (playerNameEl.value !== cleanName) {
    playerNameEl.value = cleanName;
  }
  localStorage.setItem(playerNameKey, cleanName);
});

resetGame();
showStartOverlay();
updateHud();
fetchLeaderboard();
requestAnimationFrame(loop);




