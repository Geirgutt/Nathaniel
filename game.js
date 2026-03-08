const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const levelEl = document.getElementById("level");
const bestEl = document.getElementById("best");
const overlayEl = document.getElementById("overlay");
const messageEl = document.getElementById("message");
const actionEl = document.getElementById("action");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
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
const bestScoreKey = "hopp-hoyest-best";
const playerNameKey = "hopp-hoyest-player-name";
const localLeaderboardKey = "hopp-hoyest-local-leaderboard";
const coinsPerLevel = 12;
const leaderboardLimit = 10;
const supabaseConfig = window.SUPABASE_CONFIG || { url: "", publishableKey: "", table: "scores" };

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
  ]
};

const state = {
  running: false,
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
  accumulator: 0
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
  setOverlay("Trykk pa start og hopp sa hoyt du kan. Samle 12 mynter for neste level.", "Start spill", true);
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

  const lookAhead = 0.18;
  const intensity = Math.min(1, 0.22 + (state.heightScore / 90) + (state.level - 1) * 0.14);
  const beatLength = state.running ? 0.24 - intensity * 0.05 : 0.29;

  music.master.gain.setTargetAtTime(state.running ? 0.19 : 0.1, music.context.currentTime, 0.08);
  music.leadGain.gain.setTargetAtTime(0.05 + intensity * 0.05, music.context.currentTime, 0.08);
  music.pulseGain.gain.setTargetAtTime(state.running ? 0.05 : 0.025, music.context.currentTime, 0.08);

  while (music.nextNoteTime < music.context.currentTime + lookAhead) {
    const note = music.sequence[music.step % music.sequence.length];
    scheduleTone("triangle", note.bass, music.nextNoteTime, beatLength * 0.9, music.bassGain, 0.6);
    scheduleTone("square", note.lead * (state.running && music.step % 2 === 0 ? 1.0 : 0.5), music.nextNoteTime, beatLength * 0.55, music.leadGain, 0.22 + intensity * 0.08);

    if (note.pulse) {
      scheduleTone("sawtooth", 90 + intensity * 40, music.nextNoteTime, 0.06, music.pulseGain, 0.11);
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

function addFloatingText(text, x, y, color) {
  state.floatingTexts.push({ text, x, y, color, life: 50 });
}

function maybeCreateCollectible(platform) {
  if (Math.random() > 0.4) {
    return;
  }

  state.collectibles.push({
    x: platform.x + platform.w / 2,
    y: platform.y - rand(34, 58),
    r: 10,
    value: 1,
    collected: false
  });
}

function createPlatform(y, guaranteedCenter = false, previousPlatform = null) {
  const platformWidth = getPlatformWidth();
  const difficulty = getRunDifficulty();
  const movingChance = guaranteedCenter ? 0 : clamp((difficulty - 0.05) * 0.58, 0, 0.55);
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
    vx: Math.random() < movingChance ? rand(0.3, 0.65 + difficulty * 0.3) * (Math.random() < 0.5 ? -1 : 1) : 0
  };

  maybeCreateCollectible(platform);
  return platform;
}

function updatePlatforms() {
  for (const platform of state.platforms) {
    if (!platform.vx) {
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
  state.cameraY = 0;
  state.heightScore = 0;
  state.coins = 0;
  state.level = 1;
  state.scoreSubmitted = false;
  state.accumulator = 0;
  state.platforms = [];
  state.collectibles = [];
  state.floatingTexts = [];

  let previousPlatform = null;
  for (let i = 0; i < 7; i += 1) {
    const platform = createPlatform(height - 90 - i * getPlatformGap(), i === 0, previousPlatform);
    state.platforms.push(platform);
    previousPlatform = platform;
  }

  state.player = {
    x: width / 2 - 18,
    y: height - 160,
    w: 36,
    h: 42,
    vx: 0,
    vy: 0
  };

  updateHud();
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
  addFloatingText(`LEVEL ${state.level}!`, width / 2, state.cameraY + 220, "#ff5f6d");
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

  state.platforms = state.platforms.filter((platform) => platform.y < state.cameraY + height + 120);
  state.collectibles = state.collectibles.filter((coin) => !coin.collected && coin.y < state.cameraY + height + 160);
}

function collectCoins() {
  const player = state.player;

  for (const coin of state.collectibles) {
    if (coin.collected) {
      continue;
    }

    const dx = player.x + player.w / 2 - coin.x;
    const dy = player.y + player.h / 2 - coin.y;
    if ((dx * dx) + (dy * dy) < 24 * 24) {
      coin.collected = true;
      state.coins += coin.value;
      addFloatingText("+1", coin.x, coin.y, "#f9b208");
      if (state.coins >= coinsPerLevel) {
        levelUp();
      } else {
        updateHud();
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

function updatePlayer() {
  const player = state.player;
  const difficulty = getRunDifficulty();
  const airAcceleration = 0.36 + difficulty * 0.08;
  const maxMoveSpeed = moveSpeed + difficulty * 0.62;

  if (state.keys.left) {
    player.vx = Math.max(player.vx - airAcceleration, -maxMoveSpeed);
  } else if (state.keys.right) {
    player.vx = Math.min(player.vx + airAcceleration, maxMoveSpeed);
  } else {
    player.vx *= 0.84;
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
    const wasAbove = player.y + player.h - player.vy <= platform.y;
    const touchingX = player.x + player.w > platform.x && player.x < platform.x + platform.w;
    const touchingY = player.y + player.h >= platform.y && player.y + player.h <= platform.y + platform.h + 12;

    if (player.vy > 0 && wasAbove && touchingX && touchingY) {
      player.y = platform.y - player.h;
      player.vy = getJumpVelocity();
      if (platform.vx) {
        player.x += platform.vx * 0.6;
      }
      break;
    }
  }

  collectCoins();

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

  if (player.y - state.cameraY > height + 140) {
    finishRun();
  }
}

function stepSimulation() {
  updateFloatingTexts();

  if (state.running) {
    updatePlatforms();
    updatePlayer();
    spawnPlatforms();
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, width, height);

  const difficulty = getRunDifficulty();
  const tint = Math.floor(difficulty * 60);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `rgb(${120 + tint}, ${207 - Math.floor(tint * 0.2)}, 255)`);
  gradient.addColorStop(0.6, "#dff7ff");
  gradient.addColorStop(1, "#fff4c9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 6; i += 1) {
    const cloudX = (i * 90 + (state.cameraY * -0.08)) % (width + 120) - 60;
    const cloudY = 60 + i * 90;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, 24, 0, Math.PI * 2);
    ctx.arc(cloudX + 22, cloudY + 8, 18, 0, Math.PI * 2);
    ctx.arc(cloudX - 22, cloudY + 10, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (const platform of state.platforms) {
    const screenY = platform.y - state.cameraY;
    ctx.fillStyle = platform.vx ? "#8a4fff" : state.level % 2 === 0 ? "#3d5f9b" : "#3d9b53";
    ctx.fillRect(platform.x, screenY, platform.w, platform.h);
    ctx.fillStyle = platform.vx ? "#c4a0ff" : state.level % 2 === 0 ? "#8fb1ff" : "#7ad08e";
    ctx.fillRect(platform.x + 4, screenY + 3, platform.w - 8, 4);
  }
}

function drawCollectibles() {
  for (const coin of state.collectibles) {
    const screenY = coin.y - state.cameraY;
    const pulse = 1 + Math.sin((performance.now() / 120) + coin.y * 0.02) * 0.08;

    ctx.fillStyle = "#f9b208";
    ctx.beginPath();
    ctx.arc(coin.x, screenY, coin.r * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.arc(coin.x - 2, screenY - 2, coin.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFloatingTexts() {
  ctx.font = "bold 20px Trebuchet MS";
  ctx.textAlign = "center";

  for (const item of state.floatingTexts) {
    const alpha = item.life / 50;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y - state.cameraY);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "start";
}

function drawPlayer() {
  const player = state.player;
  const screenY = player.y - state.cameraY;

  ctx.fillStyle = "#1f3c88";
  ctx.fillRect(player.x, screenY, player.w, player.h);

  ctx.fillStyle = "#ffd166";
  ctx.fillRect(player.x + 6, screenY + 6, player.w - 12, 14);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 7, screenY + 24, 8, 10);
  ctx.fillRect(player.x + 21, screenY + 24, 8, 10);
}

function drawFrame() {
  drawBackground();
  drawPlatforms();
  drawCollectibles();
  drawPlayer();
  drawFloatingTexts();
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
  scoreEntryEl.classList.add("hidden");
  leaderboardPanelEl.classList.add("hidden");
  setOverlay("", "", false);
  state.player.vy = getJumpVelocity();
}

function setDirectionalInput(direction, isPressed) {
  state.keys[direction] = isPressed;
  const button = direction === "left" ? leftButton : rightButton;
  button.classList.toggle("is-pressed", isPressed);
}

function attachHoldControl(button, direction) {
  const release = () => setDirectionalInput(direction, false);

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureMusic();
    setDirectionalInput(direction, true);
  });

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("lostpointercapture", release);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", " ", "Spacebar", "Enter"].includes(event.key)) {
    event.preventDefault();
  }

  ensureMusic();

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    setDirectionalInput("left", true);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    setDirectionalInput("right", true);
  }
  if (!state.running && (event.key === " " || event.key === "Spacebar" || event.key === "Enter")) {
    startGame();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    setDirectionalInput("left", false);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    setDirectionalInput("right", false);
  }
});

for (const element of [document.body, canvas, leftButton, rightButton, overlayEl]) {
  element.addEventListener("touchmove", (event) => {
    event.preventDefault();
  }, { passive: false });
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  ensureMusic();
  if (!state.running) {
    startGame();
  }
});

actionEl.addEventListener("click", startGame);
saveScoreEl.addEventListener("click", submitScore);
attachHoldControl(leftButton, "left");
attachHoldControl(rightButton, "right");

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


