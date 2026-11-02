(() => {
  "use strict";

  const WORLD_HEIGHT = 900;
  const START_X = 220;
  const PLAYER_RADIUS = 11;
  const VERTICAL_SPEED = 410;
  const VERTICAL_RESPONSE = 24;
  const MAX_TRAIL_POINTS = 5200;
  const STORAGE_KEY = "foldDash.save.v1";
  const EPSILON = 0.0001;
  const MAX_RENDER_PIXELS = 1_800_000;

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const app = document.querySelector("#app");
  const menuScreen = document.querySelector("#menuScreen");
  const hud = document.querySelector("#hud");
  const overlay = document.querySelector("#overlay");

  const ui = {
    brandButton: document.querySelector("#brandButton"),
    soundButton: document.querySelector("#soundButton"),
    fullscreenButton: document.querySelector("#fullscreenButton"),
    levelPicker: document.querySelector("#levelPicker"),
    startClassicButton: document.querySelector("#startClassicButton"),
    startEndlessButton: document.querySelector("#startEndlessButton"),
    classicButtonLabel: document.querySelector("#classicButtonLabel"),
    longestDistance: document.querySelector("#longestDistance"),
    clearedLevels: document.querySelector("#clearedLevels"),
    endlessRecord: document.querySelector("#endlessRecord"),
    routeStatus: document.querySelector("#routeStatus"),
    pauseButton: document.querySelector("#pauseButton"),
    modeLabel: document.querySelector("#modeLabel"),
    distanceText: document.querySelector("#distanceText"),
    distanceValue: document.querySelector("#distanceValue"),
    bestText: document.querySelector("#bestText"),
    progressFill: document.querySelector("#progressFill"),
    progressMarker: document.querySelector("#progressMarker"),
    focusButton: document.querySelector("#focusButton"),
    focusCount: document.querySelector("#focusCount"),
    controlCue: document.querySelector("#controlCue"),
    launchPrompt: document.querySelector("#launchPrompt"),
    speedReadout: document.querySelector("#speedReadout"),
    portraitHint: document.querySelector("#portraitHint"),
    toast: document.querySelector("#toast"),
    overlayEyebrow: document.querySelector("#overlayEyebrow"),
    overlayTitle: document.querySelector("#overlayTitle"),
    overlayMessage: document.querySelector("#overlayMessage"),
    resultStats: document.querySelector("#resultStats"),
    resultDistance: document.querySelector("#resultDistance"),
    resultTime: document.querySelector("#resultTime"),
    resultPickups: document.querySelector("#resultPickups"),
    primaryAction: document.querySelector("#primaryAction"),
    secondaryAction: document.querySelector("#secondaryAction"),
    liveRegion: document.querySelector("#liveRegion"),
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const pointDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  function formatTime(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(whole / 60);
    const rest = String(whole % 60).padStart(2, "0");
    return `${String(minutes).padStart(2, "0")}:${rest}`;
  }

  function formatDistance(value) {
    return `${Math.max(0, Math.floor(value)).toLocaleString("zh-CN")}m`;
  }

  const LEVEL_DATA = [
    {
      id: 1,
      name: "霓虹初折",
      shortName: "初折",
      subtitle: "跟着第一道折线起飞",
      accent: "#ff4d9d",
      secondary: "#47e8ff",
      speed: 365,
      segments: [
        { len: 1100, top: 100, bottom: 800 },
        { len: 650, top: 100, bottom: 650 },
        { len: 700, top: 290, bottom: 650 },
        { len: 650, top: 290, bottom: 530 },
        { len: 750, top: 140, bottom: 530 },
        { len: 700, top: 140, bottom: 760 },
        { len: 650, top: 340, bottom: 760 },
        { len: 700, top: 340, bottom: 560 },
        { len: 650, top: 120, bottom: 560 },
        { len: 850, top: 120, bottom: 800 },
        { len: 400, top: 220, bottom: 700 },
      ],
      hazards: [
        { type: "spikes", edge: "bottom", x: 650, width: 120, height: 190, count: 3 },
        { type: "spikes", edge: "top", x: 1410, width: 130, height: 245, count: 3 },
        { type: "saw", x: 2110, y: 470, r: 67 },
        { type: "spikes", edge: "bottom", x: 2700, width: 130, height: 100, count: 3 },
        { type: "spikes", edge: "top", x: 3350, width: 130, height: 165, count: 3 },
        { type: "saw", x: 4100, y: 620, r: 75 },
        { type: "spikes", edge: "bottom", x: 4380, width: 120, height: 160, count: 3 },
        { type: "spikes", edge: "top", x: 4890, width: 140, height: 125, count: 3 },
        { type: "saw", x: 5500, y: 450, r: 42 },
        { type: "spikes", edge: "bottom", x: 5720, width: 100, height: 130, count: 2 },
        { type: "spikes", edge: "top", x: 6250, width: 130, height: 155, count: 3 },
        { type: "block", x: 6890, y: 560, w: 80, h: 240 },
        { type: "saw", x: 7250, y: 670, r: 60 },
      ],
      pickups: [
        { x: 970, y: 355 },
        { x: 3160, y: 415 },
        { x: 4650, y: 500 },
        { x: 6720, y: 360 },
      ],
    },
    {
      id: 2,
      name: "折返工坊",
      shortName: "工坊",
      subtitle: "在机械节奏里换气",
      accent: "#47e8ff",
      secondary: "#c9ff62",
      speed: 392,
      segments: [
        { len: 1300, top: 120, bottom: 780 },
        { len: 600, top: 120, bottom: 620 },
        { len: 600, top: 260, bottom: 620 },
        { len: 700, top: 260, bottom: 480 },
        { len: 600, top: 120, bottom: 480 },
        { len: 700, top: 120, bottom: 700 },
        { len: 600, top: 300, bottom: 700 },
        { len: 650, top: 300, bottom: 520 },
        { len: 650, top: 160, bottom: 520 },
        { len: 650, top: 160, bottom: 760 },
        { len: 650, top: 360, bottom: 760 },
        { len: 700, top: 360, bottom: 560 },
        { len: 600, top: 180, bottom: 780 },
      ],
      hazards: [
        { type: "spikes", edge: "top", x: 420, width: 120, height: 240, count: 3 },
        { type: "saw", x: 940, y: 650, r: 60 },
        { type: "spikes", edge: "bottom", x: 1450, width: 135, height: 115, count: 3 },
        { type: "spikes", edge: "top", x: 1710, width: 120, height: 215, count: 3 },
        { type: "block", x: 2200, y: 400, w: 75, h: 220 },
        { type: "saw", x: 2720, y: 330, r: 48 },
        { type: "spikes", edge: "top", x: 3000, width: 125, height: 92, count: 3 },
        { type: "spikes", edge: "bottom", x: 3440, width: 130, height: 90, count: 3 },
        { type: "saw", x: 4200, y: 600, r: 70 },
        { type: "spikes", edge: "top", x: 4650, width: 130, height: 160, count: 3 },
        { type: "spikes", edge: "bottom", x: 4920, width: 110, height: 140, count: 2 },
        { type: "saw", x: 5400, y: 330, r: 45 },
        { type: "spikes", edge: "top", x: 6000, width: 120, height: 200, count: 3 },
        { type: "block", x: 6650, y: 495, w: 85, h: 265 },
        { type: "saw", x: 6920, y: 300, r: 73 },
        { type: "spikes", edge: "top", x: 7200, width: 120, height: 190, count: 3 },
        { type: "spikes", edge: "bottom", x: 7550, width: 100, height: 120, count: 2 },
        { type: "saw", x: 7900, y: 395, r: 44 },
        { type: "spikes", edge: "top", x: 8140, width: 120, height: 108, count: 3 },
        { type: "spikes", edge: "bottom", x: 8540, width: 110, height: 120, count: 2 },
        { type: "saw", x: 8790, y: 520, r: 55 },
      ],
      pickups: [
        { x: 1100, y: 270 },
        { x: 2350, y: 325 },
        { x: 4020, y: 520 },
        { x: 6200, y: 258 },
        { x: 8470, y: 520 },
      ],
    },
    {
      id: 3,
      name: "天际裂隙",
      shortName: "裂隙",
      subtitle: "在失重边缘压住心跳",
      accent: "#ffc44d",
      secondary: "#ff4d9d",
      speed: 432,
      segments: [
        { len: 900, top: 90, bottom: 810 },
        { len: 600, top: 260, bottom: 810 },
        { len: 600, top: 260, bottom: 610 },
        { len: 600, top: 100, bottom: 610 },
        { len: 600, top: 100, bottom: 450 },
        { len: 600, top: 320, bottom: 450 },
        { len: 600, top: 320, bottom: 780 },
        { len: 600, top: 100, bottom: 780 },
        { len: 700, top: 100, bottom: 600 },
        { len: 700, top: 300, bottom: 600 },
        { len: 600, top: 300, bottom: 500 },
        { len: 700, top: 120, bottom: 500 },
        { len: 700, top: 120, bottom: 800 },
        { len: 800, top: 280, bottom: 800 },
        { len: 800, top: 280, bottom: 620 },
        { len: 500, top: 140, bottom: 760 },
      ],
      hazards: [
        { type: "spikes", edge: "bottom", x: 490, width: 120, height: 240, count: 3 },
        { type: "spikes", edge: "top", x: 1100, width: 110, height: 220, count: 2 },
        { type: "saw", x: 1680, y: 485, r: 65 },
        { type: "spikes", edge: "bottom", x: 2280, width: 130, height: 140, count: 3 },
        { type: "spikes", edge: "top", x: 2860, width: 120, height: 95, count: 3 },
        { type: "saw", x: 4850, y: 600, r: 56 },
        { type: "block", x: 4050, y: 500, w: 70, h: 280 },
        { type: "spikes", edge: "top", x: 4680, width: 130, height: 250, count: 3 },
        { type: "saw", x: 5320, y: 330, r: 66 },
        { type: "spikes", edge: "bottom", x: 5960, width: 120, height: 105, count: 3 },
        { type: "saw", x: 6280, y: 470, r: 54 },
        { type: "spikes", edge: "top", x: 6680, width: 120, height: 100, count: 3 },
        { type: "saw", x: 7420, y: 305, r: 62 },
        { type: "spikes", edge: "bottom", x: 8050, width: 120, height: 160, count: 3 },
        { type: "saw", x: 8700, y: 510, r: 70 },
        { type: "spikes", edge: "top", x: 9160, width: 130, height: 220, count: 3 },
        { type: "saw", x: 9720, y: 440, r: 57 },
        { type: "spikes", edge: "bottom", x: 10260, width: 100, height: 120, count: 2 },
      ],
      pickups: [
        { x: 760, y: 365 },
        { x: 2020, y: 355 },
        { x: 3710, y: 385 },
        { x: 5480, y: 215 },
        { x: 7550, y: 420 },
        { x: 9440, y: 365 },
      ],
    },
  ];

  function prepareLevel(level) {
    let cursor = 0;
    const segments = level.segments.map((segment) => {
      const prepared = {
        x1: cursor,
        x2: cursor + segment.len,
        top: segment.top,
        bottom: segment.bottom,
      };
      cursor = prepared.x2;
      return prepared;
    });

    return {
      ...level,
      segments,
      hazards: level.hazards.map((hazard) => ({ ...hazard })),
      pickups: level.pickups.map((pickup) => ({ ...pickup, taken: false })),
      length: cursor,
    };
  }

  const LEVELS = LEVEL_DATA.map(prepareLevel);

  function createDefaultSave() {
    return {
      version: 1,
      selectedLevel: 0,
      muted: false,
      endless: { bestDistance: 0, bestTime: 0 },
      classic: LEVELS.map(() => ({
        bestDistance: 0,
        bestTime: 0,
        cleared: false,
      })),
    };
  }

  function loadSave() {
    const fallback = createDefaultSave();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      const merged = createDefaultSave();
      merged.selectedLevel = clamp(Number(parsed.selectedLevel) || 0, 0, LEVELS.length - 1);
      merged.muted = Boolean(parsed.muted);
      merged.endless.bestDistance = Math.max(0, Number(parsed.endless?.bestDistance) || 0);
      merged.endless.bestTime = Math.max(0, Number(parsed.endless?.bestTime) || 0);
      LEVELS.forEach((_, index) => {
        const source = parsed.classic?.[index];
        if (!source) return;
        merged.classic[index] = {
          bestDistance: Math.max(0, Number(source.bestDistance) || 0),
          bestTime: Math.max(0, Number(source.bestTime) || 0),
          cleared: Boolean(source.cleared),
        };
      });
      return merged;
    } catch {
      return fallback;
    }
  }

  let save = loadSave();

  function persistSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      // The game remains playable when storage is unavailable.
    }
  }

  class SoundEngine {
    constructor() {
      this.context = null;
    }

    init() {
      if (this.context) {
        if (this.context.state === "suspended") this.context.resume();
        return;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        this.context = new AudioContextClass();
      } catch {
        this.context = null;
      }
    }

    tone(frequency, duration, type = "sine", volume = 0.025, endFrequency = frequency) {
      if (!this.context || save.muted) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
    }

    sequence(notes, type = "triangle", volume = 0.02) {
      notes.forEach((note, index) => {
        window.setTimeout(() => {
          this.tone(note.frequency, note.duration, type, volume, note.end ?? note.frequency);
        }, note.delay ?? index * 70);
      });
    }

    click() {
      this.tone(410, 0.055, "square", 0.012, 520);
    }

    start() {
      this.sequence([
        { frequency: 330, end: 440, duration: 0.1, delay: 0 },
        { frequency: 550, end: 740, duration: 0.12, delay: 75 },
        { frequency: 820, end: 980, duration: 0.18, delay: 155 },
      ]);
    }

    collect() {
      this.sequence([
        { frequency: 680, end: 860, duration: 0.08, delay: 0 },
        { frequency: 980, end: 1260, duration: 0.12, delay: 55 },
      ]);
    }

    focus() {
      this.tone(640, 0.42, "sine", 0.028, 235);
    }

    checkpoint() {
      this.sequence([
        { frequency: 440, end: 660, duration: 0.14, delay: 0 },
        { frequency: 660, end: 880, duration: 0.18, delay: 90 },
      ]);
    }

    death() {
      this.tone(170, 0.48, "sawtooth", 0.04, 48);
      this.tone(90, 0.6, "square", 0.018, 35);
    }

    complete() {
      this.sequence(
        [
          { frequency: 440, end: 440, duration: 0.12, delay: 0 },
          { frequency: 660, end: 660, duration: 0.12, delay: 90 },
          { frequency: 880, end: 880, duration: 0.18, delay: 180 },
          { frequency: 1100, end: 1320, duration: 0.35, delay: 290 },
        ],
        "triangle",
        0.022,
      );
    }
  }

  const sound = new SoundEngine();

  const state = {
    screen: "menu",
    selectedLevel: save.selectedLevel,
    held: false,
    pointerId: null,
    run: null,
    overlayActionPrimary: null,
    overlayActionSecondary: null,
    view: { width: 1600, height: 900, scale: 1, cssWidth: 0, cssHeight: 0 },
    dpr: 1,
    stars: [],
    particles: [],
    lastFrame: 0,
    attractTime: 0,
    toastTimer: 0,
    cueTimer: 0,
    resizeTimer: 0,
    hudElapsed: 0,
    hudCache: {
      distance: -1,
      best: -1,
      progress: -1,
      charges: -1,
      focusDisabled: null,
      speed: "",
      mode: "",
    },
    backgroundGradients: null,
    performance: {
      frames: 0,
      elapsed: 0,
      fps: 0,
      renderMs: 0,
    },
  };

  function makeStars() {
    state.stars = Array.from({ length: 105 }, (_, index) => ({
      x: Math.random(),
      y: Math.random() * 0.9,
      size: index % 7 === 0 ? 1.8 : 0.75,
      depth: randomBetween(0.18, 0.9),
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelBudgetDpr = Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height));
    const dpr = clamp(
      Math.min(window.devicePixelRatio || 1, pixelBudgetDpr),
      0.5,
      1.75,
    );
    if (
      width === state.view.cssWidth &&
      height === state.view.cssHeight &&
      dpr === state.dpr
    ) {
      return;
    }
    state.dpr = dpr;
    state.view.cssWidth = width;
    state.view.cssHeight = height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    state.view.scale = height / WORLD_HEIGHT;
    state.view.height = WORLD_HEIGHT;
    state.view.width = width / state.view.scale;
    state.backgroundGradients = createBackgroundGradients(width, height);
  }

  function createBackgroundGradients(width, height) {
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#05050c");
    base.addColorStop(0.48, "#0a0715");
    base.addColorStop(1, "#05080c");

    const halo = ctx.createRadialGradient(
      width * 0.76,
      height * 0.2,
      0,
      width * 0.76,
      height * 0.2,
      Math.max(width, height) * 0.58,
    );
    halo.addColorStop(0, "rgba(255,63,145,0.18)");
    halo.addColorStop(0.35, "rgba(90,37,130,0.09)");
    halo.addColorStop(1, "rgba(5,5,12,0)");

    const cyanHalo = ctx.createRadialGradient(
      width * 0.17,
      height * 0.8,
      0,
      width * 0.17,
      height * 0.8,
      Math.max(width, height) * 0.38,
    );
    cyanHalo.addColorStop(0, "rgba(71,232,255,0.055)");
    cyanHalo.addColorStop(1, "rgba(71,232,255,0)");

    return { base, halo, cyanHalo };
  }

  function findSegment(segments, x) {
    let low = 0;
    let high = segments.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const segment = segments[middle];
      if (x < segment.x1) high = middle - 1;
      else if (x > segment.x2) low = middle + 1;
      else return segment;
    }
    return null;
  }

  function findSegmentIndex(segments, x) {
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      if (x >= segments[index].x1) return index;
    }
    return 0;
  }

  function midpointOf(segment) {
    return (segment.top + segment.bottom) * 0.5;
  }

  function createClassicRun(levelIndex, options = {}) {
    const level = LEVELS[levelIndex];
    const firstSegment = level.segments[0];
    const playerY = midpointOf(firstSegment);
    return {
      mode: "classic",
      levelIndex,
      level,
      segments: level.segments,
      hazards: level.hazards.map((hazard) => ({ ...hazard })),
      pickups: level.pickups.map((pickup) => ({ ...pickup, taken: false })),
      finishX: level.length,
      player: {
        x: START_X,
        y: playerY,
        vy: 0,
        angle: 0,
      },
      trail: [{ x: START_X, y: playerY }],
      speed: level.speed,
      baseSpeed: level.speed,
      time: 0,
      distance: 0,
      cameraX: START_X - 520,
      awaitingLaunch: true,
      focus: { charges: 2, active: 0 },
      collected: 0,
      checkpoints: [false, false],
      shake: 0,
      flash: 0,
      collisionReason: "",
      invincible: Boolean(options.invincible),
    };
  }

  function createEndlessRun(options = {}) {
    const startSegment = {
      x1: 0,
      x2: 1150,
      top: 120,
      bottom: 780,
    };
    const initialHazards = [
      { type: "spikes", edge: "bottom", x: 610, width: 110, height: 170, count: 3 },
      { type: "spikes", edge: "top", x: 980, width: 90, height: 130, count: 2 },
    ];
    const playerY = midpointOf(startSegment);
    return {
      mode: "endless",
      levelIndex: -1,
      level: {
        id: 0,
        name: "无尽空间",
        shortName: "无尽",
        accent: "#47e8ff",
        secondary: "#c9ff62",
        speed: 355,
      },
      segments: [startSegment],
      hazards: initialHazards,
      pickups: [{ x: 820, y: 320, taken: false }],
      finishX: Infinity,
      player: {
        x: START_X,
        y: playerY,
        vy: 0,
        angle: 0,
      },
      trail: [{ x: START_X, y: playerY }],
      speed: 355,
      baseSpeed: 355,
      time: 0,
      distance: 0,
      cameraX: START_X - 520,
      awaitingLaunch: true,
      focus: { charges: 2, active: 0 },
      collected: 0,
      checkpoints: [],
      shake: 0,
      flash: 0,
      collisionReason: "",
      invincible: Boolean(options.invincible),
      generatedUntil: 0,
    };
  }

  function isPickupPositionSafe(x, y, segment, hazards, clearance = 52) {
    if (x - segment.x1 < clearance || segment.x2 - x < clearance) return false;
    if (y - segment.top < clearance || segment.bottom - y < clearance) return false;

    for (const hazard of hazards) {
      if (hazard.type === "spikes") {
        if (x < hazard.x - clearance || x > hazard.x + hazard.width + clearance) continue;
        const baseY = hazard.edge === "top" ? segment.top : segment.bottom;
        const tipY = hazard.edge === "top" ? baseY + hazard.height : baseY - hazard.height;
        if (hazard.edge === "top" && y < tipY + clearance) return false;
        if (hazard.edge === "bottom" && y > tipY - clearance) return false;
      } else if (hazard.type === "saw") {
        if (pointDistance(x, y, hazard.x, hazard.y) < hazard.r + clearance) return false;
      } else if (hazard.type === "block") {
        const insideX = x > hazard.x - clearance && x < hazard.x + hazard.w + clearance;
        const insideY = y > hazard.y - clearance && y < hazard.y + hazard.h + clearance;
        if (insideX && insideY) return false;
      }
    }
    return true;
  }

  function appendEndlessCourse(run) {
    const target = run.player.x + Math.max(2600, state.view.width * 1.4);
    while (run.segments[run.segments.length - 1].x2 < target) {
      const last = run.segments[run.segments.length - 1];
      const difficulty = clamp((last.x2 - 1000) / 18000, 0, 1);
      const length = randomBetween(520, 790);
      let top = clamp(last.top + randomBetween(-105, 105), 80, 340);
      let bottom = clamp(last.bottom + randomBetween(-105, 105), 500, 825);
      if (bottom - top < 250) {
        if (Math.random() < 0.5) top = bottom - 250;
        else bottom = top + 250;
      }
      const segment = {
        x1: last.x2,
        x2: last.x2 + length,
        top,
        bottom,
      };
      run.segments.push(segment);
      run.generatedUntil = segment.x2;

      const spice = Math.random();
      const spikeHeightMax = Math.max(70, bottom - top - 190);
      if (spice < 0.58 + difficulty * 0.2) {
        const edge = Math.random() < 0.5 ? "top" : "bottom";
        const count = Math.random() < 0.35 ? 2 : 3;
        const width = randomBetween(90, 145);
        run.hazards.push({
          type: "spikes",
          edge,
          x: segment.x1 + randomBetween(120, Math.max(140, length - width - 120)),
          width,
          height: clamp(randomBetween(90, 205) * (0.9 + difficulty * 0.35), 70, spikeHeightMax),
          count,
        });
      }

      if (spice > 0.72 && spice < 0.88) {
        const placeHigh = Math.random() < 0.5;
        const radius = randomBetween(48, 68);
        run.hazards.push({
          type: "saw",
          x: segment.x1 + randomBetween(length * 0.3, length * 0.78),
          y: placeHigh ? top + 105 : bottom - 105,
          r: radius,
        });
      }

      if (spice > 0.9) {
        const maxBlockHeight = bottom - top - 150;
        if (maxBlockHeight >= 115) {
          const blockHeight = randomBetween(115, Math.min(220, maxBlockHeight));
          run.hazards.push({
            type: "block",
            x: segment.x1 + length * 0.52,
            y: bottom - blockHeight,
            w: 72,
            h: blockHeight,
          });
        }
      }

      if (Math.random() < 0.42) {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const pickupX = segment.x1 + length * randomBetween(0.25, 0.72);
          const pickupY = clamp(
            midpointOf(segment) + randomBetween(-95, 95),
            top + 70,
            bottom - 70,
          );
          const separated = run.pickups.every(
            (pickup) => pointDistance(pickupX, pickupY, pickup.x, pickup.y) > 90,
          );
          if (
            separated &&
            isPickupPositionSafe(pickupX, pickupY, segment, run.hazards)
          ) {
            run.pickups.push({ x: pickupX, y: pickupY, taken: false });
            break;
          }
        }
      }
    }
  }

  function setScreen(screen) {
    state.screen = screen;
    app.dataset.screen = screen;
  }

  function hideOverlay() {
    overlay.classList.add("is-hidden");
    state.overlayActionPrimary = null;
    state.overlayActionSecondary = null;
  }

  function showOverlay(config) {
    ui.overlayEyebrow.textContent = config.eyebrow;
    ui.overlayTitle.textContent = config.title;
    ui.overlayMessage.textContent = config.message;
    ui.resultStats.classList.toggle("is-hidden", !config.stats);
    if (config.stats) {
      ui.resultDistance.textContent = formatDistance(config.stats.distance);
      ui.resultTime.textContent = formatTime(config.stats.time);
      ui.resultPickups.textContent = String(config.stats.pickups);
    }
    ui.primaryAction.querySelector("span").textContent = config.primaryLabel;
    ui.secondaryAction.textContent = config.secondaryLabel;
    ui.secondaryAction.classList.toggle("is-hidden", !config.secondaryLabel);
    state.overlayActionPrimary = config.primaryAction;
    state.overlayActionSecondary = config.secondaryAction;
    overlay.classList.remove("is-hidden");
    window.setTimeout(() => ui.primaryAction.focus({ preventScroll: true }), 30);
  }

  function hideGameChrome() {
    hud.classList.add("is-hidden");
    overlay.classList.add("is-hidden");
    ui.launchPrompt.classList.add("is-hidden");
    app.classList.remove("is-focused");
  }

  function showGameChrome() {
    hud.classList.remove("is-hidden");
    hideOverlay();
  }

  function startRun(mode, levelIndex = state.selectedLevel, options = {}) {
    sound.init();
    const run = mode === "endless" ? createEndlessRun(options) : createClassicRun(levelIndex, options);
    state.run = run;
    state.held = false;
    state.pointerId = null;
    state.particles = [];
    state.hudElapsed = 0;
    resetHudCache();
    window.clearTimeout(state.cueTimer);
    ui.controlCue.classList.remove("is-fading");
    app.classList.remove("is-focused");
    hideGameChrome();
    ui.launchPrompt.classList.remove("is-hidden");
    showGameChrome();
    run.cameraX = run.player.x - state.view.width * 0.28;
    setScreen("playing");
    if (mode === "endless") appendEndlessCourse(run);
    updateHud();
    ui.liveRegion.textContent =
      mode === "endless" ? "无尽空间已就绪，按住起飞" : `${run.level.name}已就绪，按住起飞`;
  }

  function launchRun() {
    const run = state.run;
    if (!run || !run.awaitingLaunch || state.screen !== "playing") return false;
    run.awaitingLaunch = false;
    ui.launchPrompt.classList.add("is-hidden");
    ui.controlCue.classList.remove("is-fading");
    window.clearTimeout(state.cueTimer);
    state.cueTimer = window.setTimeout(() => ui.controlCue.classList.add("is-fading"), 3800);
    sound.start();
    ui.liveRegion.textContent = "航线启动";
    return true;
  }

  function startClassic(levelIndex = state.selectedLevel) {
    const index = clamp(levelIndex, 0, LEVELS.length - 1);
    state.selectedLevel = index;
    save.selectedLevel = index;
    persistSave();
    startRun("classic", index);
  }

  function startEndless() {
    startRun("endless");
  }

  function returnToMenu() {
    state.held = false;
    state.pointerId = null;
    window.clearTimeout(state.cueTimer);
    hideGameChrome();
    setScreen("menu");
    updateMenuStats();
    ui.liveRegion.textContent = "已返回主菜单";
  }

  function pauseRun() {
    if (state.screen !== "playing" || !state.run) return;
    state.held = false;
    state.pointerId = null;
    setScreen("paused");
    showOverlay({
      eyebrow: "ROUTE PAUSED",
      title: "航线暂停",
      message: "线路已锁定。调整呼吸，再继续向前。",
      stats: {
        distance: state.run.distance,
        time: state.run.time,
        pickups: state.run.collected,
      },
      primaryLabel: "继续航行",
      primaryAction: resumeRun,
      secondaryLabel: "退出航线",
      secondaryAction: returnToMenu,
    });
    ui.liveRegion.textContent = "游戏已暂停";
  }

  function resumeRun() {
    if (state.screen !== "paused") return;
    hideOverlay();
    setScreen("playing");
    ui.liveRegion.textContent = "继续游戏";
  }

  function recordRunProgress(run) {
    if (run.mode === "endless") {
      save.endless.bestDistance = Math.max(save.endless.bestDistance, run.distance);
      save.endless.bestTime = Math.max(save.endless.bestTime, run.time);
    } else {
      const record = save.classic[run.levelIndex];
      record.bestDistance = Math.max(record.bestDistance, run.distance);
      record.bestTime = Math.max(record.bestTime, run.time);
    }
    persistSave();
  }

  function failRun(reason = "撞上航线边界") {
    if (!state.run || state.screen !== "playing") return;
    const run = state.run;
    run.distance = Math.max(run.distance, Math.max(0, (run.player.x - START_X) / 12));
    state.held = false;
    run.collisionReason = reason;
    run.shake = 24;
    run.flash = 1;
    spawnBurst(run.player.x, run.player.y, run.level.accent, 30, 330);
    spawnBurst(run.player.x, run.player.y, "#f8f4e8", 15, 220);
    sound.death();
    recordRunProgress(run);
    setScreen("dead");
    window.setTimeout(() => {
      if (state.run !== run || state.screen !== "dead") return;
      const best =
        run.mode === "endless"
          ? save.endless.bestDistance
          : save.classic[run.levelIndex].bestDistance;
      showOverlay({
        eyebrow: "SIGNAL LOST",
        title: "撞线了",
        message: `${reason}。这次已经飞了 ${formatDistance(run.distance)}，最好纪录是 ${formatDistance(best)}。`,
        stats: {
          distance: run.distance,
          time: run.time,
          pickups: run.collected,
        },
        primaryLabel: "再试一次",
        primaryAction: () => startRun(run.mode, run.levelIndex),
        secondaryLabel: "返回主菜单",
        secondaryAction: returnToMenu,
      });
    }, 320);
    ui.liveRegion.textContent = `撞线了，本次距离${formatDistance(run.distance)}`;
  }

  function completeRun() {
    if (!state.run || state.screen !== "playing") return;
    const run = state.run;
    run.distance = Math.max(run.distance, Math.max(0, (run.player.x - START_X) / 12));
    const record = save.classic[run.levelIndex];
    record.cleared = true;
    record.bestDistance = Math.max(record.bestDistance, run.distance);
    record.bestTime = record.bestTime === 0 ? run.time : Math.min(record.bestTime, run.time);
    persistSave();
    state.held = false;
    run.flash = 0.65;
    spawnBurst(run.player.x, run.player.y, "#c9ff62", 40, 380);
    spawnBurst(run.player.x, run.player.y, run.level.secondary, 22, 260);
    sound.complete();
    setScreen("complete");
    updateMenuStats();

    const hasNext = run.levelIndex < LEVELS.length - 1;
    window.setTimeout(() => {
      if (state.run !== run || state.screen !== "complete") return;
      showOverlay({
        eyebrow: "ROUTE COMPLETE",
        title: "航线已贯通",
        message: hasNext
          ? `${run.level.name} 已记录。下一道航线正在前方展开。`
          : "三段经典航线全部贯通。现在尝试无尽空间，看看折线能延伸多远。",
        stats: {
          distance: run.distance,
          time: run.time,
          pickups: run.collected,
        },
        primaryLabel: hasNext ? "进入下一关" : "挑战无尽",
        primaryAction: hasNext
          ? () => startClassic(run.levelIndex + 1)
          : startEndless,
        secondaryLabel: "返回主菜单",
        secondaryAction: returnToMenu,
      });
    }, 430);
    ui.liveRegion.textContent = `${run.level.name}已贯通`;
  }

  function activateFocus() {
    if (state.screen !== "playing" || !state.run) return;
    const focus = state.run.focus;
    if (focus.active > 0 || focus.charges <= 0) return;
    focus.charges -= 1;
    focus.active = 2.4;
    app.classList.add("is-focused");
    sound.focus();
    showToast("时缓展开 · 2.4s");
    updateHud();
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), 1400);
  }

  function spawnBurst(x, y, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = randomBetween(speed * 0.22, speed);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: randomBetween(2, 6),
        life: randomBetween(0.35, 0.9),
        maxLife: 0.9,
        color,
      });
    }
  }

  function spawnTrailSpark(run) {
    const player = run.player;
    state.particles.push({
      x: player.x - 17,
      y: player.y + randomBetween(-8, 8),
      vx: randomBetween(-90, -35),
      vy: randomBetween(-26, 26),
      size: randomBetween(1.2, 2.8),
      life: randomBetween(0.18, 0.38),
      maxLife: 0.38,
      color: Math.random() < 0.5 ? run.level.accent : run.level.secondary,
    });
  }

  function updateParticles(dt) {
    for (let index = state.particles.length - 1; index >= 0; index -= 1) {
      const particle = state.particles[index];
      particle.life -= dt;
      if (particle.life <= 0) {
        state.particles.splice(index, 1);
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.12, dt);
      particle.vy *= Math.pow(0.2, dt);
    }
  }

  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNegative && hasPositive);
  }

  function distancePointToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared < EPSILON) return pointDistance(px, py, ax, ay);
    const amount = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
    return pointDistance(px, py, ax + dx * amount, ay + dy * amount);
  }

  function circleTriangle(cx, cy, radius, ax, ay, bx, by, dx, dy) {
    if (pointInTriangle(cx, cy, ax, ay, bx, by, dx, dy)) return true;
    return (
      distancePointToSegment(cx, cy, ax, ay, bx, by) < radius ||
      distancePointToSegment(cx, cy, bx, by, dx, dy) < radius ||
      distancePointToSegment(cx, cy, dx, dy, ax, ay) < radius
    );
  }

  function circleRectangle(cx, cy, radius, x, y, width, height) {
    const nearestX = clamp(cx, x, x + width);
    const nearestY = clamp(cy, y, y + height);
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function spikeTriangles(run, hazard) {
    const segment = findSegment(run.segments, hazard.x + hazard.width * 0.5);
    if (!segment) return [];
    const count = Math.max(1, hazard.count || 1);
    const width = hazard.width / count;
    const baseY = hazard.edge === "top" ? segment.top : segment.bottom;
    const tipY = hazard.edge === "top" ? baseY + hazard.height : baseY - hazard.height;
    const triangles = [];
    for (let index = 0; index < count; index += 1) {
      const left = hazard.x + index * width;
      const right = left + width;
      triangles.push({
        ax: left,
        ay: baseY,
        bx: right,
        by: baseY,
        cx: (left + right) * 0.5,
        cy: tipY,
      });
    }
    return triangles;
  }

  function checkCollision(run) {
    if (run.invincible) return null;
    const player = run.player;
    const segment = findSegment(run.segments, player.x);
    if (!segment) return "飞出航线";
    if (player.y - PLAYER_RADIUS < segment.top) return "撞上顶部边界";
    if (player.y + PLAYER_RADIUS > segment.bottom) return "撞上底部边界";

    for (const hazard of run.hazards) {
      if (hazard.type === "spikes") {
        if (player.x + PLAYER_RADIUS < hazard.x || player.x - PLAYER_RADIUS > hazard.x + hazard.width) {
          continue;
        }
        const triangles = spikeTriangles(run, hazard);
        for (const triangle of triangles) {
          if (
            circleTriangle(
              player.x,
              player.y,
              PLAYER_RADIUS * 0.82,
              triangle.ax,
              triangle.ay,
              triangle.bx,
              triangle.by,
              triangle.cx,
              triangle.cy,
            )
          ) {
            return "撞上尖刺";
          }
        }
      } else if (hazard.type === "saw") {
        const distance = pointDistance(player.x, player.y, hazard.x, hazard.y);
        if (distance < hazard.r * 0.78 + PLAYER_RADIUS * 0.82) return "被齿轮截断";
      } else if (hazard.type === "block") {
        if (
          circleRectangle(
            player.x,
            player.y,
            PLAYER_RADIUS,
            hazard.x,
            hazard.y,
            hazard.w,
            hazard.h,
          )
        ) {
          return "撞上障碍";
        }
      }
    }
    return null;
  }

  function collectPickups(run) {
    for (const pickup of run.pickups) {
      if (pickup.taken || Math.abs(pickup.x - run.player.x) > 50) continue;
      if (pointDistance(pickup.x, pickup.y, run.player.x, run.player.y) < 34) {
        pickup.taken = true;
        run.collected += 1;
        run.focus.charges = Math.min(3, run.focus.charges + 1);
        spawnBurst(pickup.x, pickup.y, run.level.secondary, 12, 170);
        sound.collect();
        showToast(`能量晶片 +1 · 时缓 ${run.focus.charges}`);
      }
    }
  }

  function updateCheckpoints(run) {
    if (run.mode !== "classic") return;
    const progress = clamp((run.player.x - START_X) / (run.finishX - START_X), 0, 1);
    [0.34, 0.67].forEach((threshold, index) => {
      if (!run.checkpoints[index] && progress >= threshold) {
        run.checkpoints[index] = true;
        run.focus.charges = Math.min(3, run.focus.charges + 1);
        run.flash = Math.max(run.flash, 0.22);
        sound.checkpoint();
        showToast(`检查点 ${index + 1} · 时缓充能`);
      }
    });
  }

  function updateRun(dt) {
    const run = state.run;
    if (!run) return;
    if (run.shake > 0) run.shake = Math.max(0, run.shake - dt * 45);
    if (run.flash > 0) run.flash = Math.max(0, run.flash - dt * 1.8);
    updateParticles(dt);

    if (state.screen !== "playing") return;
    if (run.awaitingLaunch) {
      const launchCamera = run.player.x - state.view.width * 0.28;
      run.cameraX = lerp(run.cameraX, launchCamera, 1 - Math.exp(-dt * 12));
      updateHudThrottled(dt);
      return;
    }

    run.time += dt;
    const focusActive = run.focus.active > 0;
    if (focusActive) {
      run.focus.active = Math.max(0, run.focus.active - dt);
      if (run.focus.active <= 0) app.classList.remove("is-focused");
    }
    const timeScale = focusActive ? 0.56 : 1;
    const progress = run.mode === "classic"
      ? clamp((run.player.x - START_X) / (run.finishX - START_X), 0, 1)
      : clamp(run.time / 150, 0, 1);
    run.speed =
      run.mode === "classic"
        ? run.baseSpeed + progress * 22
        : Math.min(535, run.baseSpeed + run.time * 2.15);

    if (run.mode === "endless") appendEndlessCourse(run);

    const travel = dt * timeScale;
    const steps = Math.max(1, Math.ceil(travel / 0.006));
    const step = travel / steps;
    for (let index = 0; index < steps; index += 1) {
      const targetVerticalSpeed = state.held ? -VERTICAL_SPEED : VERTICAL_SPEED;
      run.player.vy = lerp(
        run.player.vy,
        targetVerticalSpeed,
        1 - Math.exp(-step * VERTICAL_RESPONSE),
      );
      run.player.x += run.speed * step;
      run.player.y += run.player.vy * step;
      const reachedFinish =
        run.mode === "classic" && run.player.x >= run.finishX;
      if (reachedFinish) run.player.x = run.finishX;
      run.player.angle = lerp(
        run.player.angle,
        Math.atan2(run.player.vy, run.speed),
        1 - Math.exp(-step * 34),
      );

      const lastTrail = run.trail[run.trail.length - 1];
      if (pointDistance(lastTrail.x, lastTrail.y, run.player.x, run.player.y) > 7) {
        run.trail.push({ x: run.player.x, y: run.player.y });
      }

      if (Math.random() < 0.18) spawnTrailSpark(run);

      const collisionReason = checkCollision(run);
      if (collisionReason) {
        failRun(collisionReason);
        return;
      }

      if (reachedFinish) {
        completeRun();
        return;
      }
    }

    if (run.trail.length > MAX_TRAIL_POINTS) {
      run.trail.splice(0, run.trail.length - MAX_TRAIL_POINTS);
    }

    run.distance = Math.max(0, (run.player.x - START_X) / 12);
    collectPickups(run);
    updateCheckpoints(run);

    const targetCamera = run.player.x - state.view.width * 0.28;
    run.cameraX = lerp(run.cameraX, targetCamera, 1 - Math.exp(-dt * 12));
    updateHudThrottled(dt);
  }

  function updateAttract(dt) {
    updateParticles(dt);
  }

  function resetHudCache() {
    state.hudCache.distance = -1;
    state.hudCache.best = -1;
    state.hudCache.progress = -1;
    state.hudCache.charges = -1;
    state.hudCache.focusDisabled = null;
    state.hudCache.speed = "";
    state.hudCache.mode = "";
  }

  function updateHudThrottled(dt) {
    state.hudElapsed += dt;
    if (state.hudElapsed < 1 / 30) return;
    state.hudElapsed = 0;
    updateHud();
  }

  function updateHud() {
    const run = state.run;
    if (!run) return;
    const distance = Math.floor(run.distance);
    if (state.hudCache.distance !== distance) {
      ui.distanceValue.textContent = distance.toLocaleString("zh-CN");
      state.hudCache.distance = distance;
    }
    const modeLabel = run.mode === "classic" ? run.level.name : "无尽空间";
    if (state.hudCache.mode !== modeLabel) {
      ui.modeLabel.textContent = modeLabel;
      state.hudCache.mode = modeLabel;
    }
    const best =
      run.mode === "classic"
        ? save.classic[run.levelIndex].bestDistance
        : save.endless.bestDistance;
    const bestDistance = Math.floor(Math.max(best, distance));
    if (state.hudCache.best !== bestDistance) {
      ui.bestText.textContent = formatDistance(bestDistance);
      state.hudCache.best = bestDistance;
    }
    const progress =
      run.mode === "classic"
        ? clamp((run.player.x - START_X) / (run.finishX - START_X), 0, 1)
        : (run.distance % 500) / 500;
    const roundedProgress = Math.round(progress * 1000) / 1000;
    if (state.hudCache.progress !== roundedProgress) {
      const percentage = `${roundedProgress * 100}%`;
      ui.progressFill.style.width = percentage;
      ui.progressMarker.style.left = percentage;
      state.hudCache.progress = roundedProgress;
    }
    if (state.hudCache.charges !== run.focus.charges) {
      ui.focusCount.textContent = String(run.focus.charges);
      state.hudCache.charges = run.focus.charges;
    }
    const focusDisabled = run.focus.charges <= 0 || run.focus.active > 0;
    if (state.hudCache.focusDisabled !== focusDisabled) {
      ui.focusButton.disabled = focusDisabled;
      state.hudCache.focusDisabled = focusDisabled;
    }
    const speedLabel = `${(run.speed / run.baseSpeed).toFixed(1)}×`;
    if (state.hudCache.speed !== speedLabel) {
      ui.speedReadout.querySelector("strong").textContent = speedLabel;
      state.hudCache.speed = speedLabel;
    }
  }

  function updateMenuStats() {
    const classicBest = save.classic.reduce(
      (maximum, record) => Math.max(maximum, record.bestDistance),
      0,
    );
    const longest = Math.max(classicBest, save.endless.bestDistance);
    const cleared = save.classic.filter((record) => record.cleared).length;
    ui.longestDistance.innerHTML = `${Math.floor(longest).toLocaleString("zh-CN")}<small>m</small>`;
    ui.clearedLevels.innerHTML = `${cleared}<small>/${LEVELS.length}</small>`;
    ui.endlessRecord.innerHTML = `${Math.floor(save.endless.bestDistance).toLocaleString("zh-CN")}<small>m</small>`;
    ui.routeStatus.textContent = cleared === LEVELS.length ? "全航线贯通" : "本机数据已同步";
    ui.classicButtonLabel.textContent = `开始 · ${LEVELS[state.selectedLevel].name}`;

    [...ui.levelPicker.children].forEach((button, index) => {
      const active = index === state.selectedLevel;
      const clearedState = save.classic[index].cleared;
      button.classList.toggle("is-active", active);
      button.classList.toggle("is-cleared", clearedState);
      button.setAttribute("aria-pressed", String(active));
    });
    updateSoundButton();
  }

  function buildLevelPicker() {
    ui.levelPicker.replaceChildren();
    LEVELS.forEach((level, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "level-option";
      button.innerHTML = `<span>0${index + 1}</span>${level.shortName}`;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        state.selectedLevel = index;
        save.selectedLevel = index;
        persistSave();
        sound.init();
        sound.click();
        updateMenuStats();
      });
      ui.levelPicker.append(button);
    });
  }

  function updateSoundButton() {
    const use = ui.soundButton.querySelector("use");
    use.setAttribute("href", save.muted ? "#icon-volume-x" : "#icon-volume");
    ui.soundButton.setAttribute("aria-label", save.muted ? "打开声音" : "关闭声音");
  }

  function toggleSound() {
    sound.init();
    save.muted = !save.muted;
    persistSave();
    updateSoundButton();
    if (!save.muted) sound.click();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await app.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showToast("当前浏览器不支持全屏");
    }
  }

  function drawBackdrop(view, cameraX) {
    const width = view.cssWidth;
    const height = view.cssHeight;
    if (!state.backgroundGradients) {
      state.backgroundGradients = createBackgroundGradients(width, height);
    }
    ctx.fillStyle = state.backgroundGradients.base;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = state.backgroundGradients.halo;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = state.backgroundGradients.cyanHalo;
    ctx.fillRect(0, 0, width, height);

    for (const star of state.stars) {
      const parallax = ((star.x * width - cameraX * star.depth * 0.025) % width + width) % width;
      const pulse = 0.45 + Math.sin(state.attractTime * 1.2 + star.phase) * 0.22;
      ctx.globalAlpha = pulse * star.depth;
      ctx.fillStyle = star.depth > 0.72 ? "#ffe9f3" : "#b8e7ef";
      ctx.fillRect(parallax, star.y * height, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(163,131,194,0.08)";
    ctx.lineWidth = 1;
    const gridStep = Math.max(46, height / 14);
    const offset = -((cameraX * 0.08) % gridStep);
    for (let x = offset; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = height * 0.12; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,63,145,0.12)";
    ctx.beginPath();
    ctx.moveTo(width * 0.64, 0);
    ctx.lineTo(width * 0.46, height);
    ctx.stroke();
    ctx.strokeStyle = "rgba(71,232,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(width * 0.88, 0);
    ctx.lineTo(width * 0.7, height);
    ctx.stroke();
  }

  function drawAttractLayer(view) {
    const width = view.cssWidth;
    const height = view.cssHeight;
    const time = state.attractTime;

    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "#ff4d9d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const points = [];
    for (let index = 0; index <= 36; index += 1) {
      const x = (index / 36) * width;
      const y =
        height * 0.67 +
        Math.sin(index * 0.44 + time * 1.55) * height * 0.08 +
        Math.sin(index * 0.13 - time) * height * 0.045;
      points.push({ x, y });
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = "rgba(248,244,232,0.75)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "miter";
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    const markerIndex = Math.floor((time * 7) % points.length);
    const marker = points[markerIndex];
    const next = points[Math.min(points.length - 1, markerIndex + 1)];
    const angle = Math.atan2(next.y - marker.y, next.x - marker.x);
    ctx.translate(marker.x, marker.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#f8f4e8";
    ctx.strokeStyle = "#47e8ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-14, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#47e8ff";
    ctx.lineWidth = 1;
    for (let index = 0; index < 9; index += 1) {
      const size = 42 + index * 17;
      const x = width * 0.82 + Math.sin(time * 0.25 + index) * 18;
      const y = height * 0.6 + Math.cos(time * 0.3 + index) * 14;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI * 0.25 + time * 0.02 * (index % 2 ? 1 : -1));
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawTerrain(run, view) {
    const left = run.cameraX - 100;
    const right = run.cameraX + view.width + 100;
    const accent = run.level.accent;
    const secondary = run.level.secondary;

    ctx.save();
    for (let index = 0; index < run.segments.length; index += 1) {
      const segment = run.segments[index];
      if (segment.x2 < left || segment.x1 > right) continue;
      const width = segment.x2 - segment.x1;

      ctx.fillStyle = "#0b0713";
      ctx.fillRect(segment.x1, 0, width, segment.top);

      ctx.fillStyle = "#090610";
      ctx.fillRect(segment.x1, segment.bottom, width, WORLD_HEIGHT - segment.bottom);

      ctx.save();
      ctx.beginPath();
      ctx.rect(segment.x1, 0, width, segment.top);
      ctx.rect(segment.x1, segment.bottom, width, WORLD_HEIGHT - segment.bottom);
      ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      const stripeOffset = ((segment.x1 + state.attractTime * 20) % 42 + 42) % 42;
      for (let x = segment.x1 - WORLD_HEIGHT + stripeOffset; x < segment.x2 + 40; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + WORLD_HEIGHT, WORLD_HEIGHT);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = accent;
      ctx.beginPath();
      ctx.moveTo(segment.x1, segment.top);
      ctx.lineTo(segment.x2, segment.top);
      ctx.moveTo(segment.x1, segment.bottom);
      ctx.lineTo(segment.x2, segment.bottom);
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      if (index > 0) {
        const previous = run.segments[index - 1];
        ctx.strokeStyle = "rgba(248,244,232,0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (Math.abs(previous.top - segment.top) > 0.1) {
          ctx.moveTo(segment.x1, previous.top);
          ctx.lineTo(segment.x1, segment.top);
        }
        if (Math.abs(previous.bottom - segment.bottom) > 0.1) {
          ctx.moveTo(segment.x1, previous.bottom);
          ctx.lineTo(segment.x1, segment.bottom);
        }
        ctx.stroke();
      }

      ctx.save();
      ctx.strokeStyle = "rgba(248,244,232,0.11)";
      ctx.lineWidth = 1;
      ctx.setLineDash([7, 19]);
      ctx.lineDashOffset = -run.cameraX * 0.4 - state.attractTime * 85;
      ctx.beginPath();
      ctx.moveTo(segment.x1, midpointOf(segment));
      ctx.lineTo(segment.x2, midpointOf(segment));
      ctx.stroke();
      ctx.restore();
    }

    const visibleSegments = run.segments.filter(
      (segment) => segment.x2 > left && segment.x1 < right,
    );
    if (visibleSegments.length > 0) {
      ctx.strokeStyle = "rgba(248,244,232,0.24)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.max(left, visibleSegments[0].x1), 18);
      ctx.lineTo(Math.min(right, visibleSegments[visibleSegments.length - 1].x2), 18);
      ctx.stroke();
    }
    ctx.restore();

    drawFinish(run, secondary);
    drawCheckpoints(run);
  }

  function drawFinish(run, secondary) {
    if (run.mode !== "classic") return;
    const x = run.finishX;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(x, 34);
    ctx.lineTo(x, WORLD_HEIGHT - 34);
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 4;
    ctx.stroke();
    for (let y = 42; y < WORLD_HEIGHT - 30; y += 28) {
      ctx.fillStyle = (Math.floor(y / 28) % 2 === 0) ? secondary : "#f8f4e8";
      ctx.fillRect(x - 10, y, 5, 14);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x + 5, y, 5, 14);
      ctx.globalAlpha = 0.9;
    }
    ctx.fillStyle = "#05050c";
    ctx.fillRect(x - 65, 34, 130, 38);
    ctx.fillStyle = secondary;
    ctx.font = '700 15px "Bahnschrift", "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("FINISH", x, 60);
    ctx.restore();
  }

  function drawCheckpoints(run) {
    if (run.mode !== "classic") return;
    [0.34, 0.67].forEach((threshold, index) => {
      const x = START_X + (run.finishX - START_X) * threshold;
      ctx.save();
      ctx.globalAlpha = run.checkpoints[index] ? 0.38 : 0.16;
      ctx.strokeStyle = "#c9ff62";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 10]);
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x, WORLD_HEIGHT - 50);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawHazards(run, view) {
    const left = run.cameraX - 150;
    const right = run.cameraX + view.width + 150;
    for (const hazard of run.hazards) {
      if (hazard.type === "spikes") {
        if (hazard.x > right || hazard.x + hazard.width < left) continue;
        const triangles = spikeTriangles(run, hazard);
        for (const triangle of triangles) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(triangle.ax, triangle.ay);
          ctx.lineTo(triangle.bx, triangle.by);
          ctx.lineTo(triangle.cx, triangle.cy);
          ctx.closePath();
          ctx.fillStyle = run.level.accent === "#ffc44d" ? "#ff6b5e" : "#ff4d9d";
          ctx.fill();
          ctx.strokeStyle = "#f8f4e8";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      } else if (hazard.type === "saw") {
        if (hazard.x + hazard.r < left || hazard.x - hazard.r > right) continue;
        drawSaw(run, hazard);
      } else if (hazard.type === "block") {
        if (hazard.x + hazard.w < left || hazard.x > right) continue;
        ctx.save();
        ctx.fillStyle = "#08050f";
        ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
        ctx.strokeStyle = run.level.accent;
        ctx.lineWidth = 3;
        ctx.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        for (let y = hazard.y + 16; y < hazard.y + hazard.h; y += 20) {
          ctx.beginPath();
          ctx.moveTo(hazard.x + 5, y);
          ctx.lineTo(hazard.x + hazard.w - 5, y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  function drawSaw(run, hazard) {
    const rotation = state.attractTime * 5.6 + hazard.x * 0.01;
    const teeth = 11;
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let index = 0; index < teeth * 2; index += 1) {
      const angle = (index / (teeth * 2)) * Math.PI * 2;
      const radius = index % 2 === 0 ? hazard.r : hazard.r * 0.73;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "#0a0612";
    ctx.fill();
    ctx.strokeStyle = run.level.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, hazard.r * 0.38, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(248,244,232,0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hazard.r * 0.36, 0);
    ctx.lineTo(hazard.r * 0.36, 0);
    ctx.moveTo(0, -hazard.r * 0.36);
    ctx.lineTo(0, hazard.r * 0.36);
    ctx.stroke();
    ctx.restore();
  }

  function drawPickups(run, view) {
    const left = run.cameraX - 70;
    const right = run.cameraX + view.width + 70;
    for (const pickup of run.pickups) {
      if (pickup.taken || pickup.x < left || pickup.x > right) continue;
      const bob = Math.sin(state.attractTime * 3 + pickup.x * 0.01) * 6;
      ctx.save();
      ctx.translate(pickup.x, pickup.y + bob);
      ctx.rotate(Math.PI * 0.25 + state.attractTime * 0.6);
      ctx.fillStyle = run.level.secondary;
      ctx.strokeStyle = "#f8f4e8";
      ctx.lineWidth = 2;
      ctx.fillRect(-11, -11, 22, 22);
      ctx.strokeRect(-11, -11, 22, 22);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.strokeStyle = run.level.secondary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y + bob, 25 + Math.sin(state.attractTime * 2) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function traceTrail(run) {
    if (run.trail.length < 2) return;
    ctx.save();
    ctx.lineJoin = "miter";
    ctx.lineCap = "square";
    const focusActive = run.focus.active > 0;
    const glowColor = focusActive ? "#47e8ff" : run.level.accent;

    ctx.beginPath();
    run.trail.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 18;
    ctx.stroke();
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#f8f4e8";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(run) {
    const player = run.player;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    if (run.focus.active > 0) {
      ctx.strokeStyle = "#47e8ff";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-3, 0, 30, -0.7, 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-3, 0, 39, -0.45, 0.45);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.moveTo(27, 0);
    ctx.lineTo(-17, -13);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-17, 13);
    ctx.closePath();
    ctx.fillStyle = "#f8f4e8";
    ctx.fill();
    ctx.strokeStyle = run.focus.active > 0 ? "#47e8ff" : run.level.secondary;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fillStyle = run.level.accent;
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x - particle.size * 0.5,
        particle.y - particle.size * 0.5,
        particle.size,
        particle.size,
      );
    }
    ctx.globalAlpha = 1;
  }

  function drawRun(run, view) {
    const shakeAmount = run.shake;
    const shakeX = shakeAmount > 0 ? randomBetween(-shakeAmount, shakeAmount) : 0;
    const shakeY = shakeAmount > 0 ? randomBetween(-shakeAmount, shakeAmount) * 0.55 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.scale(view.scale, view.scale);
    ctx.translate(-run.cameraX, 0);

    drawTerrain(run, view);
    drawHazards(run, view);
    drawPickups(run, view);
    traceTrail(run);
    drawPlayer(run);
    drawParticles();
    ctx.restore();

    if (run.flash > 0) {
      ctx.fillStyle = `rgba(255,93,78,${run.flash * 0.14})`;
      ctx.fillRect(0, 0, view.cssWidth, view.cssHeight);
    }
  }

  function render() {
    resizeCanvas();
    const view = state.view;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, view.cssWidth, view.cssHeight);
    const cameraX = state.run ? state.run.cameraX : state.attractTime * 50;
    drawBackdrop(view, cameraX);

    if (state.screen === "menu") {
      drawAttractLayer(view);
    } else if (state.run) {
      drawRun(state.run, view);
    }
  }

  function frame(timestamp) {
    const rawDelta = state.lastFrame ? (timestamp - state.lastFrame) / 1000 : 0;
    const dt = clamp(rawDelta || 0.016, 0, 0.033);
    state.lastFrame = timestamp;
    state.attractTime += dt;

    if (state.screen === "playing") updateRun(dt);
    else if (state.screen === "menu") updateAttract(dt);
    else {
      updateParticles(dt);
      if (state.run) {
        state.run.flash = Math.max(0, state.run.flash - dt * 1.8);
        state.run.shake = Math.max(0, state.run.shake - dt * 45);
      }
    }
    const renderStarted = performance.now();
    render();
    const renderDuration = performance.now() - renderStarted;
    const metrics = state.performance;
    metrics.frames += 1;
    metrics.elapsed += rawDelta;
    metrics.renderMs = metrics.renderMs * 0.92 + renderDuration * 0.08;
    if (metrics.elapsed >= 0.5) {
      metrics.fps = metrics.frames / metrics.elapsed;
      metrics.frames = 0;
      metrics.elapsed = 0;
    }
    requestAnimationFrame(frame);
  }

  function handlePointerDown(event) {
    if (state.screen !== "playing") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    sound.init();
    state.held = true;
    launchRun();
    state.pointerId = event.pointerId;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional on older browsers.
    }
  }

  function handlePointerUp(event) {
    if (state.pointerId !== null && event.pointerId !== state.pointerId) return;
    state.held = false;
    state.pointerId = null;
  }

  function handleKeyDown(event) {
    const key = event.code;
    if ((key === "Space" || key === "ArrowUp" || key === "KeyW") && state.screen === "playing") {
      if (!event.repeat) {
        state.held = true;
        launchRun();
      }
      event.preventDefault();
      return;
    }
    if ((key === "ShiftLeft" || key === "ShiftRight" || key === "KeyE") && state.screen === "playing") {
      activateFocus();
      event.preventDefault();
      return;
    }
    if (key === "Escape") {
      if (state.screen === "playing") pauseRun();
      else if (state.screen === "paused") resumeRun();
      event.preventDefault();
      return;
    }
    if (key === "Enter" && state.screen === "menu") {
      startClassic();
      event.preventDefault();
      return;
    }
    if (key === "Space" && (state.screen === "dead" || state.screen === "complete")) {
      if (!overlay.classList.contains("is-hidden")) {
        state.overlayActionPrimary?.();
        event.preventDefault();
      }
    }
  }

  function handleKeyUp(event) {
    if (["Space", "ArrowUp", "KeyW"].includes(event.code)) state.held = false;
  }

  function bindEvents() {
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("blur", () => {
      state.held = false;
      state.pointerId = null;
    });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", () => {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(resizeCanvas, 120);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.screen === "playing") pauseRun();
    });

    ui.startClassicButton.addEventListener("click", () => {
      sound.init();
      sound.click();
      startClassic(state.selectedLevel);
    });
    ui.startEndlessButton.addEventListener("click", () => {
      sound.init();
      sound.click();
      startEndless();
    });
    ui.pauseButton.addEventListener("click", pauseRun);
    ui.focusButton.addEventListener("click", activateFocus);
    ui.soundButton.addEventListener("click", toggleSound);
    ui.fullscreenButton.addEventListener("click", toggleFullscreen);
    ui.brandButton.addEventListener("click", () => {
      if (state.screen === "playing") pauseRun();
      else if (state.screen !== "menu") returnToMenu();
    });
    ui.primaryAction.addEventListener("click", () => state.overlayActionPrimary?.());
    ui.secondaryAction.addEventListener("click", () => state.overlayActionSecondary?.());
    document.addEventListener("fullscreenchange", () => {
      ui.fullscreenButton.setAttribute(
        "aria-label",
        document.fullscreenElement ? "退出全屏" : "进入全屏",
      );
    });
  }

  function init() {
    makeStars();
    buildLevelPicker();
    updateMenuStats();
    bindEvents();
    resizeCanvas();
    setScreen("menu");
    requestAnimationFrame(frame);

    const playMode = new URLSearchParams(window.location.search).get("play");
    if (playMode !== null) {
      if (playMode === "endless") startEndless();
      else startClassic();
    }
  }

  window.__foldDashDebug = {
    startClassic(index = 0, options = {}) {
      startRun("classic", index, options);
    },
    startEndless(options = {}) {
      startRun("endless", -1, options);
    },
    forceComplete() {
      if (state.run?.mode === "classic") {
        state.run.player.x = state.run.finishX;
        completeRun();
      }
    },
    forceFail() {
      failRun("调试碰撞");
    },
    snapshot() {
      if (!state.run) return { screen: state.screen, run: null };
      return {
        screen: state.screen,
        mode: state.run.mode,
        levelIndex: state.run.levelIndex,
        x: state.run.player.x,
        y: state.run.player.y,
        vy: state.run.player.vy,
        distance: state.run.distance,
        time: state.run.time,
        charges: state.run.focus.charges,
        collected: state.run.collected,
      };
    },
    course() {
      if (!state.run) return null;
      return {
        mode: state.run.mode,
        levelIndex: state.run.levelIndex,
        segments: state.run.segments.map((segment) => ({ ...segment })),
        hazards: state.run.hazards.map((hazard) => ({ ...hazard })),
        pickups: state.run.pickups.map((pickup) => ({ ...pickup })),
      };
    },
    extendEndless(targetX) {
      if (state.run?.mode !== "endless") return false;
      state.run.player.x = Math.max(state.run.player.x, Number(targetX) || 0);
      appendEndlessCourse(state.run);
      return true;
    },
    placePlayer(x, y) {
      if (!state.run) return false;
      state.run.player.x = Number(x);
      state.run.player.y = Number(y);
      state.run.player.vy = 0;
      state.run.trail.push({ x: state.run.player.x, y: state.run.player.y });
      return true;
    },
    setHeld(value) {
      state.held = Boolean(value);
      if (state.held) launchRun();
    },
    performance() {
      return {
        fps: state.performance.fps,
        renderMs: state.performance.renderMs,
        dpr: state.dpr,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      };
    },
    benchmarkRender(frameCount = 120) {
      const started = performance.now();
      for (let index = 0; index < frameCount; index += 1) render();
      return (performance.now() - started) / frameCount;
    },
  };

  init();
})();
